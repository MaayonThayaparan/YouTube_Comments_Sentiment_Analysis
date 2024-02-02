from flask import Flask, render_template, request

from script import *

app = Flask(__name__)


def process_text(input_text):
    result = video_comments(input_text)
    return result

@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    if request.method == 'POST':
        user_text = request.form.get('text')  # Use get method to avoid KeyError
        if user_text:
            result = process_text(user_text)
    return render_template('index.html', result=result)

if __name__ == '__main__':
    app.run(debug=True)