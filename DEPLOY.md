# JAPA DIARY — Deployment, Testing and Troubleshooting

Order matters: **Sheet → Apps Script → Worker → GitHub**. Keep a note of: Apps Script URL, secret, Worker URL.

## 1. Google Sheets
1. sheets.google.com → Blank spreadsheet → name it `JAPA DIARY`. Leave sharing as **Restricted** (never "Anyone with the link").
2. Do not create columns by hand: step 2 does it (worksheet `JapaEntries`; A Date, B Time, C Naam Jaap, D Number of Naam Jaap, E Remark, F Unique ID hidden). Date/Time are stored as plain text `DD-MM-YYYY` and `HH:MM AM/PM` so Sheets never reformats them.

## 2. Google Apps Script
1. In the sheet: **Extensions → Apps Script**. Delete the sample code, paste all of `apps-script/Code.gs`, save.
2. Choose function `setup` → **Run**. Approve the permission prompt (Advanced → Go to project → Allow). Check the sheet now has the `JapaEntries` tab with headers.
3. **Project Settings (gear) → Script Properties → Add**: name `SHARED_SECRET`, value = a long random string (30+ characters; generate with a password manager). Keep a copy.
4. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone** (the secret is what protects it). Deploy, copy the **Web app URL** (ends in `/exec`).
5. After any later code change: Deploy → Manage deployments → edit → **New version** (the URL stays the same).

## 3. Cloudflare Worker
1. dash.cloudflare.com → Workers & Pages → Create → Worker → name `japa-diary-api` → Deploy, then **Edit code**, replace with `worker/index.js`, Deploy.
2. Worker → Settings → **Variables and Secrets**:
   - `APPS_SCRIPT_URL` (Text) = the `/exec` URL
   - `APPS_SCRIPT_SECRET` (**Secret**) = same value as `SHARED_SECRET`
   - `ALLOWED_ORIGIN` (Text) = `https://YOURUSERNAME.github.io` (origin only: no path, no trailing slash)
3. Recommended: Cloudflare dashboard → Security → WAF → Rate limiting rules → limit `POST` to your Worker host to e.g. 30 requests/minute per IP. (The Worker also has a best-effort in-code limiter.)
4. Copy the Worker URL, e.g. `https://japa-diary-api.NAME.workers.dev/`.
5. Test (terminal): `curl -X POST WORKER_URL -H "Content-Type: application/json" -d '{"op":"dashboard","ids":[]}'` → `{"ok":true,"perDay":{},...}`. A bad body should give `Invalid request`.

## 4. GitHub Pages
1. github.com → New repository, e.g. `japa-diary` (Public is required for free Pages). Upload every file in this folder except `node_modules` and `dist` (or use git: `git init && git add . && git commit -m init && git branch -M main && git remote add origin URL && git push -u origin main`).
2. Repo → Settings → **Secrets and variables → Actions → Variables → New repository variable**: `API_URL` = Worker URL. (It's public by design; it is not a secret. Never put the Apps Script secret on GitHub.)
3. Settings → **Pages → Source: GitHub Actions**.
4. Actions tab → "Deploy to GitHub Pages" runs on every push (it also runs the tests). The site is at `https://YOURUSERNAME.github.io/japa-diary/`. The base path is set automatically from the repo name, so a project URL works.
5. Open it on your phone → browser menu → **Add to Home screen** (iPhone: Share → Add to Home Screen). Open it once online first so it can cache itself for offline use.

Local run: `npm install`, copy `.env.example` to `.env.local`, fill in `VITE_API_URL`, `npm run dev`. (Add `http://localhost:5173` to `ALLOWED_ORIGIN`, comma-separated, while developing.)

## Security notes (read once)
There is no login by your choice, so **anyone who learns the site URL can open it, and could submit entries or read the totals through the Worker**. The secret, origin check and rate limits stop casual abuse and keep the spreadsheet itself private, but do not make the app exclusive. Do not share the URL.

## Testing checklist
Automated (`npm test`): 1 Mala→108, 5→540, 10→1080, 250 Naam→250; rejects 0, empty, negative, decimal; Naam name cleaning; IST date/time format. Manual below (tick each):

**Entry form**: ☐ 1/5/10 Mala and 250 Naam give 108/540/1080/250 in Column D ☐ typing and +/− work, minus stops at 0 ☐ Save disabled at 0; "1.5" and "-2" show an error ☐ remark left blank saves fine
**Naam memory**: ☐ new Naam appears after save ☐ close and reopen: still listed ☐ latest-used first ☐ "om namah" vs " Om  Namah " does not create a duplicate
**Sheet**: ☐ five visible columns, F hidden (select E:G → right-click → Unhide) ☐ rows only ever appended ☐ re-sending an ID (Worker curl twice) returns `duplicate:true` and adds no row
**Offline**: ☐ browser DevTools → Network → Offline ☐ save → shows "Saved on this device — Waiting for synchronisation." ☐ close tab, reopen offline: entry still counted on Dashboard with the pending note ☐ go online: syncs automatically, exactly one row, original date/time kept ☐ Dashboard total does not double count
**Dashboard**: ☐ lifetime = sum of Column D ☐ today/month use IST ☐ Mala equivalent = lifetime ÷ 108 (2 decimals) ☐ 7/30-day chart with zero days; hover shows exact count ☐ Naam-wise list sorted high→low and sums to lifetime ☐ switching apps and returning refreshes ☐ Refresh button updates "Last updated"; with Worker blocked it shows the "may be out of date" notice
**Theme**: ☐ opens light ☐ toggle to dark ☐ stays dark after reopening

## Troubleshooting
- **Entries stay "Pending synchronisation"**: open `WORKER_URL` check with the curl test; confirm `VITE_API_URL`/`API_URL` is the Worker URL and the site was rebuilt after setting it.
- **Browser shows CORS error / "Origin not allowed"**: `ALLOWED_ORIGIN` must equal exactly `https://USER.github.io` (no `/japa-diary`, no trailing slash).
- **"Backend rejected the request" (502)**: `APPS_SCRIPT_SECRET` ≠ `SHARED_SECRET`, or the deployment isn't set to "Anyone", or you forgot to publish a New version after editing.
- **"Run setup() first"**: run `setup` once from the Apps Script editor.
- **Blank page / 404 on assets**: Pages source must be "GitHub Actions"; check the Actions run is green.
- **Changes don't appear after redeploy**: the service worker caches the shell; reload twice, or clear site data (this does **not** delete synced entries, but would delete unsynced pending ones, so sync first).
- **Slow first save after idle**: Apps Script cold starts can take several seconds; the entry is already safe locally.
