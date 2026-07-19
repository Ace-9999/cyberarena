# 🛡️ CyberArena

CyberArena is a self-hosted Capture The Flag (CTF) platform featuring a **React SPA (Single Page Application)** frontend and a **Flask JSON API** backend, backed by a **Supabase (Postgres)** database for accounts, teams, and scoring. It uses **Docker** to launch individual CTF challenges on-demand.

For an in-depth, step-by-step technical breakdown of the API, auth, scoring, and container lifecycle, read [HOW_IT_WORKS.md](HOW_IT_WORKS.md). For database setup, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

---

## 🚀 Features

- **Real User Accounts:** Register/login with hashed passwords and JWT-based sessions. Each operator gets a generated register number and an editable profile (display picture, bio).
- **Teams:** Create a team or join one by invite code (CTFd-style). Team scores aggregate every member's solves, with per-member contribution %.
- **Live Leaderboard:** Individual and team standings plus a recent-solves "live feed", refreshed in near-realtime via Supabase realtime subscriptions on the `solves` table.
- **First Blood Bonus:** The first operator to solve any challenge platform-wide earns a configurable bonus (default **+25** points) and a badge.
- **React SPA Frontend:** A fully animated, dark hacker-themed interface that runs in the browser without page reloads, with challenge search and category/difficulty filtering.
- **Global Instance Management:** Run multiple challenges side-by-side. Instance state is synced globally and across tabs, so you can navigate freely without losing active shells.
- **Dynamic Port Mapping:** Runs multiple challenges simultaneously without port conflicts.
- **Smart Heartbeat System:** A global background loop keeps your containers alive while any app tab is open, and a server-side janitor auto-destroys them after 2 minutes of inactivity to save resources.
- **Auto Image Loader:** Automatically loads challenge Docker images from the bundled `.tar` files if they aren't already in your Docker library.
- **Secrets Stay Server-Side:** Flags, password hashes, and scoring logic live only in the backend and are never sent to the browser or stored in browser-readable tables.

---

## 🧠 Included Challenges

The repository comes pre-packaged with the following challenge archives (in `backend/`):
1. **SQL Injection (`sql-challenge.tar`)** — Web · Medium · 100 pts. Exploit SQL vulnerabilities to retrieve unauthorized records.
2. **Cookie Tampering (`cookie-challenge.tar`)** — Web · Easy · 100 pts. Manipulate HTTP cookies to hijack sessions or elevate privileges.
3. **IDOR Challenge (`idor-challenge.tar`)** — Web · Medium · 150 pts. Exploit Insecure Direct Object References to access restricted resources.
4. **Roman Challenge (`roman-challenge.tar`)** — Crypto · Easy · 50 pts. A cipher/encoding challenge based on Roman numerals.

---

## 🛠️ Prerequisites

Before running CyberArena, ensure you have the following installed:
- [Node.js (LTS) & NPM](https://nodejs.org/) — for the React frontend
- [Python 3.10+](https://www.python.org/downloads/) — for the Flask backend
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — with the Docker daemon running
- A free [Supabase](https://supabase.com) project — for the database (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))

---

## 💻 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cyberarena
   ```

2. **Set up the database:**
   Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) once (~10 minutes) to create the Supabase project, run `backend/schema.sql`, and collect your connection string + API keys.

3. **Configure the backend environment:**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill in `DATABASE_URL` (your Supabase connection string) and `JWT_SECRET`. You can tweak `JWT_EXPIRE_DAYS` and `FIRST_BLOOD_BONUS` as desired.

4. **Configure the frontend environment:**
   Create `frontend/.env`:
   ```
   VITE_SUPABASE_URL=<your Supabase Project URL>
   VITE_SUPABASE_ANON_KEY=<your Supabase anon/public key>
   VITE_API_URL=http://localhost:5000/api
   ```
   > The anon key only enables live leaderboard auto-refresh — the app still works without it.

5. **Install backend dependencies:**
   On Linux/Ubuntu, it is best to use a project-local virtual environment so you do not modify the system Python:
   ```bash
   cd backend
   sudo apt update
   sudo apt install -y python3.12-venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
   If you already created the environment, you can reuse it with:
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

6. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

---

## 🏃 Running the Application

Start both servers in separate terminals.

1. **Start the Flask backend** (run from the `backend/` folder so the Docker `.tar` files resolve):
   ```bash
   cd backend
   python app.py
   ```
   *The API runs on `http://localhost:5000`. On startup you should see `[startup] Synced challenges to database.`, confirming the DB connection works.*

2. **Start the React frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   *The app usually runs on `http://localhost:5173/`.*

3. **Access the web interface:**
   - Open the frontend URL (e.g. `http://localhost:5173`).
   - Click **Register** to create your operator account, then start solving.

---

## 📂 Project Structure

```text
cyberarena/
├── backend/
│   ├── app.py                  # Flask JSON API: auth, challenges, teams, leaderboard, Docker, janitor
│   ├── auth.py                 # JWT minting + auth decorators
│   ├── db.py                   # Postgres connection pool + query helpers
│   ├── schema.sql              # Database schema (users, teams, challenges, solves, views, RLS)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Backend environment template
│   └── *.tar                   # Pre-packed Docker images for the challenges
├── frontend/
│   ├── index.html              # Vite entry HTML
│   ├── package.json            # Node dependencies
│   └── src/
│       ├── api/                # API fetch wrapper (JWT) + Supabase realtime client
│       ├── components/         # Reusable React UI components
│       ├── context/            # Auth, Progress, and Instances global state
│       ├── pages/              # Landing, Login, Challenges, ChallengeDetail, Leaderboard, Teams, Profile
│       └── App.jsx             # React Router configuration
├── SUPABASE_SETUP.md           # One-time database setup walkthrough
├── HOW_IT_WORKS.md             # In-depth architectural explanation
├── TODO.md                     # Roadmap / future enhancements
└── README.md                   # This file
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.
