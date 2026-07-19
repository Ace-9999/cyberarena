import os
import json
import time
import random
import string
import secrets
import subprocess

import requests
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")  # read backend/.env before anything else

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from apscheduler.schedulers.background import BackgroundScheduler

import db
from auth import make_token, require_auth, optional_auth

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "cyberarena_secret")
CORS(app, supports_credentials=True)

FIRST_BLOOD_BONUS = int(os.environ.get("FIRST_BLOOD_BONUS", "25"))

# ------------------------------------------------------------------
#  Challenge config — the single source of truth.
#  Flags + docker image/tar mapping live HERE (server-side) and never
#  touch the database or the browser. Public columns get synced to the
#  `challenges` table on startup for leaderboard joins.
# ------------------------------------------------------------------
CHALLENGES = {
    "sql": {
        "id": "sql", "name": "SQL Injection", "category": "Web", "difficulty": "Medium",
        "description": "Exploit SQL vulnerabilities to retrieve unauthorized database records or bypass controls.",
        "points": 100, "image": "sql-challenge", "tar": "sql-challenge.tar",
        "flag": "FLAG{SQL_MASTER}",
    },
    "cookie": {
        "id": "cookie", "name": "Cookie Tampering", "category": "Web", "difficulty": "Easy",
        "description": "Manipulate HTTP cookies to hijack sessions or elevate privileges.",
        "points": 100, "image": "cookie-challenge", "tar": "cookie-challenge.tar",
        "flag": "FLAG{COOKIE_TAMPERING_101}",
    },
    "idor": {
        "id": "idor", "name": "IDOR Challenge", "category": "Web", "difficulty": "Medium",
        "description": "Exploit Insecure Direct Object References to access restricted resources.",
        "points": 150, "image": "idor-challenge", "tar": "idor-challenge.tar",
        "flag": "FLAG{IDOR_FOUND}",
    },
    "roman": {
        "id": "roman", "name": "Roman Challenge", "category": "Crypto", "difficulty": "Easy",
        "description": "Cryptography or encoding challenge based on Roman ciphers or numerals.",
        "points": 50, "image": "roman-challenge", "tar": "roman-challenge.tar",
        "flag": "FLAG{et_tu_brute}",
    },
}

PUBLIC_CHALLENGE_FIELDS = ("id", "name", "category", "difficulty", "points", "description")


def sync_challenges_to_db():
    """Upsert public challenge metadata so the DB can join solves -> challenges."""
    try:
        for c in CHALLENGES.values():
            db.execute(
                """
                insert into challenges (id, name, category, difficulty, points, description)
                values (%s, %s, %s, %s, %s, %s)
                on conflict (id) do update set
                    name = excluded.name,
                    category = excluded.category,
                    difficulty = excluded.difficulty,
                    points = excluded.points,
                    description = excluded.description
                """,
                (c["id"], c["name"], c["category"], c["difficulty"], c["points"], c["description"]),
            )
        print("[startup] Synced challenges to database.")
    except Exception as e:
        print(f"[startup] WARNING: could not sync challenges to DB: {e}")


# ------------------------------------------------------------------
#  Docker — lazily initialised so the API still works if Docker is down
#  (only deploy/stop actually need it).
# ------------------------------------------------------------------
_docker_client = None


def get_docker():
    global _docker_client
    if _docker_client is None:
        import docker
        _docker_client = docker.from_env()
    return _docker_client


def ensure_image_loaded(image_name, tar_file):
    client = get_docker()
    for img in client.images.list():
        if f"{image_name}:latest" in img.tags:
            return
    subprocess.run(["docker", "load", "-i", tar_file], check=True)


def get_challenge_security_settings():
    return {
        "bind_host": (os.environ.get("CHALLENGE_BIND_HOST", "127.0.0.1") or "127.0.0.1").strip(),
        "network_name": (os.environ.get("CHALLENGE_NETWORK_NAME", "cyberarena-challenges") or "cyberarena-challenges").strip(),
        "network_internal": os.environ.get("CHALLENGE_NETWORK_INTERNAL", "false").lower() in {"1", "true", "yes", "on"},
        "memory_limit": os.environ.get("CHALLENGE_MEMORY_LIMIT", "256m"),
        "nano_cpus": os.environ.get("CHALLENGE_NANO_CPUS", "500000000"),
        "pids_limit": int(os.environ.get("CHALLENGE_PIDS_LIMIT", "64")),
        "proxy_host": (os.environ.get("CHALLENGE_PROXY_HOST", "127.0.0.1") or "127.0.0.1").strip(),
        "proxy_port": int(os.environ.get("CHALLENGE_PROXY_PORT", "5000") or "5000"),
    }


