# Deployment Readiness Checklist

What must be in place before deploying **Taskero** without the app breaking in production.

This document is **deployment-focused** (what blocks or breaks a live release). For the long-term product roadmap, see [Feature Summary](../setup/FEATURE_SUMMARY.md). For platform steps (Railway, Vercel, env vars), see [Deployment Guide](./DEPLOYMENT.md).

**Last reviewed:** June 2026

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Core auth (email/password) | Ready | Requires production env + PostgreSQL |
| Core tasks & projects | Ready | Main dashboard flows wired to API |
| Google sign-in | Partial | Requires Google + Supabase env configuration |
| Password reset email | Partial | Requires SMTP / email env on backend |
| File uploads | At risk | Local `MEDIA_ROOT` is not durable on Render/Railway |
| Team / billing / integrations UI | Stub | UI exists; not safe to advertise as live |
| Profile assigned tasks | Partial | Falls back to mock data if API empty |
| Legal pages (`/terms`, `/policy`) | Missing | Linked from auth/landing but no routes |

---

## 1. Infrastructure & configuration (required — not optional)

These are not “features” but **will break production** if missing.

### Backend (Railway / Render)

- [ ] `DJANGO_SETTINGS_MODULE=taskero_backend.settings_production`
- [ ] Strong `SECRET_KEY` (not the default)
- [ ] `DEBUG=False`
- [ ] **PostgreSQL** via `DATABASE_URL` (do not deploy with SQLite)
- [ ] `ALLOWED_HOSTS` includes the backend domain
- [ ] `CORS_ALLOWED_ORIGINS` includes **exact** Vercel URL(s) (production + preview if needed)
- [ ] Migrations run on deploy (`python manage.py migrate`)
- [ ] Static files collected (`collectstatic` + WhiteNoise — already configured)
- [ ] Admin user created after first deploy
- [ ] `FRONTEND_URL` set to production frontend URL (password-reset links)

### Frontend (Vercel)

- [ ] `NEXT_PUBLIC_API_BASE_URL` points to production backend (HTTPS)
- [ ] `npm run build` passes locally / in CI
- [ ] No hardcoded `localhost:8000` relied on in production (fallback exists in `next.config.mjs` — override with env)

### Recommended for stability

- [ ] `REDIS_URL` for shared rate-limit cache across instances (otherwise in-memory cache per dyno)
- [ ] Email credentials for password reset and contact form (`EMAIL_*` in backend `.env`)
- [ ] Health/smoke test after deploy: sign up → sign in → create project → create task

---

## 2. Backend — implement or verify before deploy

### Must work (core product)

| Item | Status | Action |
|------|--------|--------|
| User signup / signin / JWT refresh | Implemented | Verify on production DB |
| Profile read/update | Implemented | Test `/api/auth/profile/` |
| Projects CRUD | Implemented | Test list/create/delete |
| Tasks CRUD + status | Implemented | Test kanban + API |
| Task comments & attachments API | Implemented | See file storage note below |
| Notifications API | Implemented | Test bell + notifications page |
| Statistics API | Implemented | Test statistics dashboard |
| Calendar events API | Implemented | Test calendar CRUD |
| Session list/revoke | Implemented | Test settings → Sessions |
| Password reset request/confirm | Implemented | **Requires email env** |
| Contact form API | Implemented | **Requires email env** |
| Rate limiting / throttles | Implemented | Confirm limits acceptable in prod |

### Partial — deploy OK if scoped / documented

| Item | Gap | Risk if ignored |
|------|-----|-----------------|
| **Assigned tasks filter** | `GET /api/tasks/?userId=` exists in backend; frontend profile tab may still show mock fallback | Profile “Assigned Tasks” misleading |
| **Team API** | Models + endpoints exist (`/api/auth/team/…`) | Settings team tab may fail if migrations not applied |
| **User uploads API** | `UserUpload` model + endpoints exist | Files lost on redeploy without cloud storage |
| **Google auth (Django)** | `/api/auth/google/` exists | Separate from Supabase OAuth path on frontend |
| **Email in production** | Without SMTP, reset/contact emails fail silently or log only | Users cannot recover accounts |

### Must implement before treating as production-ready

