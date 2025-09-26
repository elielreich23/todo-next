# Docker Setup for Taskero

This project now supports Docker deployment with separate containers for frontend and backend.

## Quick Start

1. **Build and run all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Services

### Frontend (Next.js)
- **Port:** 3000
- **Container:** `todo-next_frontend_1`
- **Build:** Optimized production build
- **Environment:** Production mode

### Backend (Django)
- **Port:** 8000
- **Container:** `todo-next_backend_1`
- **Database:** SQLite (persisted via volume)
- **Features:** Auto-migration on startup

## Development vs Production

### Development (existing setup)
```bash
# Frontend
cd client && npm run dev

# Backend
cd backend && python run.py
```

### Production (Docker)
```bash
docker-compose up --build
```

## Data Persistence

- SQLite database is persisted in `./backend/data/` and `./backend/db.sqlite3`
- Existing data will be preserved when using Docker

## Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs frontend
docker-compose logs backend

# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh
```

## Troubleshooting

1. **Port conflicts:** Ensure ports 3000 and 8000 are available
2. **Database issues:** Check volume mounts in docker-compose.yml
3. **Build failures:** Check Dockerfile syntax and dependencies
4. **API connection:** Verify NEXT_PUBLIC_API_BASE_URL environment variable

## Notes

- The existing development setup remains unchanged
- Docker setup is additive and doesn't break current workflows
- SQLite database is shared between development and Docker environments


