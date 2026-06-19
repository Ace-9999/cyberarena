from flask import *
import json
import base64

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():

    username = request.form["username"]

    cookie_data = {
        "username": username,
        "role": "user"
    }

    encoded = base64.b64encode(
        json.dumps(cookie_data).encode()
    ).decode()

    response = redirect("/dashboard")

    response.set_cookie(
        "session",
        encoded
    )

    return response

@app.route("/dashboard")
def dashboard():

    return render_template("dashboard.html")

@app.route("/admin")
def admin():

    cookie = request.cookies.get("session")

    data = json.loads(
        base64.b64decode(cookie)
    )

    if data["role"] != "admin":
        return "Access Denied"

    return render_template("admin.html")

app.run(host="0.0.0.0")