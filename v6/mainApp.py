from flask import Flask, render_template, request
from sentiment_analysis import *
from video_comments import *


app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
    comments = None
    overall_sentiment = None
    video = None
    if request.method == 'POST':
        video_id = request.form.get('text')  # Use get method to avoid KeyError
        if video_id:
            comments = video_comments(video_id)
            if comments != "INVALID ID":
                video = getVideo(video_id)
                if comments != "COMMENTS DISABLED":
                    overall_sentiment = topCommentsOverallSentiment(comments)
                

    return render_template('index.html', comments=comments, video=video, overall_sentiment=overall_sentiment)

if __name__ == '__main__':
    app.run(debug=True)