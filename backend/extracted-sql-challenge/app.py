# app.py

from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/search")
def search():

    username = request.args.get("username","")

    conn = sqlite3.connect("database.db")
    cur = conn.cursor()

    query = f"""
    SELECT username
    FROM users
    WHERE username='{username}'
    """

    try:
        result = cur.execute(query).fetchall()
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)