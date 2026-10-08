# How CyberArena Works: Under the Hood

**CyberArena** is a self-hosted platform for playing Capture The Flag (CTF) security challenges.

The platform pairs a **React SPA (Single Page Application)** frontend with a **Flask JSON API** backend. User accounts, solves, teams, and scores live in a **Supabase (Postgres)** database, while individual challenges are spun up **on-demand as Docker containers** to save memory and computing power. The live leaderboard refreshes in realtime using Supabase's realtime channels.

Here is a detailed, step-by-step breakdown of exactly how the entire application works under the hood.

---

## 1. The Core Architecture

The project is split into three cooperating pieces:

*   **Frontend (`/frontend`)**: Built with React 19 + Vite. It draws the entire UI in the browser without reloading the page, manages animations and global state (auth, progress, running instances), and sends background requests to the API. It also opens a thin, **read-only** Supabase realtime subscription to know when to refresh the leaderboard.
*   **Backend (`/backend`)**: Built with Python and Flask. It is the single source of truth and the only thing trusted with secrets. It handles authentication (JWT), reads/writes the Postgres database, validates flag submissions, awards points and first-blood bonuses, talks to the local Docker daemon to start/stop containers, and runs a background cleanup job.
*   **Database (Supabase / Postgres)**: Stores `users`, `teams`, `challenges` (public metadata only), and `solves`. The browser is **never** given the database password — only the backend connects with full privileges. The frontend uses Supabase's public **anon key**, which Row Level Security restricts to *reading* the scoreboard data.

> **Security boundary:** Flags, password hashes, and scoring logic exist only in the backend (`backend/app.py`). They never touch the database tables that the browser can read, and they are never sent to the client.

---

## 2. Step-by-Step API Workflow

### A. Registration & Login (`/api/register`, `/api/login`)
1. The React app (`Login.jsx`) offers **Login** and **Register** tabs and `POST`s the username/password to `http://localhost:5000/api/register` or `/api/login`.
2. On register, Flask validates input, hashes the password with **werkzeug** (`generate_password_hash`), generates a unique **register number** (e.g. `24ABC1234`), and inserts the user.
3. On login, Flask looks the user up and verifies the password hash.
4. On success, Flask mints a **JWT** (`backend/auth.py`) and returns it alongside a sanitized user object (no password hash).
5. React stores the token via `AuthContext` (persisted to `localStorage`) and attaches it as a `Bearer` header on every subsequent request.

### B. Loading Progress & Challenges (`/api/challenges`, `/api/me/progress`)
1. `Challenges.jsx` mounts and requests `/api/challenges`. Flask returns a JSON array of the **public** challenge fields (id, name, category, difficulty, points, description). **The secret flags are stripped server-side.**
2. The `ProgressContext` calls `/api/me/progress` (authenticated) to learn which challenges *this* user has solved, their total points, and which solves were first bloods.
3. The directory dims solved cards, shows **SOLVED** / **FIRST BLOOD** badges, and supports search + category/difficulty filtering.

### C. Launching a Challenge (`/api/challenges/<id>/deploy`)
When you open a challenge and hit **[ DEPLOY INSTANCE ]**:
1. React shows a loading state and `POST`s to the deploy endpoint (auth required).
2. **Image loading**: Flask checks the local Docker image cache; if the image (e.g. `sql-challenge:latest`) is missing, it runs `docker load -i sql-challenge.tar` to unpack the bundled archive.
3. **Container spawning**: Flask runs the image detached in the background.
4. **Dynamic port mapping**: Docker maps the challenge's internal port (`5000`) to a random free host port, avoiding conflicts when several challenges run at once.
5. **Heartbeat registration**: Flask records the container ID, its challenge, and a `last_heartbeat` timestamp in an in-memory `active_containers` map.
6. Flask returns the container ID, host, and random port. React stores it in the global `InstancesContext` and shows the clickable target link `http://localhost:<random_port>`.

### D. The Dynamic Heartbeat (`/api/challenges/<id>/heartbeat`)
There is no strict countdown timer. Containers stay alive while you are actively playing, tracked by the **global `InstancesContext`**:
1. Deployed instances are kept in global React state synced to `localStorage`, so they survive navigation and are shared across tabs.
2. A single background `setInterval` loops over every active instance and sends a tiny authenticated `POST` to `/heartbeat` for each one **every 30 seconds**.
3. Flask updates that container's `last_heartbeat` to "now". You can therefore run multiple containers simultaneously.

