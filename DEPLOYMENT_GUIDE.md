# Deployment Guide for CyberArena

This guide explains how to deploy CyberArena for a CTF-style event, including where to host the frontend, backend, and challenge containers.

## 1. Recommended architecture

Use a split deployment model:

- Frontend: Vercel or any static host
- Backend: college server, VPS, or cloud server
- Challenge containers: run privately on the backend server using Docker

This is the safest and most practical approach for a challenge platform.

## 2. Why this architecture is used

The frontend is only a UI layer.
The backend is responsible for:
- authentication
- challenge metadata
- flag validation
- container deployment and cleanup
- scoring and leaderboard logic

Because Docker containers are part of the challenge runtime, they should not be exposed directly to the public internet.

## 3. Where to deploy each part

### Frontend
Deploy the React frontend on Vercel.

Example:
- https://cyberarena.vercel.app

### Backend
Deploy the Flask backend on a server you control.
Good options:
- college server
- VPS (DigitalOcean, Hetzner, Linode, AWS EC2, etc.)

Example:
- https://api.yourdomain.com
- or an IP address such as 203.0.113.10

### Challenge containers
Run the challenge containers privately on the backend server using Docker.
They should be:
- reachable only from the backend server
- bound to localhost by default
- isolated inside a private Docker network

## 4. How participants access the challenge

Participants do not access Docker directly.
They interact with the application through the public frontend/backend flow.

Typical flow:
1. Participant opens the challenge page in the frontend.
2. The frontend calls the backend API.
3. The backend starts or connects to the challenge container.
4. The backend proxies or manages the interaction.
5. The participant submits the flag.
6. The backend verifies the flag and awards points.

## 5. Is Docker access available to participants?

No, not in a secure deployment.
Participants should not receive:
- Docker Desktop access
- Docker CLI access
- container shell access
- access to the host filesystem

They should only interact with the challenge through your platform.

## 6. Security model

A secure challenge deployment should follow these rules:

- Keep challenge containers private
- Bind them to localhost by default
- Place them on a private Docker network
- Do not expose Docker socket or host resources
- Do not give participants access to the host machine

## 7. If you use a college server

A college server can work well if:
- you have permission to use it
- Docker is available or can be installed
- the server has public access or a reachable domain
- firewall rules allow the required ports

Check whether:
- port 80/443 is open
- Docker can run on the server
- the server can be reached from the internet
- the college network blocks student-hosted services

## 8. Cost expectations

- Frontend: often free or low-cost
- Backend + Docker: usually requires a small paid server for reliable use

For a small CTF or demo, a low-cost VPS is often enough.

## 9. Recommended simple deployment plan

### Option A: easiest
- Frontend on Vercel
- Backend + Docker on a VPS

### Option B: simplest single-machine setup
- Frontend served from the same server
- Backend and Docker on the same machine

This is the easiest setup if you want everything in one place.

## 10. LAN deployment for a university CTF (our recommended setup)

For an on-campus event where all participants are on the **same LAN** as the
server (a lab, a venue, or one machine everyone can reach by IP), you do **not**
need the public-domain + reverse-proxy setup described above. A simpler
"public ports on the LAN" model is a better fit.

### 10.1 Do participants need Docker?

No. Docker only ever runs on the **one machine hosting the backend**. When a
participant clicks **Deploy Instance**, the Flask backend creates the challenge
container on the server. Participants only use the website in a browser — they
never install Docker, never touch a `.tar`, and never get a container shell.

The only thing that has to work is: the participant's browser needs to reach the
container the server just started. On a LAN, the cleanest way to do that is to
publish the container port on the server and link to the **server's LAN IP**,
not `localhost`.

### 10.2 Why `localhost:<port>` does not work for other players

The challenge link must point at the server, not at the participant. A link like
`http://localhost:<port>` resolves to *each participant's own machine*, which has
nothing running, so it fails for everyone except someone sitting at the server.
Use the server's LAN IP instead, e.g. `http://192.168.1.50:<port>`.

### 10.3 The two changes needed (not yet applied)

These are documented here for when we implement them; the code currently still
uses the host-only `localhost:<port>` link:

1. **Bind challenge ports to all interfaces** so other machines on the LAN can
   reach them. Set `CHALLENGE_BIND_HOST=0.0.0.0` in `backend/.env` (default is
   `127.0.0.1`, which is host-only).
2. **Build the challenge link from the server's LAN IP**, not `localhost`.
   Add a value such as `VITE_CHALLENGE_HOST=192.168.1.50` for the frontend and
   construct the link as `http://<VITE_CHALLENGE_HOST>:<instance.port>`.

### 10.4 Per-player isolation (important)

With the direct-port model, isolation is automatic: each Deploy creates a
separate container and each player's browser connects to their **own** port from
their own deploy response. Players do not collide.

Note: the current `/api/challenges/<id>/proxy` route is **not** safe for multiple
players — `find_active_challenge_instance` returns the *first* container matching a
challenge id, so several players deploying the same challenge would all be routed
to one shared container. This is another reason the LAN direct-port model is the
better fit for our event, and why the proxy would need per-instance (per-container)
routing before it could be used with many players.

### 10.5 Security notes for the LAN model

- Exposing the challenge ports on the LAN is acceptable: the challenges are meant
  to be attacked, and containers are already hardened (`cap_drop=ALL`,
  `no-new-privileges`, memory/PID limits, isolated Docker network).
- Flags, backend source, and DB credentials are **not** exposed to participants:
  flags live server-side in `app.py` and are only checked on submit, the
  `/api/challenges` list returns public fields only, and `backend/.env` is
  git-ignored.
- **Do not push the repo publicly with the challenge images tracked.** The
  `backend/*.tar` files are committed and contain challenge source (and likely the
  flags). Keep the repo private, or untrack the `.tar` files and distribute them
  to the server out-of-band.
- If the LAN is reachable from the wider campus network, restrict access with the
  host firewall so only the intended participants can hit the server.

## 11. Final takeaway

For CyberArena, the practical deployment path is:

- use Vercel for the frontend if you want a simple public UI
- run the Flask backend and Docker challenge containers on your own server
- keep the containers private and inaccessible directly to participants
