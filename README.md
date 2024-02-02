# YouTube_Comments_Sentiment_Analysis

## Description

YouTube no longer shows dislikes on videos, you could have video with 100000 views and 1000 likes, but possibly 10000 dislikes! So are you suppose to scroll through thousands of comments to determine the video sentiment?!
That's where the YouTube Comment Sentiment Analysis tool comes to save the day! You can input a YouTube video and get video comment sentiment analyzed by either IBM Watson or by ChatGPT. You will be provided the overall video sentiment in addition to a table of the breakdown of sentiment comment by comment.
Tool also comes with additional features to incorporate likes and reply sentiment with an ability to add a custom weight for either value. 
- Default behaviour only looks at top-level comments, likes and replies not considerd.
- If you add a weight for likes, the top-level comment will be altered according to the weight you put in.
     - Ex. A top-level positive comment with 100 likes will be weighed more than a top-level negative comment with 2 likes.
- If you add a weight for reply sentiment, the top-level comment will be altered according to the sentiment of the top-level comment and the sentiment of the reply.
     - A positive reply to a positive top-level comment will increase its positivity (reply agrees with positive sentiment). A positive reply to negative comment will increase its negativity (reply agrees with negative sentiment).
     - A negative reply to a positive top-level comment will decrease its positivity (reply disagrees with positive sentiment). A negative reply to negative comment will increase its positivity (reply disagrees with negative sentiment).
     - If you added a weight for likes, then both the top-level comment sentiment AND reply sentiment will be affected accordingly. 

(Note: Image below zoomed out to show table)

<img width="1867" alt="image" src="https://github.com/MaayonThayaparan/YouTube_Comments_Sentiment_Analysis/assets/43158629/0a5e970b-7750-4666-ae2c-ecdd807aa82c">

## Getting Started

### Dependencies
- Tested on Windows 10
- Create ChatGPT API key at following link: https://openai.com/product#made-for-developers
     - ChatGPT API key can not be shared (gets auto-disabled if posted on GitHub)
     - Click 'Get Started' at the above link. Create account. You can get a free API Key that comes loaded with credits. 
- Tested on Python 3.12.0
- Download Python from: https://www.python.org/downloads/
- Requires Python packages: flask, ibm_watson, openai, google-api-python-client

### Installation
- Download Python from: https://www.python.org/downloads/
- Download project from GitHub
- Open a new terminal and run following commands:
     - pip install flask ibm_watson openai google-api-python-client
 
### Executing the Program
- Navigate to the 'v10' folder (latest version)
- Open the 'sentiment_analysis_openai.py' project file and updates the value for 'api_key' on line 7 with the ChatGPT API key you obtained. Save file. 
- Open terminal
- Navigate to the project folder 'v10'
- Run the following commands: python mainApp.py
- Last commmand will run the server. Open web browser and enter URL: http://localhost:5000

### How to Use

- If program was executed properly, you will see the below webpage. 

<img width="939" alt="image" src="https://github.com/MaayonThayaparan/YouTube_Comments_Sentiment_Analysis/assets/43158629/a6c51b2c-08a8-49ee-be2e-56ed63410acc">

- You can input a YouTube URL (many formats supported) or a YouTube video ID. Putting an non-YouTube URL will display an error.

<img width="429" alt="image" src="https://github.com/MaayonThayaparan/YouTube_Comments_Sentiment_Analysis/assets/43158629/c7f958fb-1599-441f-a797-2cf139e118e2">

- Input YouTube URL or video ID, select whether you want Watson IBM or ChatGPT to do the sentiment analysis then click 'Submit'. The overall video sentiment will be displayed and scrolling down will show you the breakdown comment by comment.

<img width="1872" alt="image" src="https://github.com/MaayonThayaparan/YouTube_Comments_Sentiment_Analysis/assets/43158629/91a55a10-2017-4f6c-a4ad-9068186cb7c2">
<img width="1871" alt="image" src="https://github.com/MaayonThayaparan/YouTube_Comments_Sentiment_Analysis/assets/43158629/b5a7476b-f459-4e34-8dca-1b0a8c3b8ad3">



