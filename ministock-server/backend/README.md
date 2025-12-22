# MiniStock Backend (backend-server)

This folder contains the MiniStock API server. The server is API-first and client-agnostic — it can serve both an Electron desktop client and a browser-based web client.

## Quick start (development)

1. Install dependencies

```bash
cd backend
npm install
```

2. Copy environment variables from the example

```bash
cd backend
cp .env.example .env
# Edit .env if needed
```

3. Start the server

```bash
npm start
# or
node server.js
```

The server defaults to `PORT=3001`. The health endpoint is available at `/api/health`.

## Environment variables (.env)
- `PORT` - Port to run the backend server on (default: `3001`).
- `DATABASE_FILE` - SQLite database file path (default: `ministock.sqlite`).
- `CORS_ORIGIN` - Comma-separated list of allowed origins for CORS (e.g. `http://localhost:3000`).

## Notes
- The API is designed to be consumed by any client via HTTP (Electron or browser).
- For production packaging with Electron, consider bundling the backend inside the app or deploying the backend as a separate hosted service and pointing clients to the hosted URL.
