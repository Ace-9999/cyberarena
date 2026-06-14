# CyberArena Future Enhancements

## Multiplayer Support
- [ ] Migrate the backend from hardcoded `admin` user to a real database (e.g., SQLite).
- [ ] Implement robust user registration, login, and JWT-based session management.
- [ ] Track solved challenges per user in the database instead of `localStorage`.
- [ ] Update the `/api/challenges` endpoint to reflect the logged-in user's progress dynamically.
- [ ] Implement a live, real-time leaderboard pulling actual user scores from the database.
- [ ] Handle concurrent Docker instances securely for multiple distinct users (ensuring proper isolation and resource limits).

## Gamification & Social
- [ ] Implement a Badge/Achievement system (e.g., "First Blood" for being the first to solve a challenge).
- [ ] Add support for Teams/Factions where points are aggregated for a group leaderboard.
- [ ] Add a live chat or global notification ticker (e.g., "admin just solved SQL Injection!") using WebSockets.

## Security & Anti-Cheat
- [ ] Implement Dynamic Flag Generation: Inject unique, randomized flags into the Docker containers at runtime so users cannot share flags.
- [ ] Add basic rate limiting to the `/api/login` and `/api/challenges/<id>/submit` endpoints to prevent brute-force attacks.
- [ ] Automatically scan user input in the flag submission box to prevent XSS or injection against the platform itself.

## Infrastructure & Scaling --- to be done at last (many new features, changes needed before this)
- [ ] Migrate local Docker daemon interactions (`docker.from_env()`) to Docker Swarm or a Kubernetes cluster API for horizontal scaling.
- [ ] Implement proper Docker resource limits (memory limits, CPU quotas) for spawned containers to prevent denial of service by a single challenge.
- [ ] Set up a CI/CD pipeline to automatically build and compress the challenge `.tar` images on push.
