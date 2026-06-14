# How CyberArena Works: Under the Hood

**CyberArena** is a lightweight, self-hosted platform for playing Capture The Flag (CTF) security challenges. 

In this version, the platform uses a **React SPA (Single Page Application)** frontend communicating with a **Flask JSON API** backend. The platform uses **Docker** to spin up individual challenges *on-demand*, saving memory and computing power.

Here is a detailed, step-by-step breakdown of exactly how the entire application works under the hood.

---

## 1. The Core Architecture

The project is split into two completely separate pieces that talk to each other:

*   **Frontend (`/frontend`)**: Built with React and Vite. It draws the entire user interface in the browser without reloading the page. It manages animations, user interaction, and sends background requests to the API.
*   **Backend (`/backend`)**: Built with Python and Flask. It acts strictly as a data provider (JSON API). It handles authentication, talks directly to the local Docker daemon to start/stop containers, and runs background cleanup jobs.

---

## 2. Step-by-Step API Workflow

### A. Authentication (`/api/login`)
If you visit the app, you are required to log in.
1. The React app (`Login.jsx`) sends a `POST` request to `http://localhost:5000/api/login` with the username and password.
2. The Flask backend checks this against hardcoded credentials (`admin` / `admin123`).
3. If correct, Flask returns a JSON response containing a success flag and a session token.
4. React saves this token in `localStorage` and redirects the user to the Dashboard.

### B. Loading the Dashboard (`/api/challenges`)
1. React's `Challenges.jsx` component mounts and sends a `GET` request to `/api/challenges`.
2. Flask responds with a JSON array of all available challenges (their names, descriptions, categories, and points). **Crucially, it strips out the secret flags.**
3. React also checks its own `localStorage` to see if you have previously solved any challenges and dims those cards, adding a "SOLVED" badge.

### C. Launching a Challenge (`/api/challenges/<id>/deploy`)
When you click a challenge and hit **[ DEPLOY INSTANCE ]**, the heavy lifting begins:
1. React shows a "Building image..." loading state and sends a `POST` request to deploy.
2. **Image Loading**: Flask checks your computer's Docker system to see if the image for this challenge (e.g., `sql-challenge:latest`) exists. If not, it runs `docker load -i sql-challenge.tar` to unpack the local archive.
3. **Container Spawning**: Flask tells Docker to run the image in detached mode in the background.
4. **Dynamic Port Mapping**: Flask asks Docker to map the challenge's internal port (5000) to a random, available port on your computer. This prevents port conflicts if multiple challenges are running.
5. **Heartbeat Registration**: Flask saves the new container's ID and sets a `last_heartbeat` timestamp for right now.
6. Flask returns the random port number to React. React displays the clickable target link `http://localhost:<random_port>`.

### D. The Dynamic Heartbeat (`/api/challenges/<id>/heartbeat`)
We do not use a strict countdown timer. Instead, we keep the container alive as long as you are actively playing:
1. While the `ChallengeDetail.jsx` page is open, React sets up a `setInterval` that sends a tiny `POST` request to the `/heartbeat` API every 30 seconds.
2. Flask receives the ping and updates the container's `last_heartbeat` timestamp to the current time.

### E. Submitting the Flag (`/api/challenges/<id>/submit`)
1. You find the flag in the container and paste it into the React terminal input.
2. React sends a `POST` request to the `/submit` API with your flag.
3. Flask compares your flag against the actual flag stored securely in `app.py`.
4. If it matches, Flask returns `{ "correct": true }`.
5. React shows "ACCESS GRANTED", marks the challenge as solved in `localStorage`, and waits 3 seconds.
6. React automatically sends a `POST` to `/api/challenges/<id>/stop` to destroy the container, as it is no longer needed.

### F. Background Cleanup (The Janitor)
What if you deploy a challenge and then just close your browser tab? The heartbeats will stop, but the container is still running in Docker, wasting RAM!
1. To prevent resource leaks, Flask runs a background thread using `APScheduler`.
2. Every 60 seconds, this janitor wakes up and loops through all active containers.
3. It checks if `current_time - last_heartbeat > 2 minutes`.
4. If a container hasn't sent a heartbeat in over 2 minutes, the janitor forcefully runs `container.stop()` and `container.remove()`, cleaning up your system resources safely.

---

## 3. Project Structure Reference

```text
cyberarena/
├── backend/
│   ├── app.py                  # Main Flask API, Docker logic, and APScheduler janitor
│   ├── requirements.txt        # Python dependencies (flask, docker, flask-cors, apscheduler)
│   └── *.tar                   # Pre-packed docker image files for the challenges
├── frontend/
│   ├── index.html              # Vite entry HTML
│   ├── package.json            # NPM dependencies
│   ├── vite.config.js          # Vite build config
│   └── src/
│       ├── api/client.js       # Centralized fetch wrappers for API calls
│       ├── components/         # Reusable React UI (GlitchLogo, TerminalPanel, etc.)
│       ├── context/            # AuthContext for session management
│       ├── pages/              # Main routes (Landing, Login, Challenges, ChallengeDetail)
│       └── App.jsx             # React Router configuration
└── README.md                   # Setup instructions
```
