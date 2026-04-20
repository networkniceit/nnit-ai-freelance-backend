# Copilot Instructions for NNIT-ai-freelance-backend

## Project Overview
Node.js/Express backend with feature-based frontend/mobile API modules for advanced business operations (exports, analytics, audit, etc.). Integrates with Slack, PayPal, Stripe, OpenAI, Firebase, AWS, and external NNIT Cloud APIs. Real-time features via Socket.io. 80+ route files, organized by feature for maintainability and scalability.

## Architecture & Data Flow

### Backend (Express + MongoDB)
  - Modular route files in `routes/`, auto-mounted by filename (see Route Mounting Convention)
  - Business logic in `services/`, e.g. `freelanceSyncService.js` for cloud sync and webhook upserts
  - Models in `models/`, e.g. `Agent.js` (Mongoose schemas)
  - Middleware: `authenticateJWT.js` (JWT verification), `rateLimit.js` (100 req/15min, logs to `RateLimitLog`), `auditTrail.js` (field-level audit logging)
  - Real-time: Socket.io in `socket/`
  - Logging: Centralized via `backend-logging-system.js` and per-feature logging
  - External sync: Scheduled jobs and webhook handlers for NNIT Cloud (see `routes/cloudSync.js`, `services/freelanceSyncService.js`)


### Frontend/Mobile API Modules
  - Frontend modules in `frontend/`, export async API functions using shared `api` helper
  - Mobile modules in `mobile/`, export async API functions with hardcoded URL + axios

## Developer Workflows


### Running & Debugging
  - Start server: `node index.js` or use VS Code Live Preview task
  - Debug: Attach debugger to Node.js process, set breakpoints in route/service files
  - Environment: Use `.env` for secrets and API keys (see below)

### Adding New Features (Full-Stack)
1. **Backend route:** Create `routes/<featureName>.js`, export Express router with endpoints
2. **Business logic:** If complex, add service in `services/<featureName>.js`
3. **Middleware:** Use `authenticateJWT` for protected routes, `Joi` for validation
4. **Frontend module:** Create `frontend/<featureName>.js`, export async API functions using shared `api` helper
5. **Mobile module:** Create `mobile/<FeatureName>.js`, export async API functions with hardcoded URL + axios
6. **Model (if needed):** Add Mongoose schema in `models/<ModelName>.js`

### Route Mounting Convention
Routes are auto-mounted by filename: `routes/advancedProjectExport.js` → `/api/advancedProjectExport/*`. Route files define paths relative to their mount point (e.g., `router.post('/', ...)` → `/api/advancedProjectExport/`).
Example: `routes/cloudSync.js` exposes `/api/cloud/sync-agents`, `/api/cloud/webhook/agent`, etc.

## Project-Specific Conventions

### Authentication Pattern
  - JWT required for protected routes, validated by `authenticateJWT.js`
  - Cloud API routes use `validateCloudToken` middleware

### Validation & Error Handling
  - Use `Joi` for request validation
  - Consistent error logging via `logger.error` and structured error responses

### API Response Patterns
  - Success: `{ message, data, ... }` or `{ status: 'received', data, sync }`
  - Errors: `{ error, details }` with HTTP status codes

### Real-Time Features
  - Socket.io for notifications and live updates (see `socket/`)

### Background Jobs
  - Overdue checks: `cron.schedule('0 0 * * *', async () => {...})` (midnight daily)
  - External sync: `cron.schedule('0 * * * *', async () => {...})` (hourly)
  - Cloud sync: Scheduled and webhook-based upserts for agents/users (see `services/freelanceSyncService.js`)

## Integration Points

### External Services
  - NNIT Cloud API: agent/user sync via scheduled jobs and webhooks (`routes/cloudSync.js`, `services/freelanceSyncService.js`)
  - Slack, PayPal, Stripe, OpenAI, Firebase, AWS (see respective service files)

### Database
  - MongoDB via Mongoose models in `models/`

## Key Files Reference

- `index.js`: Main server entry
- `routes/`: Feature-based route files
- `services/`: Business logic and integrations
- `models/`: Mongoose schemas (e.g., `Agent.js`)
- `frontend/`, `mobile/`: API modules for frontend/mobile
- `middleware/`: Auth, rate limit, validation
- `socket/`: Real-time features

## Environment Variables (.env)
Required: `JWT_SECRET`, `MONGODB_URI`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`
Optional: `PORT` (default 3003), `POSTGRES_URI`, `CLOUD_API_URL/TOKEN`, `FREELANCE_API_URL/TOKEN`


**When adding conventions, update this file to keep AI agents productive.**

---
**If any section is unclear or missing, please provide feedback so instructions can be improved for future AI agents.**