### E. Submitting the Flag (`/api/challenges/<id>/submit`)
1. You find the flag and paste it into the React terminal input (`FlagSubmit.jsx`).
2. React `POST`s the flag to `/submit`.
3. Flask compares it against the real flag stored in the `CHALLENGES` dict in `app.py`.
4. If it matches, Flask records the solve in the `solves` table (an `ON CONFLICT DO NOTHING` makes re-submits idempotent).
5. **First blood**: Flask checks whether this is the *earliest* solve of that challenge across the whole platform. If so, it flags the solve and awards a `FIRST_BLOOD_BONUS` (default **+25**) on top of the base points.
6. Flask invalidates its leaderboard cache and returns `{ correct, first_blood, points_awarded, total_points }`.
7. React shows "ACCESS GRANTED", refreshes progress/score, and after a short delay `POST`s to `/stop` to destroy the now-unneeded container.

### F. Teams (`/api/teams/*`)
1. From `Teams.jsx` a user can **create** a team (gets a unique invite code) or **join** one by code — CTFd style.
2. A team's score is the **sum of its members' solves**; the API also computes each member's **contribution %**.
3. `/api/teams/me` returns the whole team + member stats in a single aggregated query.

### G. The Leaderboard (`/api/leaderboard` + Supabase realtime)
1. `Leaderboard.jsx` fetches `/api/leaderboard`, which returns team standings, individual standings, and a recent-solves "live feed" — built in **one** `json_build_object` round-trip and served from a short (8s) in-memory cache.
2. In parallel, the frontend subscribes to the `solves` table via `@supabase/supabase-js` using the public anon key. When anyone scores, the subscription fires and the page refetches — giving a near-realtime scoreboard without polling.
3. If `VITE_SUPABASE_ANON_KEY` is not configured, the app still works; it just won't auto-refresh.

### H. Background Cleanup (The Janitor)
What if you deploy a challenge and then close the tab? The heartbeats stop, but the container keeps running and wasting RAM.
1. Flask runs a background thread via **APScheduler**.
2. Every **60 seconds** it scans `active_containers`.
3. Any container whose `last_heartbeat` is older than **2 minutes** is forcefully `stop()`-ed and `remove()`-d, reclaiming resources safely.

---

## 3. Performance Notes

Because the database is remote, each round-trip carries real network latency. The backend mitigates this:
- `backend/db.py` uses a **`ThreadedConnectionPool`** with libpq keepalives so connections don't go stale.
- `/api/leaderboard` and `/api/teams/me` are each collapsed from several sequential queries into a **single aggregated JSON query**.
- `/api/leaderboard` is backed by an **8-second TTL cache**, invalidated immediately whenever someone scores or team membership changes.

For the lowest latency, point `DATABASE_URL` at a Supabase project (and pooler) in the region closest to your players.

---

## 4. Project Structure Reference

```text
cyberarena/
├── backend/
│   ├── app.py                  # Flask JSON API: auth, challenges, teams, leaderboard, Docker, janitor
│   ├── auth.py                 # JWT minting + require_auth/optional_auth decorators
│   ├── db.py                   # Postgres connection pool + query helpers
│   ├── schema.sql              # Database schema (users, teams, challenges, solves, views, RLS)
│   ├── requirements.txt        # Python deps (flask, docker, flask-cors, apscheduler, psycopg2, PyJWT, python-dotenv)
│   ├── .env.example            # Template for DATABASE_URL / JWT_SECRET / bonuses
│   └── *.tar                   # Pre-packed Docker images for the challenges
├── frontend/
│   ├── index.html              # Vite entry HTML (fonts, favicon)
│   ├── package.json            # Node dependencies
│   └── src/
│       ├── api/
│       │   ├── client.js       # Fetch wrapper that injects the JWT bearer header
│       │   └── supabase.js     # Read-only Supabase client for realtime leaderboard
│       ├── components/         # Reusable UI (NavBar, TerminalPanel, FlagSubmit, GlitchLogo, Ticker)
│       ├── context/            # AuthContext, ProgressContext, InstancesContext (global state)
│       ├── pages/              # Landing, Login, Challenges, ChallengeDetail, Leaderboard, Teams, Profile
│       └── App.jsx             # React Router configuration + protected routes
├── SUPABASE_SETUP.md           # One-time database setup walkthrough
├── HOW_IT_WORKS.md             # This file
├── TODO.md                     # Roadmap / future enhancements
└── README.md                   # Setup & run instructions
```
