# CyberArena Roadmap

## ✅ Shipped (multiplayer foundation)
- [x] Real database backend — migrated from `localStorage`/hardcoded admin to **Supabase Postgres**.
- [x] User registration, login, and **JWT-based** session management with werkzeug-hashed passwords.
- [x] Per-user solve tracking in the database (`solves` table) instead of `localStorage`.
- [x] User progress (`/api/me/progress`) reflected dynamically in the challenge directory.
- [x] Live, near-realtime **leaderboard** (individual + team standings + recent-solves feed) via Supabase realtime subscriptions.
- [x] **Teams**: create-or-join-by-invite-code, aggregated team scores, per-member contribution %.
- [x] **First Blood** bonus: first platform-wide solve of a challenge is flagged and awarded `FIRST_BLOOD_BONUS` (default +25).
- [x] Editable operator profiles (display picture, bio, generated register number).

## 🔐 Security & Anti-Cheat (next up)
- [ ] Add rate limiting to `/api/login`, `/api/register`, and `/api/challenges/<id>/submit` to prevent brute-force / flag-spraying.
- [ ] **Dynamic flag generation**: inject unique, randomized flags into each Docker container at runtime so flags can't be shared between users.
- [ ] Sanitize/escape user-supplied profile fields (username, bio) to prevent stored XSS against the platform UI.
- [ ] Enforce per-user concurrent-instance limits and verify container isolation between users.
- [ ] Audit Row Level Security policies so the anon key can only ever read scoreboard data.

## 🎮 Gamification & Social
- [ ] Badge/achievement system beyond First Blood (e.g. category sweeps, streaks, speed solves).
- [ ] Hints system (optional, point-cost hints per challenge).
- [ ] Per-challenge write-ups / solution reveals unlocked after solving.
- [ ] Global notification ticker / live chat (e.g. "operative X just solved SQL Injection") over WebSockets.
- [ ] Password reset / account recovery flow.

## 🏗️ Performance & Reliability
- [ ] Host the Supabase project (and use the **Transaction pooler**, port 6543) in the region closest to players to cut round-trip latency.
- [ ] Add server-side caching/ETags for `/api/challenges` and progress endpoints.
- [ ] Health-check endpoint + graceful degradation when Docker or the DB is unavailable.

## ⚙️ Infrastructure & Scaling (do last — many features depend on the above)
- [ ] Move from local `docker.from_env()` to Docker Swarm / Kubernetes for horizontal scaling.
- [ ] Apply Docker resource limits (memory, CPU quotas) to spawned containers to prevent DoS by a single challenge.
- [ ] CI/CD pipeline to automatically build and compress challenge `.tar` images on push.
- [ ] Containerize the backend + frontend themselves and ship a single `docker-compose` for one-command deploys.
