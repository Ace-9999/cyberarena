# init_db.py

import sqlite3

conn = sqlite3.connect("database.db")

cur = conn.cursor()

cur.execute("""
CREATE TABLE users(
id INTEGER PRIMARY KEY,
username TEXT,
password TEXT,
role TEXT
)
""")

cur.execute("""
INSERT INTO users VALUES
(1,'john','john123','employee')
""")

cur.execute("""
INSERT INTO users VALUES
(2,'alice','alice123','employee')
""")

cur.execute("""
INSERT INTO users VALUES
(3,'admin','FLAG{SQL_MASTER}','admin')
""")

conn.commit()
conn.close()