def ensure_challenge_network(client, network_name, internal):
    try:
        network = client.networks.get(network_name)
        current_internal = bool(network.attrs.get("Internal", False))
        if current_internal != internal:
            try:
                network.remove()
            except Exception:
                pass
            client.networks.create(network_name, driver="bridge", internal=internal)
    except Exception:
        try:
            client.networks.create(network_name, driver="bridge", internal=internal)
        except Exception as exc:
            if "already exists" not in str(exc).lower():
                raise


def build_challenge_container_name(challenge_id):
    return f"cyberarena-{challenge_id}-{secrets.token_hex(3)}"


def find_active_challenge_instance(challenge_id):
    for container_id, meta in active_containers.items():
        if meta.get("challenge_id") == challenge_id:
            return container_id, meta
    return None, None


# { container_id: { "last_heartbeat": ms, "challenge_id": id, "container_ip": ip } }
active_containers = {}


# ------------------------------------------------------------------
#  Helpers
# ------------------------------------------------------------------
def serialize_user(row):
    """Strip secrets; stringify uuids for JSON."""
    if not row:
        return None
    return {
        "id": str(row["id"]),
        "username": row["username"],
        "reg_no": row["reg_no"],
        "dp": row.get("dp") or "",
        "bio": row.get("bio") or "",
        "team_id": str(row["team_id"]) if row.get("team_id") else None,
    }


def gen_reg_no():
    for _ in range(25):
        rn = "24" + "".join(random.choices(string.ascii_uppercase, k=3)) + "".join(random.choices(string.digits, k=4))
        if not db.query_one("select 1 from users where reg_no = %s", (rn,)):
            return rn
    raise RuntimeError("Could not generate a unique register number")


def gen_invite_code():
    for _ in range(25):
        code = secrets.token_hex(3).upper()  # 6 hex chars, e.g. 'A3F19C'
        if not db.query_one("select 1 from teams where invite_code = %s", (code,)):
            return code
    raise RuntimeError("Could not generate a unique invite code")


def user_total_points(user_id):
    row = db.query_one("select coalesce(sum(points),0) as p from solves where user_id = %s", (user_id,))
    return int(row["p"]) if row else 0


# ==================================================================
#  AUTH
# ==================================================================
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if db.query_one("select 1 from users where username = %s", (username,)):
        return jsonify({"error": "Username already taken"}), 409

    row = db.execute(
        "insert into users (username, password_hash, reg_no) values (%s, %s, %s) "
        "returning id, username, reg_no, dp, bio, team_id",
        (username, generate_password_hash(password), gen_reg_no()),
        returning=True,
    )
    user = serialize_user(row)
    return jsonify({"success": True, "token": make_token(row), "user": user})


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    row = db.query_one(
        "select id, username, password_hash, reg_no, dp, bio, team_id from users where username = %s",
        (username,),
    )
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    return jsonify({"success": True, "token": make_token(row), "user": serialize_user(row)})


@app.route("/api/me", methods=["GET"])
@require_auth
def me():
    row = db.query_one(
        "select id, username, reg_no, dp, bio, team_id from users where id = %s",
        (request.user_id,),
    )
    if not row:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": serialize_user(row), "points": user_total_points(request.user_id)})


@app.route("/api/profile", methods=["PUT"])
@require_auth
def update_profile():
    data = request.get_json() or {}
    dp = data.get("dp")
    bio = data.get("bio")
    username = data.get("username")

    sets, params = [], []
    if dp is not None:
        sets.append("dp = %s"); params.append(dp)
    if bio is not None:
        sets.append("bio = %s"); params.append(bio)
    if username is not None:
        username = username.strip()
        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400
        clash = db.query_one("select 1 from users where username = %s and id <> %s", (username, request.user_id))
        if clash:
            return jsonify({"error": "Username already taken"}), 409
        sets.append("username = %s"); params.append(username)

    if not sets:
        return jsonify({"error": "Nothing to update"}), 400

    params.append(request.user_id)
    row = db.execute(
        f"update users set {', '.join(sets)} where id = %s returning id, username, reg_no, dp, bio, team_id",
        tuple(params),
        returning=True,
    )
    return jsonify({"success": True, "user": serialize_user(row)})


# ==================================================================
#  CHALLENGES
# ==================================================================
@app.route("/api/challenges", methods=["GET"])
def get_challenges():
    return jsonify([{k: c[k] for k in PUBLIC_CHALLENGE_FIELDS} for c in CHALLENGES.values()])


@app.route("/api/me/progress", methods=["GET"])
@require_auth
def my_progress():
    rows = db.query_all(
        "select challenge_id, points, first_blood from solves where user_id = %s",
        (request.user_id,),
    )
    return jsonify({
        "solved": [r["challenge_id"] for r in rows],
        "points": sum(r["points"] for r in rows),
        "first_bloods": [r["challenge_id"] for r in rows if r["first_blood"]],
    })


@app.route("/api/challenges/<challenge_id>/deploy", methods=["POST"])
@require_auth
def deploy_challenge(challenge_id):
    challenge = CHALLENGES.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404
    try:
        security = get_challenge_security_settings()
        client = get_docker()
        ensure_image_loaded(challenge["image"], challenge["tar"])
        ensure_challenge_network(client, security["network_name"], security["network_internal"])

        container = client.containers.run(
            challenge["image"],
            name=build_challenge_container_name(challenge_id),
            detach=True,
            network=security["network_name"],
            ports={"5000/tcp": (security["bind_host"], None)},
            mem_limit=security["memory_limit"],
            nano_cpus=int(security["nano_cpus"]),
            pids_limit=security["pids_limit"],
            cap_drop=["ALL"],
            security_opt=["no-new-privileges:true"],
        )
        container.reload()
        network_settings = container.attrs.get("NetworkSettings", {}).get("Networks", {})
        container_ip = None
        if security["network_name"] in network_settings:
            container_ip = network_settings[security["network_name"]].get("IPAddress")
        host_port = None
        port_bindings = container.attrs.get("HostConfig", {}).get("PortBindings", {})
        if "5000/tcp" in port_bindings and port_bindings["5000/tcp"]:
            host_port = port_bindings["5000/tcp"][0].get("HostPort")
        if not host_port:
            host_port = str(security["proxy_port"])
        if host_port == "":
            host_port = str(security["proxy_port"])
        if host_port in {"0", ""}:
            host_port = str(security["proxy_port"])
        now = int(time.time() * 1000)
        active_containers[container.id] = {
            "last_heartbeat": now,
            "challenge_id": challenge_id,
            "container_ip": security["bind_host"],
            "container_port": int(host_port),
            "proxy_host": security["bind_host"],
        }
        return jsonify({"container_id": container.id, "host": security["bind_host"], "port": host_port, "started_at": now})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/challenges/<challenge_id>/stop", methods=["POST"])
@require_auth
def stop_challenge(challenge_id):
    container_id = (request.get_json() or {}).get("container_id")
    if not container_id:
        return jsonify({"error": "Missing container_id"}), 400
    try:
        import docker
        container = get_docker().containers.get(container_id)
        container.stop()
        container.remove()
        active_containers.pop(container_id, None)
        return jsonify({"success": True})
    except Exception as e:
        # NotFound -> already gone; treat as success
        if e.__class__.__name__ == "NotFound":
            active_containers.pop(container_id, None)
            return jsonify({"success": True})
        return jsonify({"error": str(e)}), 500


@app.route("/api/challenges/<challenge_id>/heartbeat", methods=["POST"])
@require_auth
def challenge_heartbeat(challenge_id):
    container_id = (request.get_json() or {}).get("container_id")
    if not container_id or container_id not in active_containers:
        return jsonify({"error": "Container not found or expired"}), 404
    active_containers[container_id]["last_heartbeat"] = int(time.time() * 1000)
    return jsonify({"success": True})


