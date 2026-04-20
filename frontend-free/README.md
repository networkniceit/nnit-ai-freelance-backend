NNIT Free Frontend

This is a small standalone static frontend intended to be served from the backend at `/free`.

Files:
- `index.html` — simple UI for auth, notifications, and audit logs.
- `api.js` — minimal fetch-based API helper (no NNIT Cloud SDKs).
- `app.js` — UI wiring and token storage (in-memory).

How to use:
1. Start the backend (ensure it's running and exposes `/api/*` endpoints).
2. Open `http://localhost:3003/free` (or adjust port if using backend production file).

Notes:
- This frontend intentionally avoids NNIT Cloud integrations and external SDKs.
- Token is stored in-memory for demo purposes.
