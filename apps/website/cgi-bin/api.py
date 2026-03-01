#!/usr/bin/env python3
"""preplai Dashboard API — CGI backend with SQLite."""

import json
import os
import sys
import sqlite3
import hashlib
import secrets
import time
from datetime import datetime, timedelta
from urllib.parse import parse_qs

# ── Database ──────────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "preplai_dashboard.db")

def get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")
    return db

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key_hash TEXT NOT NULL,
            key_prefix TEXT NOT NULL,
            key_suffix TEXT NOT NULL,
            name TEXT DEFAULT 'Default',
            tier TEXT DEFAULT 'free',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS usage_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_key_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            endpoint TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    db.commit()
    db.close()

init_db()

# ── Helpers ───────────────────────────────────────────────

def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return h, salt

def hash_api_key(key):
    return hashlib.sha256(key.encode()).hexdigest()

def generate_api_key():
    return "plai_" + secrets.token_hex(20)

def generate_token():
    return secrets.token_hex(32)

def read_body():
    length = int(os.environ.get("CONTENT_LENGTH", 0))
    if length > 0:
        return json.loads(sys.stdin.read(length))
    return {}

def respond(data, status=200):
    print(f"Status: {status}")
    print("Content-Type: application/json")
    print()
    print(json.dumps(data))
    sys.exit(0)

def error(msg, status=400):
    respond({"error": msg}, status)

def get_current_user(db):
    auth = os.environ.get("HTTP_AUTHORIZATION", "")
    if not auth.startswith("Bearer "):
        error("Unauthorized", 401)
    token = auth[7:]
    row = db.execute(
        "SELECT s.user_id, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?",
        (token, datetime.utcnow().isoformat())
    ).fetchone()
    if not row:
        error("Session expired", 401)
    return dict(row)

# ── Demo seed ─────────────────────────────────────────────

def _seed_demo_data(db, user_id):
    """Seed demo usage data for a new user."""
    import random
    raw_key = generate_api_key()
    k_hash = hash_api_key(raw_key)
    prefix = raw_key[:9]
    suffix = raw_key[-4:]
    cur = db.execute(
        "INSERT INTO api_keys (user_id, key_hash, key_prefix, key_suffix, name, tier) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, k_hash, prefix, suffix, "Demo Key", "free")
    )
    key_id = cur.lastrowid
    endpoints = ["/create_session", "/add_scene", "/add_scene", "/add_scene", "/update_scene", "/get_session"]
    now = datetime.utcnow()
    for days_ago in range(30, 0, -1):
        count = random.randint(0, 8)
        for _ in range(count):
            ts = (now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))).isoformat()
            ep = random.choice(endpoints)
            db.execute("INSERT INTO usage_log (api_key_id, user_id, endpoint, created_at) VALUES (?, ?, ?, ?)",
                       (key_id, user_id, ep, ts))

# ── Routes ────────────────────────────────────────────────

method = os.environ.get("REQUEST_METHOD", "GET")
path = os.environ.get("PATH_INFO", "")
query = os.environ.get("QUERY_STRING", "")
params = parse_qs(query)

db = get_db()

# POST /signup
if method == "POST" and path == "/signup":
    body = read_body()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password", "")
    if not email or not password:
        error("Email and password required")
    if len(password) < 6:
        error("Password must be at least 6 characters")
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        error("Email already registered")
    pw_hash, salt = hash_password(password)
    cur = db.execute("INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)", (email, pw_hash, salt))
    user_id = cur.lastrowid
    token = generate_token()
    expires = (datetime.utcnow() + timedelta(days=7)).isoformat()
    db.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)", (user_id, token, expires))
    # Seed some usage data for demo
    _seed_demo_data(db, user_id)
    db.commit()
    respond({"user_id": user_id, "email": email, "token": token}, 201)

# POST /login
elif method == "POST" and path == "/login":
    body = read_body()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password", "")
    if not email or not password:
        error("Email and password required")
    user = db.execute("SELECT id, email, password_hash, salt FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        error("Invalid credentials", 401)
    pw_hash, _ = hash_password(password, user["salt"])
    if pw_hash != user["password_hash"]:
        error("Invalid credentials", 401)
    token = generate_token()
    expires = (datetime.utcnow() + timedelta(days=7)).isoformat()
    db.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)", (user["id"], token, expires))
    db.commit()
    respond({"user_id": user["id"], "email": user["email"], "token": token})

# GET /me
elif method == "GET" and path == "/me":
    user = get_current_user(db)
    respond({"user_id": user["user_id"], "email": user["email"]})

# POST /keys — create
elif method == "POST" and path == "/keys":
    user = get_current_user(db)
    body = read_body()
    name = (body.get("name") or "Default").strip()
    raw_key = generate_api_key()
    k_hash = hash_api_key(raw_key)
    prefix = raw_key[:9]  # "plai_" + first 4 hex chars
    suffix = raw_key[-4:]
    cur = db.execute(
        "INSERT INTO api_keys (user_id, key_hash, key_prefix, key_suffix, name) VALUES (?, ?, ?, ?, ?)",
        (user["user_id"], k_hash, prefix, suffix, name)
    )
    key_id = cur.lastrowid
    db.commit()
    respond({
        "key_id": key_id,
        "key": raw_key,
        "name": name,
        "tier": "free",
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }, 201)

