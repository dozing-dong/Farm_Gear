# FarmGear – Local Docker One-Click Run Guide

This repository contains the backend (ASP.NET Core) and the frontend (Vite + React) of the FarmGear equipment rental platform. This guide shows how to start the full stack locally using Docker in one command and which ports will be used.

## Prerequisites
- Docker Desktop 4.x+
- Docker Compose v2 (bundled with recent Docker Desktop)

## One-Time Setup

Run this once after cloning the repository. It will generate and trust a local HTTPS certificate for the backend, and create a minimal frontend `.env`.

```powershell
./setup.ps1
```

## One-Click Run

From the repository root:

```bash
# Start all services in the background
docker compose up -d --build
```

To stop and remove containers:

```bash
docker compose down
```

## Services and Ports
The stack starts the following containers. Make sure these host ports are free:

- Backend (ASP.NET Core, HTTPS): https://localhost:8443
  - Static uploads: https://localhost:8443/uploads
  - Uses local dev certificate mounted from `certs/backend/aspnetapp.pfx`
- Frontend (Vite Dev Server): https://localhost:3000
  - Talks to backend via `VITE_API_BASE_URL`
- MySQL: localhost:3307 (mapped to container 3306)
- Redis: localhost:6379

Port summary:

- 3000 → Frontend (Vite dev server on host; mapped to 5173 inside container)
- 8443 → Backend (ASP.NET Core HTTPS)
- 3307 → MySQL (container 3306)
- 6379 → Redis

## First Run Notes
- The backend automatically applies EF Core migrations and seeds roles on startup.
- The frontend installs dependencies (npm ci) in the container and starts the Vite dev server.
- If you see certificate warnings in the browser, trust local dev certificates or proceed for local testing.

## Health Checks & Docs
- Swagger UI (Development): https://localhost:8443/swagger

## Environment Overview
Docker Compose wires services together with these key variables:

- Backend env (excerpt):
  - `ASPNETCORE_URLS=https://+:8443`
  - `ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx`
  - `ASPNETCORE_Kestrel__Certificates__Default__Password=changeit`
  - `ConnectionStrings__DefaultConnection=Server=mysql;Port=3306;Database=FarmGearDevDb;User=farmgear;Password=devpass;`
  - `RedisSettings__ConnectionString=redis:6379,allowAdmin=true`
  - `ApplicationSettings__ApplicationUrl=https://localhost:8443`
  - `ApplicationSettings__FileStorage__BaseUrl=https://localhost:8443/uploads`

- Frontend env (excerpt):
  - `VITE_API_BASE_URL=https://localhost:8443`

## Common Commands

```bash
# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend

# Rebuild only backend
docker compose build backend && docker compose up -d backend

# Rebuild only frontend
docker compose build frontend && docker compose up -d frontend
```

## Troubleshooting
- If port 3306 is in use locally, MySQL is already mapped to host port 3307.
- If https://localhost:8443 is not reachable, run `./setup.ps1` again, or verify `certs/backend/aspnetapp.pfx` exists and matches the password `changeit` (adjust in `docker-compose.yml` if needed).
- If services fail health checks, run `docker compose ps` and inspect with `docker compose logs -f <service>`.

---

Happy hacking!
