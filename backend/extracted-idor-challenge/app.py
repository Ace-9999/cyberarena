from flask import Flask, render_template, request, redirect

app = Flask(__name__)

users = {
    "1": {
        "name": "John",
        "department": "IT"
    },

    "2": {
        "name": "Alice",
        "department": "HR"
    },

    "42": {
        "name": "Admin",
        "department": "Security",
        "flag": "FLAG{IDOR_FOUND}"
    }
}


@app.route("/")
def home():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():

    username = request.form["username"]

    return redirect("/dashboard")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/profile")
def profile():

    user_id = request.args.get("id")

    if user_id not in users:
        return "User not found"

    return render_template(
        "profile.html",
        data=users[user_id]
    )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )