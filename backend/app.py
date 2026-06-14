from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import docker
import subprocess
import time

app = Flask(__name__)
app.secret_key = "cyberarena_secret"
CORS(app, supports_credentials=True)

USERNAME = "admin"
PASSWORD = "admin123"

client = docker.from_env()

CHALLENGES = {
    "sql": {
        "id": "sql",
        "name": "SQL Injection",
        "category": "Web",
        "description": "Exploit SQL vulnerabilities to retrieve unauthorized database records or bypass controls.",
        "points": 100,
        "image": "sql-challenge",
        "tar": "sql-challenge.tar",
        "flag": "HTB{sql_injection_master}"
    },
    "cookie": {
        "id": "cookie",
        "name": "Cookie Tampering",
        "category": "Web",
        "description": "Manipulate HTTP cookies to hijack sessions or elevate privileges.",
        "points": 100,
        "image": "cookie-challenge",
        "tar": "cookie-challenge.tar",
        "flag": "HTB{cookie_monster}"
    },
    "idor": {
        "id": "idor",
        "name": "IDOR Challenge",
        "category": "Web",
        "description": "Exploit Insecure Direct Object References to access restricted resources.",
        "points": 150,
        "image": "idor-challenge",
        "tar": "idor-challenge.tar",
        "flag": "HTB{idor_explorer}"
    },
    "roman": {
        "id": "roman",
        "name": "Roman Challenge",
        "category": "Crypto",
        "description": "Cryptography or encoding challenge based on Roman ciphers or numerals.",
        "points": 50,
        "image": "roman-challenge",
        "tar": "roman-challenge.tar",
        "flag": "HTB{et_tu_brute}"
    },
}

# Keep track of active containers for cleanup
# { container_id: { "expires_at": timestamp_ms } }
active_containers = {}

def ensure_image_loaded(image_name, tar_file):
    images = [img.tags for img in client.images.list()]
    image_exists = False
    for tags in images:
        if f"{image_name}:latest" in tags:
            image_exists = True
            break
    if not image_exists:
        subprocess.run(["docker", "load", "-i", tar_file], check=True)

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if username == USERNAME and password == PASSWORD:
        return jsonify({"success": True, "token": "dummy_session_token"})
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route("/api/challenges", methods=["GET"])
def get_challenges():
    # Return list of challenges without sensitive info like tar/flag
    challenge_list = []
    for cid, c in CHALLENGES.items():
        challenge_list.append({
            "id": c["id"],
            "name": c["name"],
            "category": c["category"],
            "description": c["description"],
            "points": c["points"]
        })
    return jsonify(challenge_list)

@app.route("/api/challenges/<challenge_id>/deploy", methods=["POST"])
def deploy_challenge(challenge_id):
    challenge = CHALLENGES.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404

    try:
        ensure_image_loaded(challenge["image"], challenge["tar"])

        container = client.containers.run(
            challenge["image"],
            detach=True,
            ports={"5000/tcp": None}
        )
        container.reload()

        port = container.attrs["NetworkSettings"]["Ports"]["5000/tcp"][0]["HostPort"]
        
        now = int(time.time() * 1000)
        
        active_containers[container.id] = {
            "last_heartbeat": now,
            "challenge_id": challenge_id
        }

        return jsonify({
            "container_id": container.id,
            "host": "localhost",
            "port": port,
            "started_at": now
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/challenges/<challenge_id>/stop", methods=["POST"])
def stop_challenge(challenge_id):
    data = request.get_json() or {}
    container_id = data.get("container_id")
    
    if not container_id:
        return jsonify({"error": "Missing container_id"}), 400
        
    try:
        container = client.containers.get(container_id)
        container.stop()
        container.remove()
        if container_id in active_containers:
            del active_containers[container_id]
        return jsonify({"success": True})
    except docker.errors.NotFound:
        return jsonify({"success": True}) # already stopped
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/challenges/<challenge_id>/heartbeat", methods=["POST"])
def challenge_heartbeat(challenge_id):
    data = request.get_json() or {}
    container_id = data.get("container_id")
    
    if not container_id or container_id not in active_containers:
        return jsonify({"error": "Container not found or expired"}), 404
        
    active_containers[container_id]["last_heartbeat"] = int(time.time() * 1000)
    return jsonify({"success": True})

@app.route("/api/challenges/<challenge_id>/submit", methods=["POST"])
def submit_flag(challenge_id):
    challenge = CHALLENGES.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404
        
    data = request.get_json() or {}
    flag = data.get("flag", "").strip()
    
    if flag == challenge["flag"]:
        return jsonify({"correct": True})
    else:
        return jsonify({"correct": False})

# Background cleanup task
def cleanup_expired_containers():
    now = int(time.time() * 1000)
    expired = []
    for cid, info in list(active_containers.items()):
        # 120,000 ms = 2 minutes timeout if no heartbeat is received
        if (now - info.get("last_heartbeat", 0)) > 120000:
            expired.append(cid)
            
    for cid in expired:
        try:
            container = client.containers.get(cid)
            container.stop()
            container.remove()
            print(f"Cleaned up expired container {cid}")
        except Exception as e:
            print(f"Error cleaning up container {cid}: {e}")
        finally:
            if cid in active_containers:
                del active_containers[cid]

scheduler = BackgroundScheduler()
scheduler.add_job(func=cleanup_expired_containers, trigger="interval", seconds=60)
scheduler.start()

if __name__ == "__main__":
    app.run(debug=True)
