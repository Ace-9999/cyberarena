from flask import Flask, render_template, request, redirect, session
import docker
import subprocess



app = Flask(__name__)
app.secret_key = "cyberarena_secret"

USERNAME = "admin"
PASSWORD = "admin123"

client = docker.from_env()

CHALLENGES = {
    "sql": {
        "image": "sql-challenge",
        "tar": "sql-challenge.tar",
    },
    "cookie": {
        "image": "cookie-challenge",
        "tar": "cookie-challenge.tar",
    },
    "idor": {
        "image": "idor challenge",
        "tar": "idor-challenge.tar",
    },
    "roman": {
        "image": "roman-challenge",
        "tar": "roman-challenge.tar",
    },
}

def ensure_image_loaded(image_name, tar_file):

    images = [img.tags for img in client.images.list()]

    image_exists = False

    for tags in images:
        if f"{image_name}:latest" in tags:
            image_exists = True
            break

    if not image_exists:

        subprocess.run(
            ["docker", "load", "-i", tar_file],
            check=True
        )

@app.route("/")
def home():
    return redirect("/login")

@app.route("/login", methods=["GET","POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        if username == USERNAME and password == PASSWORD:

            session["logged_in"] = True
            return redirect("/dashboard")

    return render_template("login.html")

@app.route("/dashboard")
def dashboard():

    if not session.get("logged_in"):
        return redirect("/login")

    return render_template("dashboard.html")

@app.route("/start/<challenge_id>")
def start_challenge(challenge_id):

    if not session.get("logged_in"):
        return redirect("/login")

    challenge = CHALLENGES.get(challenge_id)

    if not challenge:
        return "Challenge not found", 404

    try:

        ensure_image_loaded(
            challenge["image"],
            challenge["tar"]
        )

        container = client.containers.run(
            challenge["image"],
            detach=True,
            ports={"5000/tcp": None}
        )

        container.reload()

        port = (
            container
            .attrs["NetworkSettings"]
            ["Ports"]["5000/tcp"][0]["HostPort"]
        )

        return redirect(f"http://localhost:{port}")

    except Exception as e:
        return f"Error: {str(e)}"

@app.route("/start-sql")
def start_sql():

    return redirect("/start/sql")

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/login")

if __name__ == "__main__":
    app.run(debug=True)
