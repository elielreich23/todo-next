## Production Readiness Checklist and TODOs

This document summarizes recommended cleanups and improvements to prepare the app for a reliable production deployment. It covers both the Next.js frontend and the Django backend, plus shared repo practices. A prioritized TODO list is included at the end.

### Frontend (Next.js `client/`)
- **Env and configuration**
  - Use `NEXT_PUBLIC_API_URL` everywhere; remove hardcoded `http://localhost:8000`.
  - Add `.env`, `.env.local`, `.env.production`, and a minimal `.env.example`.
  - Ensure `next.config.mjs` only exposes public env vars and configures `images.domains` if needed.
- **API client and auth**
  - Finish `src/lib/api.ts`: base URL from `process.env.NEXT_PUBLIC_API_URL`, robust token refresh, retry logic, uniform headers.
  - Replace direct `fetch` usages with the `api()` helper.
  - Consider moving from localStorage tokens to httpOnly cookies (requires backend updates for CORS/CSRF).
- **Code quality and types**
  - Fix broken snippets in `src/contexts/UserContext.tsx` (dangling `const`, `setUserState`).
  - Enable stricter TS in `tsconfig.json` (`strict`, `noImplicitAny`, etc.).
  - Remove noisy `console.log` and add a small logger utility disabled in production.
- **Performance and bundling**
  - Dynamic import heavy routes/modals (dashboard sections, modals) to reduce initial bundle.
  - Use Next.js standalone output for Docker; verify caching for static assets.
  - Prefer `next/image` for large images.
- **Styling and assets**
  - Consolidate duplicate profile styles (choose a single `profile.module.scss`).
  - Audit `public/assets/` for unused/large media; compress or remove.
  - Maintain responsive patterns: `min-width: 0` for flex children, `minmax(0, 1fr)` grids, targeted `overflow-x: auto` where necessary.
- **UX and a11y**
  - Ensure inputs have associated labels (`htmlFor`/`id`).
  - Verify keyboard navigation, focus states, modal focus trap, Esc to close.
  - Provide loading and error states for all API flows.
- **Observability and errors**
  - Add a global error boundary and route error handlers.
  - Optional: Integrate Sentry (DSN via env) with sane sample rates.

### Backend (Django `backend/`)
- **Settings split and env**
  - Split to `settings/base.py`, `settings/dev.py`, `settings/prod.py`.
  - Read from env: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`.
  - Set `DEBUG=False` in prod; remove hardcoded `SECRET_KEY`.
- **Database and static files**
  - Use Postgres in prod (via `DATABASE_URL`).
  - Configure `STATIC_ROOT` and `collectstatic`; use `whitenoise` or serve via proxy/CDN.
  - Ensure migrations are current; remove stray DB files (e.g., `users.db`) if unused.
- **Auth and security**
  - If switching to cookie auth: configure CSRF (`CSRF_TRUSTED_ORIGINS`, secure cookies) and CORS.
  - If staying with Bearer tokens: restrict CORS to frontend domain; consider JWT blacklist.
  - Add password validators and rate limiting (`django-ratelimit`) to auth endpoints.
- **CORS and security headers**
  - Set `CORS_ALLOWED_ORIGINS` from env to prod URLs.
  - Add security headers (CSP, X-Frame-Options, X-Content-Type-Options) via middleware.
- **Logging and observability**
  - Configure JSON logs at INFO level in prod; remove prints.
  - Add `/healthz` endpoint with DB check for container health.
  - Optional: Sentry SDK (Python) with DSN from env.
- **ASGI/WSGI and server**
  - Use `gunicorn` (WSGI) or `uvicorn` (ASGI) in prod; set workers/timeouts via env.
  - Provide a production Dockerfile that runs the server accordingly.
- **Project hygiene**
  - Remove dead code/files (`run.py`, `setup_db.py`, `users.db`) if not needed in prod.
  - Pin `requirements.txt`; consider `pip-tools` for lock management.

### Shared (Repo-wide)
- **Docker and Compose**
  - Separate dev/prod Compose files; multi-stage builds; non-root users.
  - Add container `HEALTHCHECK`s; `.dockerignore` in root and app folders.
- **CI/CD**
  - GitHub Actions: lint/type-check (ESLint/TS, ruff/flake8, optional mypy), unit tests, build images, simple integration tests.
  - Optional: Playwright/Cypress smoke E2E for sign-in, create project, create task.
- **Documentation and env hygiene**
  - Expand `README-Docker.md` with prod env keys and examples.
  - Add `.env.example` for both frontend and backend.
  - Document deployment topology (Vercel frontend, managed DB + Django API host).

### Quick Wins (Codebase-specific)
- Replace direct `fetch` in `client/src/app/dashboard/profile/page.jsx` and similar with `api()` using `NEXT_PUBLIC_API_URL`.
- Finalize `client/src/lib/api.ts` refresh flow and type responses.
- Fix `client/src/contexts/UserContext.tsx` broken code lines and state setters.
- Consolidate duplicate profile styles; keep only `dashboard/profile/profile.module.scss` (or chosen canonical file).
- Remove verbose logging in `ProjectsContext` and others; add proper error handling UI.
- Backend: move secrets to env, set `DEBUG=False`, Postgres in prod, CORS pinned to frontend domain, add security headers.

---

## Project TODOs

Use this as an implementation tracker. Check off items as you complete them.

### High Priority
- [ ] Frontend: Centralize API base URL (`NEXT_PUBLIC_API_URL`), remove localhost references.
- [ ] Frontend: Finish `src/lib/api.ts` token refresh and error handling; type responses.
- [ ] Frontend: Replace direct `fetch` calls with `api()` in dashboard/profile and contexts.
- [ ] Frontend: Fix `UserContext.tsx` broken code and standardize token handling.
- [ ] Backend: Split settings into base/dev/prod, move secrets and config to env.
- [ ] Backend: Set `DEBUG=False`, configure `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` via env.
- [ ] Backend: Switch to Postgres in prod (`DATABASE_URL`); add migrations workflow.
- [ ] Backend: Add security headers middleware and rate limiting on auth endpoints.

### Medium Priority
- [ ] Frontend: Consolidate duplicate profile styles; ensure consistent responsive rules.
- [ ] Frontend: Add error boundaries and route error handlers.
- [ ] Frontend: Replace dev logs with a small logger; disable in prod.
- [ ] Frontend: Dynamic import heavy routes/modals; use `next/image` where relevant.
- [ ] Backend: Configure `STATIC_ROOT`, `collectstatic`, and (if applicable) `whitenoise`.
- [ ] Backend: Add `/healthz` with DB check; configure prod server (`gunicorn`/`uvicorn`).
- [ ] Repo: Add root and app-level `.dockerignore`; non-root containers; healthchecks.
- [ ] Repo: Add GitHub Actions for lint, type-check, tests, and image builds.

### Low Priority / Nice to Have
- [ ] Frontend/Backend: Integrate Sentry for error tracking.
- [ ] Frontend: Improve a11y (labels, focus management, keyboard nav across modals).
- [ ] Assets: Purge unused images/SVGs; compress large assets.
- [ ] Docs: Expand deployment docs with real production examples and diagrams.

---

### Notes
- If moving to cookie-based auth, coordinate CORS/CSRF and cookie settings; plan a short migration window.
- Keep environments separate and reproducible (dev, staging, prod) with distinct env files and databases.
