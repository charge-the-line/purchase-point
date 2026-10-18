PURCHASE POINT — HOSTING
Part of Preconnect (https://preconnect.org/). This folder is the whole app:
index.html, preconnect-core.js, manifest.json, sw.js, icon-192.png, icon-512.png, fonts/
(plus tests/, TESTING.md, CHANGELOG.md and CLAUDE.md, which do not affect the app).

GitHub Pages serves the main branch root of the charge-the-line/purchase-point repository at
https://preconnect.org/purchase-point/. Committing to main deploys within a minute or two.
Every release bumps APP_VERSION in index.html and CACHE in sw.js together.
