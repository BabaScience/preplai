# apps/

Deployable applications. Each subdirectory is an independently deployable unit.

| App | Description | Stack |
|-----|-------------|-------|
| `website/` | preplai.com — marketing site + user dashboard | HTML/CSS/JS + Python CGI |

## Adding a new app

Create a new directory under `apps/`. Each app should have its own README with deployment instructions. Apps are NOT npm workspaces — they can use any stack.
