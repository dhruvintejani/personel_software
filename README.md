# Personal Entry Software — Buta / Top

A fast, **mobile-first, Gujarati/English personal entry ledger** built with React, TypeScript, Tailwind CSS, Express and MongoDB. There is **no authentication or dashboard**: the app opens directly to Buta names. Switch to Top with one tap.

## Features

- **Two separate sections:** Buta (બુટા) and Top (ટોપ), with independent name lists and entries.
- Search names instantly on **both** pages, and open the search icon to find entry titles, quantities and amounts within a selected name.
- Add, rename and remove names; selecting a name opens its ledger.
- Today's **local** date selected by default; change it to view or add entries on any date. Slow entry creation will not mix records across dates.
- Unlimited entries per day, displayed as compact cards on mobile and a roomy responsive layout on desktop.
- Each entry has an optional title, quantity, editable rate, completion checkbox and automatic total.
- **No separate "into" input**: `quantity × price = row total`. Buta defaults to **₹0.16** and Top to **₹0.40**; changing one row's price never affects other rows.
- Grand total for **all** entries for the currently selected name and date, regardless of search/completion filter.
- Auto-save after a 650ms pause while typing, or immediately on field blur, and clear save/failure status.
- Change an existing entry's date under its expand-arrow menu; edit and delete entries.
- Compact touch-friendly entry controls, bottom section tabs and a fixed total on mobile.
- No analytics, reports, invoices, roles, notifications, payment features or other unnecessary screens.

## Stack

- `client/` — React 19, TypeScript, Vite 6, Tailwind CSS 3, Lucide icons.
- `server/` — Node.js, Express, TypeScript, Mongoose, Zod, Helmet.
- MongoDB or MongoDB Atlas to retain all saved data.

## Setup (Windows, macOS or Linux)

**Requirements:** Node.js 20.19+ (Node 22 LTS recommended), npm and your MongoDB connection string.

1. Clone/download this repository.
2. Install dependencies from the project root:

   ```bash
   npm install
   ```

3. Create `server/.env` by copying `server/.env.example` and replace the placeholder value:

   ```env
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/personal_entry?retryWrites=true&w=majority
   PORT=4000
   NODE_ENV=development
   ```

   - Never put your MongoDB URI in `client/` or any `VITE_` variable: frontend variables can be exposed to browsers.
   - For Atlas, create a database user and allow network access **only from your server's IP**, where possible.
   - The `.env` file is ignored by Git; **never commit credentials**.

4. Run both frontend and API together:

   ```bash
   npm run dev
   ```

5. Test **http://localhost:4000/api/health** first. `{"ok":true}` means the backend has connected to MongoDB; `{"ok":false}` means the backend is running, but the database has not connected yet. Check the terminal for `[api]` messages.
6. Open **http://localhost:5173** on your computer. The Vite dev server proxies `/api` requests to Express at port 4000.

### If you see a Vite proxy error or a blank name list

- Ensure you run `npm run dev` from the repository root, so **both** web and API processes start.
- The API explicitly loads **server/.env**, even when launched from a different directory. Make sure `MONGODB_URI` is correctly filled in, including your Atlas password and database name; restart the dev command if you change it.
- Open **http://localhost:4000/api/health**. If it does not respond, inspect the `[api]` terminal output; if it says `{"ok":false}`, verify database-user permissions and Atlas Network Access. API requests receive a helpful HTTP 503 until MongoDB is ready.
- The frontend proxy is fixed at `127.0.0.1:4000`; if you customize `PORT`, adjust `client/vite.config.ts` to match. Do not paste the private database URL into chat, the frontend, or GitHub.


### Using it on your phone during development

While the PC and phone are on the same Wi-Fi network, open `http://YOUR_PC_LOCAL_IP:5173` on your phone. Vite listens on the local network by default for this project, and the API remains proxied through the PC. Allow access through your PC firewall if asked. **Do not forward ports to the public internet.**

## Production

```bash
npm run build
npm start
```

The server serves React and `/api` together from port 4000. Set `MONGODB_URI`, `PORT` (if needed) and `NODE_ENV=production` in your Node hosting provider. Your provider must support a long-running Node server, not just static files. HTTPS is recommended.

**Important no-login security notice:** Any person who can access a publicly deployed app can see, change and delete your entries. A private GitHub repository protects source code **but does not protect a public deployment**. For private personal use, host it behind a private network/VPN or a trusted network access gateway, or run it on your own machine/local network. There are intentionally no user accounts, credentials or access restrictions inside the app.

## Useful commands

| Command | Action |
| --- | --- |
| `npm run dev` | Run frontend and backend in development |
| `npm run build` | Create frontend and backend builds |
| `npm start` | Run Node production server |
| `npm run check` | TypeScript type checks |
| `npm test` | Run basic calculation/date unit tests |

## Folder structure

```text
personal-entry-software/
  client/
    src/
      components/EntryRow.tsx
      components/NameLedger.tsx
      lib/api.ts
      lib/i18n.ts
      lib/types.ts
      App.tsx
      main.tsx
      styles.css
    index.html
    vite.config.ts
  server/
    src/index.ts
    src/math.ts
    tests/math.test.ts
    .env.example
  .gitignore
  package.json
  README.md
```

## API

`GET /api/names?section=buta|top`, `POST /api/names`, `PATCH /api/names/:id`, `DELETE /api/names/:id`, `GET /api/names/:id/entries?date=YYYY-MM-DD`, `POST /api/names/:id/entries`, `PATCH /api/entries/:id`, `DELETE /api/entries/:id`, `GET /api/health`.

Every entry belongs to one name, and every name belongs to either Buta or Top. MongoDB indexes accelerate name/date retrieval. API inputs are validated on the server. If a name is deleted, its entries are also deleted.

## Before sharing or deploying

1. Add your MongoDB Atlas URI to `server/.env` locally, **not GitHub**.
2. Run `npm install`, then `npm run check`, `npm test`, and `npm run build`.
3. Test create/edit/delete, date switching, search, completion checkboxes and desktop/mobile layouts with the live MongoDB service.
4. Host privately, as there is no authentication.

## Repository privacy

This repository is currently **public**. Do not commit real data, secrets, or `server/.env`. Because the software deliberately has no user login, use a private network, VPN, or a hosting-level access gateway before exposing a live deployment to the internet. GitHub repository privacy alone will not restrict access to a deployed application.
