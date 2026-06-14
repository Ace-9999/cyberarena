# 🛡️ CyberArena

CyberArena is a lightweight, local Capture The Flag (CTF) hosting platform featuring a **React SPA (Single Page Application)** frontend and a **Flask JSON API** backend. It leverages **Docker** to launch and interact with individual CTF challenges on-demand. 

For an in-depth, step-by-step technical breakdown of how the API and container lifecycle works, please read [HOW_IT_WORKS.md](HOW_IT_WORKS.md).

---

## 🚀 Features

- **React SPA Frontend:** A sleek, fully animated, dark hacker-themed interface that runs in the browser without page reloads.
- **On-Demand Challenge Spawning:** Launches containerized environments only when requested, saving system resources.
- **Dynamic Port Mapping:** Runs multiple challenges simultaneously without port conflicts.
- **Smart Heartbeat System:** Containers stay alive as long as you are actively playing on the page, and are automatically destroyed when you close the tab or solve the challenge.
- **Auto Image Loader:** Automatically loads challenge Docker images directly from pre-packaged `.tar` files if they aren't already in your Docker library.

---

## 🧠 Included Challenges

The repository comes pre-packaged with the following challenge archives:
1. **SQL Injection Challenge (`sql-challenge.tar`):** Exploit SQL vulnerabilities to retrieve unauthorized database records.
2. **Cookie Tampering Challenge (`cookie-challenge.tar`):** Manipulate HTTP cookies to hijack sessions or elevate privileges.
3. **IDOR Challenge (`idor-challenge.tar`):** Exploit Insecure Direct Object References to access restricted resources.
4. **Roman Challenge (`roman-challenge.tar`):** Cryptography or encoding challenge based on Roman ciphers or numerals.

---

## 🛠️ Prerequisites

Before running CyberArena, ensure you have the following installed on your machine:
- [Node.js (LTS) & NPM](https://nodejs.org/) (for the React frontend)
- [Python 3.8+](https://www.python.org/downloads/) (for the Flask backend)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ensure the Docker daemon is running)

---

## 💻 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cyberarena
   ```

2. **Setup the Backend:**
   Open a terminal and install the Python dependencies.
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Setup the Frontend:**
   Open a second terminal and install the Node dependencies.
   ```bash
   cd frontend
   npm install
   ```

---

## 🏃 Running the Application

To run the full application, you need to start both servers.

1. **Start the Flask Backend:**
   In your first terminal:
   ```bash
   cd backend
   python app.py
   ```
   *The API will run on `http://localhost:5000`.*

2. **Start the React Frontend:**
   In your second terminal:
   ```bash
   cd frontend
   npm run dev
   ```
   *The React app will usually run on `http://localhost:5173/`.*

3. **Access the Web Interface:**
   - Open your browser and navigate to the frontend URL (e.g. `http://localhost:5173`).
   - Log in using the default credentials:
     - **Username:** `admin`
     - **Password:** `admin123`

---

## 📂 Project Structure

```text
cyberarena/
├── backend/
│   ├── app.py                  # Flask JSON API and Docker control logic
│   ├── requirements.txt        # Python dependencies
│   └── *.tar                   # Pre-packed docker image files for the challenges
├── frontend/
│   ├── index.html              # Vite entry HTML
│   ├── package.json            # Node dependencies
│   └── src/
│       ├── api/                # API connection logic
│       ├── components/         # Reusable React UI components
│       ├── context/            # React Auth context
│       ├── pages/              # Main application pages
│       └── App.jsx             # React Router configuration
├── HOW_IT_WORKS.md             # In-depth architectural explanation
└── README.md                   # This file
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.
