from flask import Flask, render_template, request
from sentiment_analysis import *
from sentiment_analysis_openai import *
from video_comments import *


app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
    comments = None
    video = None
    model = None
    url = None
    if request.method == 'POST':
        video_id = request.form.get('text')  # Use get method to avoid KeyError
        like_input = request.form.get('likeInput')
        reply_input = request.form.get('replyInput')
        max_input = request.form.get('maxInput')
        model = request.form.get('model')
        url = "https://www.youtube.com/watch?v=" + str(video_id)
        
        if video_id:
            if model=="watsonnlu":
                comments = video_comments_watson(video_id,like_input,reply_input,max_input)
                if comments != "INVALID ID":
                    video = getVideo(video_id)
            elif model=="openai":
                comments = video_comments_oa(video_id,like_input,reply_input,max_input)
                if comments != "INVALID ID":
                    video = getVideo(video_id)




    return render_template('index.html', comments=comments, video=video, model=model, url=url)

if __name__ == '__main__':
    app.run(debug=True)