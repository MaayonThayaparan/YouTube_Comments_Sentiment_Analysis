from flask import Flask, render_template, request
from sentiment_analysis import *
from video_comments import *


app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
    comments = None
    video = None
    if request.method == 'POST':
        video_id = request.form.get('text')  # Use get method to avoid KeyError
        like_input = request.form.get('likeInput')
        reply_input = request.form.get('replyInput')
        
        if video_id:
            comments = video_comments(video_id,like_input,reply_input)
            if comments != "INVALID ID":
                video = getVideo(video_id)


    return render_template('index.html', comments=comments, video=video)

if __name__ == '__main__':
    app.run(debug=True)