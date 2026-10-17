# Personal Entry Software — Buta / Top

Mobile-first Gujarati/English personal ledger built with React, TypeScript, Tailwind CSS, Node.js/Express and MongoDB. **No signup, login, dashboard or additional pages.**

## How it works

- Opens to the **Buta** name list; switch between separate Buta and Top lists with sidebar/bottom navigation.
- **Search exists only on the customer name lists** in both sections; no entry search or filters.
- Select a name to see **all entries, across all dates**, in one vertically scrolling ledger.
- Every entry has its own displayed, editable date. New entries default to your device's actual local date.
- Add/edit names and entries in focused **Save / Cancel modal forms**. Cancel never changes your saved records.
- Quantity × editable rate = row amount; initial rate is ₹0.16 (Buta) or ₹0.40 (Top).
- Each entry has an optional title, quantity, price, date and completion checkbox.
- **Grand total includes every entry for that name**, regardless of date or completion.
- Edit/Delete actions are always visible; delete uses an in-app confirmation modal.
- If database loading fails, the ledger shows an error and **Retry** rather than falsely claiming the customer has no entries.
- Checkbox saves are serialized per entry; modal edits and deletes wait for a pending checkbox save to finish.
- A small success toast appears for **1.8 seconds** after confirmed save/delete/checkbox changes. No flickering permanent "Saved" status.
- Desktop displays one full-width ledger row per entry; mobile uses compact touch-friendly rows, no horizontal scrolling.
- Desktop sidebar stays stationary while the page scrolls.

## Run locally

Node.js 20.19+ and npm required.

1. Install packages: `npm install`
2. Keep exactly one local secret config file: `server/.env`. Do not commit it.

   ```env
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/personal_entry
   PORT=4000
   ```

   Keep the two slashes in `mongodb+srv://` and URL-encode reserved characters in your password.
3. Start: `npm run dev`
4. Check `http://localhost:4000/api/health` → `{"ok":true}` when MongoDB is connected.
5. Open `http://localhost:5173`.

MongoDB Atlas creates the database and collections automatically on first save. The app does not require `.env.example`.

## Other commands

- `npm run check` — TypeScript checks
- `npm test` — calculation/date tests
- `npm run build` — frontend/backend production build
- `npm start` — Node production server (after building)

The backend serves the compiled frontend and API on the same origin in production. In development, Vite proxies `/api` to `127.0.0.1:4000`.

## API

- `GET /api/names?section=buta|top` — list names
- `POST /api/names`, `PATCH /api/names/:id`, `DELETE /api/names/:id`
- `GET /api/names/:id/entries` — **all dates; no date query required**
- `POST /api/names/:id/entries`, `PATCH /api/entries/:id`, `DELETE /api/entries/:id`
- `GET /api/health`

## Important security note

This app deliberately has **no login**. Do not expose its API publicly without restricting access at the network/hosting level; anyone who can open a public deployment could read, edit or delete your data. A private repository does not protect a public deployment. Use a trusted VPN/network gateway if you need remote access. **Never upload `server/.env` to GitHub.**

## Quick manual regression checklist

After pulling changes and connecting to Atlas (`/api/health` returns `{"ok":true}`), run these checks with test data:

1. Create two distinct customer names in Buta and Top; search names in each section and verify they remain separate.
2. Open a customer, add entries with quantities and default rates (Buta ₹0.16, Top ₹0.40), and confirm the row and grand totals.
3. Edit an entry's title, date, quantity, rate and completion status; check that **Cancel** does not save and **Save** does.
4. Rapidly toggle one completion checkbox and verify unrelated rows do not flicker or change; refresh to confirm persistence.
5. Verify rows from different dates appear in the same customer ledger without a date filter; grand total covers all.
6. Check Delete → Cancel leaves everything unchanged. Delete one entry, and verify its total disappears. Delete a test customer and verify it no longer appears.
7. Test narrow mobile width (around 360px) and desktop; the desktop sidebar must stay stationary while scrolling.
8. Verify success toasts vanish after about 1.8 seconds and that API outages show an error/retry rather than an empty ledger.

Unit tests/builds do not replace a live Atlas/browser smoke test; do not use irreplaceable real records for destructive testing.
