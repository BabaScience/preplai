# Connect ChatGPT

Connect preplai to ChatGPT in about 2 minutes. Works on ChatGPT Web, Desktop, and mobile — you only set it up once.

ChatGPT uses **OAuth** — you click "Connect" and authorize through your browser. No config files needed.

---

## 1. Get your OAuth credentials

Go to [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors) and create an OAuth client:

1. Click **Create OAuth Client**
2. Add this **redirect URI** (ChatGPT needs it to complete the authorization):
   - `https://chatgpt.com/connector_platform_oauth_redirect`
3. Save — you'll get:
   - **Client ID** — looks like `client_abc123...`
   - **Client Secret** — looks like `secret_xyz789...`

Keep this page open — you'll need both in the next step.

---

## 2. Create the connector in ChatGPT

1. Go to [chat.openai.com](https://chat.openai.com)
2. Open **Settings → Apps & Connectors**
3. If you see an **Advanced settings** option at the bottom, turn on **Developer mode** (some accounts have this already enabled)
4. Click **Create** and fill in:
   - **Name:** `preplai`
   - **Description:** `Create cinema-quality visual presentations`
   - **URL:** `https://player.preplai.com/mcp`
5. Open **Advanced settings** and paste your **Client ID** and **Client Secret**
6. Click **Create**
7. Click **Connect** to authorize preplai

You should see a list of preplai's tools appear. That means it's working.

---

## 3. Use it in chat

1. Start a new chat in ChatGPT
2. Click the **+** button near the message box, then **More**
3. Select **preplai** from your connectors
4. Try a prompt like:

> **"Using Preplai, create a visual explanation of how OAuth authentication works"**

ChatGPT will build the presentation and give you a link to watch it.

**Tip:** Including "Using Preplai" in your prompt tells ChatGPT to use preplai for the visual. Without it, ChatGPT might respond with plain text instead.

---

## ChatGPT Desktop & Mobile

Good news — you don't need to set up anything extra. Connectors you create on the web automatically sync to ChatGPT Desktop and mobile. Just sign in with the same account.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find "Create" button | Make sure Developer mode is enabled in Settings → Apps & Connectors → Advanced settings |
| OAuth fails | Double-check your Client ID and Secret from [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors) |
| "redirect_uri not registered" | Make sure you added `https://chatgpt.com/connector_platform_oauth_redirect` as a redirect URI in your OAuth client |
| Tools not showing up | Click **Refresh** on your preplai connector in Settings |
| Not showing on Desktop | Make sure you're signed into the same account on both web and desktop |
| "Not available for your plan" | ChatGPT Apps requires Plus, Business, Enterprise, or Education plans |
