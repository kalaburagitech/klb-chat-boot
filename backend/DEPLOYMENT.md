# Backend Deployment (WhatsApp worker + Convex)

This document describes how to run and deploy the backend service (whatsapp-web.js + Convex) using Docker or a managed host.

## Required environment variables
- `PORT` (default: `4005`)
- `MONGODB_URI` (e.g. `mongodb://mongodb:27017/klb-whatsapp`)
- `REDIS_URL` (e.g. `redis://redis:6379`)
- `CONVEX_URL` (e.g. `https://vibrant-coyote-205.convex.cloud`)
- `CONVEX_DEPLOYMENT` (e.g. `dev:vibrant-coyote-205`)
- `CONVEX_SITE_URL` (e.g. `https://vibrant-coyote-205.convex.site`)
- `DASHBOARD_URL` (public dashboard origin, e.g. `https://klb-chat-boot.vercel.app`)
- `PUPPETEER_EXECUTABLE_PATH` (optional; default `/usr/bin/chromium` in the Dockerfile)

## Local with Docker Compose
1. From repo root, build and start services:

```bash
docker-compose -f docker-compose.backend.yml up --build -d
```

2. Check logs:

```bash
docker-compose -f docker-compose.backend.yml logs -f backend
```

3. Test API:

```bash
curl -i http://localhost:4005/api/whatsapp/sessions/klb-connect
```

## Deploy to a managed host (Render / Railway / Fly)

General steps:
- Create a new Web Service from repository, point to the `backend` folder.
- Use the included `Dockerfile` (it installs Chromium and required libs).
- Set environment variables from above in the provider UI.
- For Mongo, use a managed database (Mongo Atlas) or a provider database plugin and set `MONGODB_URI`.

### Render (example)
1. Create new Web Service → Connect Git repo → Select folder `backend` → Environment: Docker
2. Add Environment Variables in Render dashboard:
   - `PORT=4005`
   - `MONGODB_URI` (Atlas or Render DB)
   - `CONVEX_URL`, `CONVEX_DEPLOYMENT`, `CONVEX_SITE_URL`
   - `DASHBOARD_URL=https://klb-chat-boot.vercel.app`
3. Deploy and monitor logs from Render Console.

### Railway (example)
1. Create new project → Add a service from Dockerfile (select `backend`)
2. Add a Mongo plugin or external Mongo, set `MONGODB_URI`
3. Set remaining env vars and deploy.

## Notes and tips
- Vercel cannot host the WhatsApp worker; you must use a long-running host to persist sessions and generate QR codes.
- If QR is not generated, inspect backend logs for puppeteer/chromium launch errors and missing dependencies.
- Ensure `DASHBOARD_URL` is the public origin of your Vercel dashboard so the backend allows socket origins.