| Item | Why |
|------|-----|
| **Persistent file storage** | `MEDIA_ROOT` on disk is ephemeral on Railway/Render; uploads disappear after restart/redeploy. Use S3/R2/Supabase Storage + signed URLs. |
| **Production email delivery** | Password reset and contact form depend on `EMAIL_HOST_*` / `DEFAULT_FROM_EMAIL` / `FRONTEND_URL`. |
| **Google OAuth end-to-end** | Configure backend `GOOGLE_OAUTH_CLIENT_ID`, frontend `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and Supabase vars if using Supabase redirect flow. |
| **CORS for Vercel previews** | Preview deployments use different URLs; add regex or list each preview origin. |

### Can defer (won’t break deploy if UI is hidden or labeled “coming soon”)

- Two-factor authentication
- Audit logging API
- API keys
- AI features
- WebSockets / real-time collaboration
- Full-text search backend
- Billing/subscription backend

---

## 3. Frontend — implement or verify before deploy

### Must work (core product)

| Screen / flow | Status | Verify |
|---------------|--------|--------|
| Landing page | Ready | Loads, links work |
| Sign up / sign in | Ready | API + redirect to dashboard |
| Dashboard (projects, tasks, kanban) | Ready | CRUD, drag/drop, modals |
| Task drawer (comments, attachments) | Ready | API integration |
| Project detail page | Ready | Create tasks in project |
| Calendar | Ready | Events + task sync |
| Notifications | Ready | List, mark read |
| Statistics | Ready | Loads from API |
| Uploads page | Partial | Depends on durable backend storage |
| Settings → Basic info | Ready | Profile update API |
| Settings → Sessions | Ready | Session management component |
| Settings → Notifications prefs | Partial | UI saves preferences — confirm backend persistence |
| Command palette & shortcuts | Ready | Internal navigation |

### Partial — mock, stub, or missing API wiring

| Screen / feature | Gap | Recommendation before deploy |
|------------------|-----|------------------------------|
| **Profile → Assigned Tasks** | Uses mock tasks when API returns empty | Wire to `/api/tasks/?userId=` or hide tab |
| **Profile → Your Summary** | Placeholder copy + hardcoded stats | Hide tab or connect to statistics API |
| **Profile → Account Settings** | Local toggles only | Hide or wire to user preferences API |
| **Profile avatars** | `/api/placeholder/…` images | Acceptable for MVP; replace with real avatar upload later |
| **Settings → Plans & Billing** | Static UI, no payment provider | Hide or mark “Coming soon” |
| **Settings → Audit Trail** | Static sample row | Hide until backend exists |
| **Settings → Integrations** | Connect buttons non-functional | Hide until implemented |
| **Settings → Appearance** | Theme toggle may be local-only | Confirm persistence or scope to dashboard only |
| **Settings → Team** | API exists; verify full invite/accept flow | Test end-to-end or hide |
| **Landing contact form** | Calls API | Requires backend email config |
| **Terms / Policy links** | `/terms` and `/policy` routes missing | Add pages or remove links |
| **Service worker** | Registers in production | Verify caching doesn’t serve stale API responses |

### Auth paths to clarify (avoid dual broken flows)

The app uses **both**:

1. **Django JWT** — email/password (`remoteLogin`, `remoteSignup`)
2. **Supabase Google OAuth** — redirect to `/auth/callback`

Before deploy, decide and document which is primary, and ensure all required env vars are set:

```
# Frontend (.env)
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=
```

---

## 4. Minimum viable deploy (won’t break)

Deploy safely with this **scope**:

### Include (ship these)

- Email/password authentication
- Dashboard: projects, tasks, calendar, notifications, statistics
- Profile → My Details (edit profile)
- Settings → Basic info, Sessions, Notifications (if backend prefs confirmed)
- Password reset (with email configured)

### Exclude or hide until done (prevent user-facing breakage)

- Plans & billing
- Audit trail
- Integrations (Slack, Calendar connect buttons)
- Profile → Assigned Tasks (until API wired) **or** keep with visible “sample data” banner
- Terms/policy links (until pages exist)

### Post-deploy smoke test

1. Sign up new user
2. Sign in / sign out
3. Create project and task
4. Edit task in drawer; add comment
5. Open calendar and notifications
6. Request password reset (check email arrives)
7. Confirm no CORS errors in browser console
8. Upload a file → download again after **backend redeploy** (will fail until cloud storage)

---

## 5. CI / repo hygiene before deploy

- [ ] `npm run test:ci` passes in `client/`
- [ ] Backend tests pass: `pytest` in `backend/`
- [ ] Pre-commit hooks pass (`black`, `isort`, `flake8`, `mixed-line-ending`)
- [ ] Do **not** commit: `db.sqlite3`, `__pycache__/`, `client/.next/`, `.env` secrets
- [ ] Commit all migration files (`accounts/0004`, `0005`, `projects/0006`, `0007`, etc.)

---

## 6. Related docs

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Step-by-step Railway/Vercel/Render setup |
| [AUTHENTICATION_SETUP.md](../setup/AUTHENTICATION_SETUP.md) | OAuth and password reset |
| [FEATURE_SUMMARY.md](../setup/FEATURE_SUMMARY.md) | Long-term feature backlog (not deploy blockers) |
| [TROUBLESHOOTING.md](../troubleshooting/TROUBLESHOOTING.md) | CORS, 401, 502 fixes |

---

## 7. Suggested implementation order

1. **Production env + PostgreSQL + CORS** (unblocks everything)
2. **Email (SMTP)** for password reset and contact form
3. **Hide or finish stub settings tabs** (billing, audit, integrations)
4. **Wire profile assigned tasks** to real API; remove mock fallback
5. **Cloud file storage** for uploads and task attachments
6. **Legal pages** (`/terms`, `/policy`)
7. **Google OAuth** full configuration (if offering Google sign-in in prod)
8. Redis, monitoring, error tracking (Sentry) — stability, not MVP blockers
