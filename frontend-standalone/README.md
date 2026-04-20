NNIT Freelance — Standalone Frontend

This static frontend is intentionally self-contained and separate from any NNIT Cloud frontend.
It calls the backend at `/api/*` on the same origin.

Files:
- `index.html` — UI for auth, notifications, audit, and simple job listing.
- `api.js` — minimal fetch wrapper exposing `apiRequest` and `notificationsAPI`.
- `app.js` — wiring + in-memory token storage for quick testing.

Usage:
- The backend already mounts this folder at `/standalone` (or at `/free`).
- Open `http://localhost:3003/standalone` to use the UI.

Notes:
- Token stored in-memory (not persisted) for demo purposes.
- Extend job application/payment flows to your backend endpoints as needed.
