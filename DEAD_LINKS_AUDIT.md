# Dead Links Audit — preplai.com

Audited: 2026-03-31

---

## Dead Links Found

### 1. `https://docs.preplai.com` — External domain unreachable (HTTP 000)

**Status:** Dead — connection error
**Suggested fix:** Replace with internal `/docs` route

| Source File | Line |
|---|---|
| `apps/website/src/pages/Landing.jsx` | 314 |
| `apps/website/src/pages/Pricing.jsx` | 186 |
| `apps/website/src/pages/Terms.jsx` | 148 |
| `apps/website/src/pages/Privacy.jsx` | 121 |

---

### 2. `/docs/mcp-tools` — Internal route not registered in DOC_SLUGS

**Status:** Dead — falls through to redirect `/docs/quick-start`
**Suggested fix:** Add `mcp-tools` slug to `DOC_SLUGS` and import `mcp-tools.md` in `Docs.jsx`

| Source File | Note |
|---|---|
| `apps/website/src/blog/content/how-ai-agents-create-presentations.md` | Link in body text |
| `apps/website/src/blog/content/mcp-for-presentations.md` | Footer reference |

---

### 3. `/docs/visualscript` — Internal route not registered in DOC_SLUGS

**Status:** Dead — falls through to redirect `/docs/quick-start`
**Suggested fix:** Add `visualscript` slug to `DOC_SLUGS` and import `visualscript.md` in `Docs.jsx`

| Source File | Note |
|---|---|
| `apps/website/src/docs/mcp-tools.md` | Multiple cross-references |
| `apps/website/src/blog/content/visualscript-explained.md` | Footer reference |
| `apps/website/src/blog/content/how-ai-agents-create-presentations.md` | Link in body text |

---

### 4. `https://play.preplai.com/abc123` — Wrong subdomain

**Status:** Dead — `play.preplai.com` returns HTTP 000; all other references use `player.preplai.com`
**Suggested fix:** Change to `https://player.preplai.com/player/abc123`

| Source File | Line |
|---|---|
| `apps/website/src/blog/content/how-ai-agents-create-presentations.md` | 22 |

---

## Summary

| # | Type | Location | Fix |
|---|---|---|---|
| 1 | External domain dead | Footer in 4 pages | Change to `/docs` |
| 2 | Internal route missing | Blog posts | Add `mcp-tools` doc slug |
| 3 | Internal route missing | Blog + doc cross-refs | Add `visualscript` doc slug |
| 4 | Wrong subdomain | Blog post | Fix `play.` → `player.` |
