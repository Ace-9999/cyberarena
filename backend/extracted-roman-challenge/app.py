from flask import Flask, render_template_string
import random
import string
import base64

app = Flask(__name__)

def caesar_box(text, height):
    rows = ['' for _ in range(height)]
    for i, ch in enumerate(text):
        rows[i % height] += ch
    return ''.join(rows)

def random_partition(total):
    a = random.randint(1, total - 2)
    b = random.randint(1, total - a - 1)
    c = total - a - b
    return [a, b, c]

@app.route("/")
def home():
    flag = "FLAG{et_tu_brute}"
    b64 = base64.b64encode(flag.encode()).decode()

    height = random.randint(3, 10)
    encoded = caesar_box(b64, height)

    parts = random_partition(height)

    paragraph = f"""
    In studying the Romans, historians often discuss military logistics,
    architecture, and administration. One recovered note references the
    encoded string <b>{encoded}</b>. Researchers believe the key height was
    split into three values: {parts[0]}, {parts[1]}, and {parts[2]}.
    """

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Roman Archive | CyberArena</title>
        <link rel="stylesheet" href="/static/style.css">
    </head>
    <body>
        <div class="container">
            <div class="terminal-panel">
                <div class="terminal-header">
                    <div class="terminal-dots">
                        <span class="dot red"></span>
                        <span class="dot amber"></span>
                        <span class="dot green"></span>
                    </div>
                    <div class="terminal-title">roman_archive.sh</div>
                    <div style="width: 42px;"></div>
                </div>
                <div class="terminal-body">
                    <h1>Roman Archive Fragment</h1>
                    <p class="subtitle">Decryption fragment for military logistics logs.</p>
                    
                    <div class="console-box">
                        <div class="console-header">
                            <span>DECRYPTED TEXT</span>
                            <span>STDOUT</span>
                        </div>
                        <div class="console-content">
                            {paragraph}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(html)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
