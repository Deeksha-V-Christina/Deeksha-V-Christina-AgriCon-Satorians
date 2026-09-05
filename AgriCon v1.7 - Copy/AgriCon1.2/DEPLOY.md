# Putting AgriCon on a real public URL

This turns the app into one Docker image (frontend + the real
CropStressMamba v2 backend, one process) and deploys it on **Render**, whose
free plan needs no credit card and can run it as-is. You'll end up with a
public link like `https://agricon.onrender.com` you can open from any
device, phone included.

This has been verified two ways before you touch anything: the exact
production dependency install (torch + FastAPI, CPU) was installed fresh and
run against the real trained checkpoint, correctly diagnosing the sample
pest photo end-to-end through the API; and the frontend-serving change to
`backend/app.py` was confirmed not to interfere with any `/api/*` route.
What's untested is the literal Docker build step itself (Docker Hub isn't
reachable from the sandbox this was prepared in) — it's standard,
boilerplate Dockerfile syntax, but Render's first build is where you'll see
it run for real. If it fails, paste the build log back and it's a quick fix.

## What's already done

- `Dockerfile` — builds the frontend, then serves it from the same FastAPI
  backend that runs the real model (`backend/app.py` now mounts the built
  frontend at `/`, alongside `/api/health`, `/api/model`, `/api/diagnose`).
- `.dockerignore` — keeps `node_modules`, `android/`, and other local-only
  files out of the image.
- `render.yaml` — a Render "Blueprint": Render reads this and creates the
  service for you, no manual form-filling.

## Steps

1. **Put this folder on GitHub** (skip if it's already a repo you can push):
   ```bat
   cd "AgriCon1.2"
   git init
   git add .
   git commit -m "AgriCon1.2 — dashboard + real diagnosis backend"
   ```
   Then create a new repository at github.com/new (public is fine — nothing
   in here is secret; there's no `.env` file, only `.env.example`), and push:
   ```bat
   git remote add origin https://github.com/<you>/agricon.git
   git branch -M main
   git push -u origin main
   ```

2. **Create a free Render account** at render.com — sign up with GitHub, no
   card required for the free plan.

3. **New + → Blueprint**, pick the repo you just pushed. Render finds
   `render.yaml` automatically and shows you the one service it will create
   (`agricon`, free plan, Docker). Click **Apply**.

4. **Wait for the build** (first one takes a few minutes — it's compiling
   the frontend and installing torch). Render shows the log live. Once it
   says the service is live, your URL is at the top of the service page:
   `https://agricon-<something>.onrender.com`.

5. **Try it** — open the URL, run a diagnosis on one of the sample photos.
   First request after any idle period takes 30-50s (free-plan services
   spin down after 15 minutes of no traffic, then wake back up on the next
   request) — normal, not a bug. Worth knowing if you're demoing live: open
   the link a minute before you need it.

## If you already own a domain

Render → your service → **Settings → Custom Domains → Add Custom Domain**,
type your domain, then add the CNAME (or A record, for a root/apex domain)
Render shows you at wherever you bought the domain (Namecheap, GoDaddy,
etc.). Free plan supports this — no upgrade needed. DNS changes usually take
a few minutes to a few hours to take effect.

## If you don't have a domain and don't need one

The `onrender.com` URL from step 4 is a real, public, shareable link on its
own — nothing more to do.