# GET /keys — list
elif method == "GET" and path == "/keys":
    user = get_current_user(db)
    rows = db.execute(
        "SELECT id, key_prefix, key_suffix, name, tier, status, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
        (user["user_id"],)
    ).fetchall()
    keys = []
    for r in rows:
        keys.append({
            "id": r["id"],
            "key_display": r["key_prefix"] + "..." + r["key_suffix"],
            "name": r["name"],
            "tier": r["tier"],
            "status": r["status"],
            "created_at": r["created_at"],
            "last_used_at": r["last_used_at"]
        })
    respond({"keys": keys})

# DELETE /keys?id=X — revoke
elif method == "DELETE" and path == "/keys":
    user = get_current_user(db)
    key_id = params.get("id", [None])[0]
    if not key_id:
        error("Key ID required")
    db.execute("UPDATE api_keys SET status = 'revoked' WHERE id = ? AND user_id = ?", (key_id, user["user_id"]))
    db.commit()
    respond({"success": True})

# GET /usage
elif method == "GET" and path == "/usage":
    user = get_current_user(db)
    uid = user["user_id"]
    # Daily usage for last 30 days
    daily = db.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM usage_log WHERE user_id = ? AND created_at > DATE('now', '-30 days')
        GROUP BY DATE(created_at) ORDER BY day
    """, (uid,)).fetchall()
    # Recent calls
    recent = db.execute("""
        SELECT ul.created_at, ul.endpoint, ak.key_prefix || '...' || ak.key_suffix as key_display
        FROM usage_log ul JOIN api_keys ak ON ul.api_key_id = ak.id
        WHERE ul.user_id = ? ORDER BY ul.created_at DESC LIMIT 20
    """, (uid,)).fetchall()
    # Totals
    total_scenes = db.execute("SELECT COUNT(*) as c FROM usage_log WHERE user_id = ?", (uid,)).fetchone()["c"]
    month_scenes = db.execute(
        "SELECT COUNT(*) as c FROM usage_log WHERE user_id = ? AND created_at > DATE('now', 'start of month')",
        (uid,)
    ).fetchone()["c"]
    active_keys = db.execute(
        "SELECT COUNT(*) as c FROM api_keys WHERE user_id = ? AND status = 'active'", (uid,)
    ).fetchone()["c"]
    respond({
        "daily": [{"day": d["day"], "count": d["count"]} for d in daily],
        "recent": [{"created_at": r["created_at"], "endpoint": r["endpoint"], "key_display": r["key_display"]} for r in recent],
        "total_scenes": total_scenes,
        "month_scenes": month_scenes,
        "active_keys": active_keys,
        "limits": {"max_sessions": 5, "max_scenes_month": 50, "max_scenes_session": 10}
    })

# GET /overview
elif method == "GET" and path == "/overview":
    user = get_current_user(db)
    uid = user["user_id"]
    total_keys = db.execute("SELECT COUNT(*) as c FROM api_keys WHERE user_id = ?", (uid,)).fetchone()["c"]
    active_keys = db.execute("SELECT COUNT(*) as c FROM api_keys WHERE user_id = ? AND status = 'active'", (uid,)).fetchone()["c"]
    month_requests = db.execute(
        "SELECT COUNT(*) as c FROM usage_log WHERE user_id = ? AND created_at > DATE('now', 'start of month')",
        (uid,)
    ).fetchone()["c"]
    total_scenes = db.execute("SELECT COUNT(*) as c FROM usage_log WHERE user_id = ?", (uid,)).fetchone()["c"]
    respond({
        "total_keys": total_keys,
        "active_keys": active_keys,
        "month_requests": month_requests,
        "total_scenes": total_scenes,
        "active_sessions": 0
    })

# POST /settings/password
elif method == "POST" and path == "/settings/password":
    user = get_current_user(db)
    body = read_body()
    current = body.get("current_password", "")
    new_pw = body.get("new_password", "")
    if not current or not new_pw:
        error("Current and new password required")
    if len(new_pw) < 6:
        error("New password must be at least 6 characters")
    u = db.execute("SELECT password_hash, salt FROM users WHERE id = ?", (user["user_id"],)).fetchone()
    pw_hash, _ = hash_password(current, u["salt"])
    if pw_hash != u["password_hash"]:
        error("Current password is incorrect", 401)
    new_hash, new_salt = hash_password(new_pw)
    db.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (new_hash, new_salt, user["user_id"]))
    db.commit()
    respond({"success": True})

# DELETE /account
elif method == "DELETE" and path == "/account":
    user = get_current_user(db)
    uid = user["user_id"]
    db.execute("DELETE FROM usage_log WHERE user_id = ?", (uid,))
    db.execute("DELETE FROM api_keys WHERE user_id = ?", (uid,))
    db.execute("DELETE FROM sessions WHERE user_id = ?", (uid,))
    db.execute("DELETE FROM users WHERE id = ?", (uid,))
    db.commit()
    respond({"success": True})

else:
    error("Not found", 404)

db.close()