@app.route("/api/challenges/<challenge_id>/proxy", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
@app.route("/api/challenges/<challenge_id>/proxy/", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
@app.route("/api/challenges/<challenge_id>/proxy/<path:subpath>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
@optional_auth
def proxy_challenge_request(challenge_id, subpath=""):
    container_id, instance = find_active_challenge_instance(challenge_id)
    if not instance:
        return jsonify({"error": "Challenge instance is not running"}), 404

    target_path = f"/{subpath}" if subpath else ""
    target_host = instance.get("proxy_host") or instance.get("container_ip") or "127.0.0.1"
    target_port = instance.get("container_port") or instance.get("proxy_port") or 5000
    target_url = f"http://{target_host}:{target_port}{target_path or '/'}"

    forwarded_headers = dict(request.headers)
    forwarded_headers.pop("Host", None)
    forwarded_headers.pop("Content-Length", None)
    forwarded_headers["X-Forwarded-For"] = request.remote_addr or "127.0.0.1"
    forwarded_headers["X-Forwarded-Proto"] = request.scheme
    forwarded_headers["X-Forwarded-Host"] = request.host

    last_exc = None
    for attempt in range(3):
        try:
            response = requests.request(
                method=request.method,
                url=target_url,
                params=request.args.to_dict(flat=False) or None,
                data=request.get_data(),
                headers=forwarded_headers,
                timeout=10,
                allow_redirects=False,
            )
            break
        except requests.RequestException as exc:
            last_exc = exc
            time.sleep(1)
    else:
        return jsonify({"error": str(last_exc)}), 502

    excluded_headers = {
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "connection",
        "server",
        "date",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "upgrade",
    }
    headers = {
        k: v for k, v in response.headers.items()
        if k.lower() not in excluded_headers
    }
    return Response(response.content, status=response.status_code, headers=headers, content_type=response.headers.get("content-type", "application/octet-stream"))


@app.route("/api/challenges/<challenge_id>/submit", methods=["POST"])
@require_auth
def submit_flag(challenge_id):
    challenge = CHALLENGES.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404

    flag = (request.get_json() or {}).get("flag", "").strip()
    if flag != challenge["flag"]:
        return jsonify({"correct": False})

    base_points = challenge["points"]

    # Insert the solve; if the user already solved it, do nothing.
    row = db.execute(
        "insert into solves (user_id, challenge_id, points) values (%s, %s, %s) "
        "on conflict (user_id, challenge_id) do nothing returning id",
        (request.user_id, challenge_id, base_points),
        returning=True,
    )
    if row is None:
        return jsonify({"correct": True, "already_solved": True, "total_points": user_total_points(request.user_id)})

    solve_id = row["id"]

    # First blood = earliest solve for this challenge across the whole platform.
    earliest = db.query_one(
        "select id from solves where challenge_id = %s order by solved_at asc, id asc limit 1",
        (challenge_id,),
    )
    first_blood = earliest and str(earliest["id"]) == str(solve_id)
    awarded = base_points
    if first_blood:
        awarded = base_points + FIRST_BLOOD_BONUS
        db.execute("update solves set first_blood = true, points = %s where id = %s", (awarded, solve_id))

    invalidate_leaderboard_cache()
    return jsonify({
        "correct": True,
        "first_blood": bool(first_blood),
        "points_awarded": awarded,
        "total_points": user_total_points(request.user_id),
    })


# ==================================================================
#  TEAMS
# ==================================================================
@app.route("/api/teams", methods=["POST"])
@require_auth
def create_team():
    name = ((request.get_json() or {}).get("name") or "").strip()
    if len(name) < 3:
        return jsonify({"error": "Team name must be at least 3 characters"}), 400
    if db.query_one("select 1 from teams where name = %s", (name,)):
        return jsonify({"error": "Team name already taken"}), 409

    current = db.query_one("select team_id from users where id = %s", (request.user_id,))
    if current and current["team_id"]:
        return jsonify({"error": "Leave your current team before creating a new one"}), 409

    team = db.execute(
        "insert into teams (name, invite_code) values (%s, %s) returning id, name, invite_code",
        (name, gen_invite_code()),
        returning=True,
    )
    db.execute("update users set team_id = %s where id = %s", (team["id"], request.user_id))
    invalidate_leaderboard_cache()
    return jsonify({"success": True, "team": {"id": str(team["id"]), "name": team["name"], "invite_code": team["invite_code"]}})


@app.route("/api/teams/join", methods=["POST"])
@require_auth
def join_team():
    code = ((request.get_json() or {}).get("invite_code") or "").strip().upper()
    team = db.query_one("select id, name from teams where invite_code = %s", (code,))
    if not team:
        return jsonify({"error": "Invalid invite code"}), 404
    db.execute("update users set team_id = %s where id = %s", (team["id"], request.user_id))
    invalidate_leaderboard_cache()
    return jsonify({"success": True, "team": {"id": str(team["id"]), "name": team["name"]}})


@app.route("/api/teams/leave", methods=["POST"])
@require_auth
def leave_team():
    db.execute("update users set team_id = null where id = %s", (request.user_id,))
    invalidate_leaderboard_cache()
    return jsonify({"success": True})


# One round-trip: the team + all member stats in a single JSON payload.
_MY_TEAM_QUERY = """
select json_build_object(
  'team', (select json_build_object('id', t.id::text, 'name', t.name, 'invite_code', t.invite_code)
           from teams t where t.id = u0.team_id),
  'members', coalesce((
     select json_agg(json_build_object(
         'id', m.id::text, 'username', m.username, 'dp', coalesce(m.dp, ''),
         'points', m.points, 'solves', m.solves) order by m.points desc, m.username asc)
     from (
       select u.id, u.username, u.dp,
              coalesce(sum(s.points), 0)::int as points,
              count(s.id)::int as solves
       from users u left join solves s on s.user_id = u.id
       where u.team_id = u0.team_id
       group by u.id, u.username, u.dp
     ) m), '[]'::json)
) as payload
from users u0
where u0.id = %s
"""


@app.route("/api/teams/me", methods=["GET"])
@require_auth
def my_team():
    row = db.query_one(_MY_TEAM_QUERY, (request.user_id,))
    payload = row["payload"] if row else None
    if isinstance(payload, str):
        payload = json.loads(payload)
    if not payload or not payload.get("team"):
        return jsonify({"team": None})

    members = payload.get("members") or []
    total = sum(m["points"] for m in members)
    for m in members:
        m["contribution"] = round((m["points"] / total) * 100) if total else 0
    return jsonify({"team": payload["team"], "total_points": total, "members": members})


# ==================================================================
#  LEADERBOARD
# ==================================================================
# Short-lived cache so rapid navigation / realtime refetches don't re-hit the
# remote DB every time. Invalidated immediately whenever someone scores.
_lb_cache = {"data": None, "ts": 0.0}
_LB_TTL = 8.0  # seconds


def invalidate_leaderboard_cache():
    _lb_cache["data"] = None


# Builds the whole leaderboard payload in ONE round-trip via JSON aggregation,
# instead of 3 separate queries (each round-trip to the remote DB is the bottleneck).
_LB_QUERY = """
select json_build_object(
  'teams', coalesce((select json_agg(t) from (
      select team_id, team_name as name, points, solves, members
      from team_leaderboard order by points desc, team_name asc) t), '[]'::json),
  'users', coalesce((select json_agg(u) from (
      select us.user_id, us.username, us.dp, us.points, us.solves, t.name as team_name
      from user_scores us left join teams t on t.id = us.team_id
      order by us.points desc, us.username asc) u), '[]'::json),
  'recent', coalesce((select json_agg(r) from (
      select u.username, c.name as challenge, s.points, s.first_blood, s.solved_at
      from solves s join users u on u.id = s.user_id join challenges c on c.id = s.challenge_id
      order by s.solved_at desc limit 15) r), '[]'::json)
) as payload
"""


@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    now = time.time()
    if _lb_cache["data"] is not None and (now - _lb_cache["ts"]) < _LB_TTL:
        return jsonify(_lb_cache["data"])

    row = db.query_one(_LB_QUERY)
    payload = row["payload"] if row else {"teams": [], "users": [], "recent": []}
    if isinstance(payload, str):
        payload = json.loads(payload)

    _lb_cache["data"] = payload
    _lb_cache["ts"] = now
    return jsonify(payload)


# ==================================================================
#  Background cleanup (the janitor) — stop containers with no heartbeat
# ==================================================================
def cleanup_expired_containers():
    now = int(time.time() * 1000)
    expired = [cid for cid, info in list(active_containers.items())
               if (now - info.get("last_heartbeat", 0)) > 120000]
    for cid in expired:
        try:
            container = get_docker().containers.get(cid)
            container.stop()
            container.remove()
            print(f"Cleaned up expired container {cid}")
        except Exception as e:
            print(f"Error cleaning up container {cid}: {e}")
        finally:
            active_containers.pop(cid, None)


scheduler = BackgroundScheduler()
scheduler.add_job(func=cleanup_expired_containers, trigger="interval", seconds=60)
scheduler.start()

# Sync challenge metadata into Postgres at import time.
sync_challenges_to_db()

if __name__ == "__main__":
    app.run(debug=True)
