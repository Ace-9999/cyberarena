# CyberArena — Supabase Setup (from scratch)

Follow these once. ~10 minutes. You only touch the Supabase dashboard + two `.env` files.

## 1. Create the project
1. Go to <https://supabase.com> → sign in (GitHub login is easiest) → **New project**.
2. Pick your org, set:
   - **Name**: `cyberarena`
   - **Database Password**: click *Generate*, then **COPY AND SAVE IT** (you need it in step 4).
   - **Region**: pick the one closest to you.
3. Click **Create new project** and wait ~2 minutes for it to provision.

## 2. Create the tables
1. Left sidebar → **SQL Editor** → **+ New query**.
2. Open `backend/schema.sql` from this repo, copy the whole thing, paste it in.
3. Click **Run**. You should see "Success. No rows returned".

## 3. Grab the API keys (for the frontend's live leaderboard)
1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy two values:
   - **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - **anon / public** key (a long JWT-looking string — this is safe to expose in the browser).

## 4. Grab the database connection string (for the backend)
1. **Project Settings** → **Database** → **Connection string**.
2. Choose the **Session pooler** tab (works on home/IPv4 networks).
3. Copy the URI. It looks like:
   `postgresql://postgres.abcdxyz:[YOUR-PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres`
4. Replace `[YOUR-PASSWORD]` with the database password you saved in step 1.

## 5. Fill in the backend `.env`
From the repo root:
```sh
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
- `DATABASE_URL=` → the connection string from step 4
- `JWT_SECRET=` → generate one:
  ```sh
  .\.venv\Scripts\python -c "import secrets; print(secrets.token_hex(32))"
  ```
- Leave `JWT_EXPIRE_DAYS` and `FIRST_BLOOD_BONUS` as-is (or tweak).

## 6. Fill in the frontend `.env` (created in the next build step)
`frontend/.env`:
```
VITE_SUPABASE_URL=<Project URL from step 3>
VITE_SUPABASE_ANON_KEY=<anon key from step 3>
VITE_API_URL=http://localhost:5000/api
```

## 7. Run it
Backend (from the `backend/` folder so the docker `.tar` files resolve):
```sh
cd backend
..\.venv\Scripts\python app.py
```
On startup you should see `[startup] Synced challenges to database.` — that confirms the DB connection works.

Frontend:
```sh
cd frontend
npm install
npm run dev
```

## Security notes
- The **anon key** is meant to be public; it can only *read* the `solves` table (the scoreboard). Row Level Security blocks everything else.
- Flags, password hashes, and scoring logic live only in the backend and are never sent to the browser.
- `backend/.env` and `frontend/.env` are git-ignored — never commit them.
