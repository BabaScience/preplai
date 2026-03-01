# preplai.com Website + Dashboard

The marketing website and user dashboard for [preplai.com](https://preplai.com).

## Overview

This is a single-page application (SPA) with hash-based routing and a Python CGI backend. It serves both the public marketing site and the authenticated dashboard where users manage API keys and monitor usage.

## Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework, no build step)
- **Backend**: Python 3 CGI script with SQLite
- **Fonts**: Instrument Serif (display), Inter (body/UI), JetBrains Mono (code)
- **Charts**: Chart.js for usage visualization
- **Icons**: Lucide

## Pages

### Public
- **Landing** (`#home`) — Hero, features, pricing, setup guide, footer
- **Sign Up** (`#signup`) — Create account form
- **Log In** (`#login`) — Authentication form

### Dashboard (authenticated)
- **Overview** (`#dashboard/overview`) — KPI cards: API keys, requests, sessions, scenes
- **API Keys** (`#dashboard/keys`) — Create, view, revoke API keys (plai_ prefix)
- **Usage** (`#dashboard/usage`) — Bar chart, progress bars, recent API calls table
- **Settings** (`#dashboard/settings`) — Password change, account deletion

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /signup | Create account |
| POST | /login | Authenticate |
| GET | /me | Current user info |
| POST | /keys | Create API key |
| GET | /keys | List API keys |
| DELETE | /keys?id=X | Revoke API key |
| GET | /usage | Usage data + daily breakdown |
| GET | /overview | Dashboard KPI summary |
| POST | /settings/password | Change password |
| DELETE | /account | Delete account permanently |

## API Key Format

- Prefix: `plai_` + 40 random hex characters
- Storage: SHA-256 hashed (raw key shown once at creation)
- Display: `plai_xxxx...yyyy` (first 9 + last 4 chars)

## Tier Limits

| | Free | Pro | Enterprise |
|---|---|---|---|
| Sessions | 5 | 100/mo | Unlimited |
| Scenes/month | 50 | 2,000 | Unlimited |
| Scenes/session | 10 | 100 | Unlimited |
| Link expiry | 7 days | 90 days | Never |
| Price | $0 | $19/mo | Custom |

## Local Development

No build step required. Serve the directory with any static file server:

```bash
cd apps/website
python3 -m http.server 8080
```

The CGI backend requires a CGI-capable server. In production, the `__CGI_BIN__` placeholder in app.js is replaced with the actual API URL at deploy time.

## Design

- **Dark-first** palette: `#0b0c10` background, `#C9A84C` gold accent
- **Light mode**: warm off-white `#FAFAF8`, muted gold `#B8952F`
- 4px spacing system with fluid `clamp()` type scale
- Golden easing: `cubic-bezier(0.16, 1, 0.3, 1)` for all transitions
