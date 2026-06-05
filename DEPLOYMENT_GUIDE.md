# KLB Chat Boot — Complete Deployment Guide

**Current Setup:**
- Frontend (Dashboard): Vercel — https://klb-chat-boot.vercel.app
- Backend (WhatsApp Worker): Render — https://klb-chat-boot.onrender.com
- Database: Convex (Serverless Backend) + Mongo (Render managed)
- QR/Session Management: Convex + Backend WhatsApp client

---

## 1. Final Configuration Checklist

### Vercel (Dashboard)
Ensure these environment variables are set in **Vercel Project Settings → Environment Variables**:

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | `https://vibrant-coyote-205.convex.cloud` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://klb-chat-boot.onrender.com/api/v1` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend public URL | `https://klb-chat-boot.onrender.com` |

**Action:** If any are missing, add them and redeploy.

### Render (Backend)
Ensure these environment variables are set in **Render Service Settings → Environment**:

| Variable | Value | From |
|----------|-------|------|
| `PORT` | `4005` | default |
| `MONGODB_URI` | Your Railway/Render Mongo URI | `backend/.env` |
| `CONVEX_URL` | `https://vibrant-coyote-205.convex.cloud` | `backend/.env` |
| `CONVEX_DEPLOYMENT` | `dev:vibrant-coyote-205` | `backend/.env` |
| `CONVEX_SITE_URL` | `https://vibrant-coyote-205.convex.site` | `backend/.env` |
| `DASHBOARD_URL` | `https://klb-chat-boot.vercel.app` | `backend/.env` |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` | Docker default |

**Action:** Cross-check Render dashboard. Restart service if any variables changed.

---

## 2. Test the QR Session Flow (End-to-End)

### Step 1: Health Check
Verify backend is running:
```bash
curl -i https://klb-chat-boot.onrender.com/health
# Expected: 200 OK, { "status": "OK", "sessions": "Checking..." }
```

### Step 2: Create a Session
Use the dashboard debug UI (easiest):
- Visit: https://klb-chat-boot.vercel.app/debug
- Click "Create session" → enter a name (e.g., "Test QR")
- Watch the list refresh

Or use curl to test via the dashboard API:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"TestSession"}' \
  https://klb-chat-boot.vercel.app/api/whatsapp/sessions/klb-connect
# Expected: 200, { "ok": true, "id": "<convex-id>" }
```

### Step 3: Verify Session Created in Convex
List sessions via dashboard API:
```bash
curl https://klb-chat-boot.vercel.app/api/whatsapp/sessions/klb-connect
# Expected: 200, array with your new session, status: "INITIALIZING"
```

### Step 4: Watch Backend Logs for QR Generation
In Render dashboard, navigate to **Logs** and search for:
- `"Initializing client for session:"` — backend picked it up
- `"QR received for"` — QR was generated
- `"🔓 Session ... AUTHENTICATED"` — WhatsApp scanned and authenticated
- `"🚀 ✅ WHATSAPP IS READY"` — session is live

### Step 5: Retrieve the QR Code
Once logs show "QR received", fetch the session again:
```bash
curl https://klb-chat-boot.vercel.app/api/whatsapp/sessions/klb-connect
# Look for the session object. It should now have:
# {
#   "sessionId": "...",
#   "status": "QR_READY",
#   "qrCode": "data:image/png;base64,..."
# }
```

### Step 6: Scan QR Code
If `qrCode` is present as a data URL:
- Copy the data URL into a browser tab or use a QR decoder (online).
- Scan with your WhatsApp mobile app.
- Watch backend logs for "🔓 Session ... AUTHENTICATED" → "🚀 ✅ WHATSAPP IS READY".
- Session status in Convex should update to `READY`.

---

## 3. Common Issues & Fixes

### ❌ QR Not Appearing (No "QR received" in logs)
**Possible Causes:**
- Chromium/Puppeteer failed to launch.
- Backend cannot initialize the client.
- Mongo connection issue.

**Diagnostics:**
1. Check Render logs for puppeteer errors:
   - Look for `"Failed to launch the browser"`, `"ENOENT"`, or `"detached frame"`.
2. Verify `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` is set.
3. Confirm `MONGODB_URI` is correct and Mongo is reachable.

**Fix:**
- Ensure backend service is deployed from Docker image (has Chromium pre-installed).
- Restart the Render service.

### ❌ Session Stuck "INITIALIZING"
**Cause:** Backend is running but hasn't started the WhatsApp client.

**Fix:**
- Wait 10-15 seconds (client initialization takes time).
- Check Render logs for errors.
- If logs show no activity, restart the service.

### ❌ Convex API returns 500 error
**Cause:** `NEXT_PUBLIC_CONVEX_URL` is missing or wrong.

**Fix:**
- Verify in Vercel Environment Variables.
- Redeploy the dashboard.

### ❌ Render service keeps restarting
**Cause:** Process crashing (usually Chrome launch or Mongo connection).

**Fix:**
- Check Render logs for the error.
- Verify all env vars are set.
- If Mongo fails, use an Atlas (cloud) database and set full URI.

### ❌ "Already in use" or port conflict
**Cause:** Another process is using port 4005.

**Fix:**
- On Render, the default port handling is automatic; no fix needed.
- Locally, use `lsof -i :4005` (Mac/Linux) or `netstat -ano | findstr :4005` (Windows) to find and kill the process.

---

## 4. Testing Commands (All-in-One Checklist)

Copy and run these in order:

```bash
# 1. Check backend health
curl -i https://klb-chat-boot.onrender.com/health

# 2. List existing sessions
curl https://klb-chat-boot.vercel.app/api/whatsapp/sessions/klb-connect

# 3. Create a test session
SESSION_ID=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"CheckQR"}' \
  https://klb-chat-boot.vercel.app/api/whatsapp/sessions/klb-connect | jq -r '.id // .sessionId')
echo "Created session: $SESSION_ID"

# 4. Wait 5-10 seconds, then check session details (should show qrCode if ready)
sleep 10
curl https://klb-chat-boot.vercel.app/api/whatsapp/sessions/klb-connect | jq ".[] | select(.sessionId == \"$SESSION_ID\")"

# 5. Check Render logs (manually in Render dashboard or via CLI if configured)
# Look for: "Initializing client for session", "QR received for", "AUTHENTICATED"
```

---

## 5. Next Steps After Successful QR

Once QR is scanned and status is `READY`:
- Backend will start listening for incoming WhatsApp messages.
- Messages are queued and can be processed/stored in Convex.
- Use the dashboard to manage templates, rules, schedules, etc.
- All data is stored in Convex; backend is stateless (can restart without losing sessions).

---

## 6. Push to Production

After verifying everything locally/in debug:

```bash
cd d:\klb-chat-boot

# Commit any final changes
git add .
git commit -m "deployment: finalize backend env vars and Convex integration"

# Push to main (Vercel and Render auto-redeploy from the repo)
git push origin main

# Monitor deployments
# - Vercel: https://vercel.com/klb-chat-boot
# - Render: https://dashboard.render.com (your service)
```

---

## 7. Support / Debugging

- **Dashboard logs:** Open browser DevTools → Console and Network tabs.
- **Backend logs:** Render dashboard → Logs tab (tail real-time).
- **Convex data:** Use Convex dashboard to inspect database records.
- **CORS issues:** Verify `DASHBOARD_URL` is set on backend.

---

**Deployment Status:** ✅ Ready for testing
