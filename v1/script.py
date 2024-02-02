from googleapiclient.discovery import build

import requests
import json
# import related models here
from requests.auth import HTTPBasicAuth

# Imports related to Watson Natural Language Understanding (NLU)
from ibm_watson import NaturalLanguageUnderstandingV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson.natural_language_understanding_v1 import Features, SentimentOptions

"""
-----------------comments Resource Data Structure-----------------

Documentation: https://developers.google.com/youtube/v3/docs/comments
{
  "kind": "youtube#comment",
  "etag": etag,
  "id": string,
  "snippet": {
    "authorDisplayName": string,
    "authorProfileImageUrl": string,
    "authorChannelUrl": string,
    "authorChannelId": {
      "value": string
    },
    "channelId": string,
    "videoId": string,
    "textDisplay": string,
    "textOriginal": string,
    "parentId": string,
    "canRate": boolean,
    "viewerRating": string,
    "likeCount": unsigned integer,
    "moderationStatus": string,
    "publishedAt": datetime,
    "updatedAt": datetime
  }
}

-----------------commentThreads Resource Data Structure-----------------

Documentation: https://developers.google.com/youtube/v3/docs/commentThreads

{
  "kind": "youtube#commentThread",
  "etag": etag,
  "id": string,
  "snippet": {
    "channelId": string,
    "videoId": string,
    "topLevelComment": comments Resource,
    "canReply": boolean,
    "totalReplyCount": unsigned integer,
    "isPublic": boolean
  },
  "replies": {
    "comments": [
      comments Resource
    ]
  }
}

"""


#This version was not working with try/except block

def analyze_review_sentiments(text): 

    url = "https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/c2a00002-1451-4c64-ae8e-fc15145434f9" 
    api_key = "nf2VNgFU39a2bzLyiHvvWfHL4Qqe3gFc92VoJ3ncLK5R" 
    authenticator = IAMAuthenticator(api_key) 
    nlu = NaturalLanguageUnderstandingV1(
        version='2021-08-01',
        authenticator=authenticator) 
    nlu.set_service_url(url) 
    nlu.set_disable_ssl_verification(True)
    try:
        response = nlu.analyze( 
            text=text ,
            features=Features(sentiment=SentimentOptions(targets=[text]))
        ).get_result() 
        label=json.dumps(response, indent=2) 
        label = response['sentiment']['document']['label'] 
    except: 
        label = "neutral"

    return label


# Create an `analyze_review_sentiments` method to call Watson NLU and analyze text
# - Call get_request() with specified arguments
# - Get the returned sentiment label such as Positive or Negative

api_key = 'AIzaSyAHr4ifOFPDXu8nUGVDnkdo9gK_gFWbtDs'

'''
def analyze_review_sentiments(text):
    response = ""
    authenticator = IAMAuthenticator('nf2VNgFU39a2bzLyiHvvWfHL4Qqe3gFc92VoJ3ncLK5R')
    natural_language_understanding = NaturalLanguageUnderstandingV1(
        version='2022-04-07',
        authenticator=authenticator
    )
    natural_language_understanding.set_service_url("https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/c2a00002-1451-4c64-ae8e-fc15145434f9")

    response = natural_language_understanding.analyze(text=text,
        features=Features(sentiment=SentimentOptions(targets=[text]))).get_result()
    label = response['sentiment']['document']['label']

    return label
'''

 
def video_comments(video_id):

    # empty list for storing all comments, total likes, and replies
    comments_all = {}

    #empty list for storing info about single comment, total likes, and replies
    comment_info = {}

    # empty dictionary for storing replies and sentiment
    replies = {}

    # initiliazes counter variable to be used to index the comments_all dictionary
    counter = 1
 
    # creating youtube resource object
    youtube = build('youtube', 'v3',
                    developerKey=api_key)
 
    # retrieve youtube video results
    video_response=youtube.commentThreads().list(
    part='snippet,replies',
    videoId=video_id
    ).execute()
 
    # iterate video response
    while video_response:
       
        # extracting required info
        # from each result object 
        for item in video_response['items']:
           
            # Extracting comments
            comment = item['snippet']['topLevelComment']['snippet']['textDisplay']

            # Extracting total likes
            likeCount = item['snippet']['topLevelComment']['snippet']['likeCount']
             
            # counting number of reply of comment
            totalReplyCount = item['snippet']['totalReplyCount']
 
            # if reply is there
            if totalReplyCount>0:

                replyCount = 0
               
                # iterate through all reply
                for reply in item['replies']['comments']:
                   
                    # Extract reply
                    reply = reply['snippet']['textDisplay']

                    # Determines the sentiment of the reply regarding the comment
                    reply_sentiment = analyze_review_sentiments(reply)

                    # Store reply is list
                    replies[reply] = reply_sentiment
            
            # Determines the sentiment of the comment
            comment_sentiment = analyze_review_sentiments(comment)

            # Add comment, total likes, and replies to dictionary
            #comment_info['comment'] = comment
            comment_info['likeCount'] = likeCount
            comment_info['comment_sentiment'] = comment_sentiment
            comment_info['replies'] = replies
   

            # Add comment and info into the comments_all dictionary

            comments_all[comment] = comment_info

            # empty the comment_info object

            comment_info = {}
 
            # empty reply list
            replies = {}

            # increases index for counter

            counter += 1
 
        # Again repeat
        if 'nextPageToken' in video_response:
            video_response = youtube.commentThreads().list(
                    part = 'snippet,replies',
                    videoId = video_id,
                      pageToken = video_response['nextPageToken']
                ).execute()
        else:
            return comments_all



# Function to determine overall sentiment of top comments

def topCommentsOverallSentiment(video_id): 
    
    comments = video_comments(video_id)
    total_sentiment = 0

    for key,value in comments.items():
        comment_sentiment = value['comment_sentiment']

        if comment_sentiment == 'positive':
            total_sentiment +=1
        if comment_sentiment == 'negative':
            total_sentiment +-1

    if total_sentiment>0:
        print("positive" + str(total_sentiment))
    if total_sentiment<0:
        print("negative" + str(total_sentiment))
    if total_sentiment==0:
        print("neutral" + str(total_sentiment))



'''
# Enter video id
video_id = "bkedJRAoTWM"
 

# Call function
all = video_comments(video_id)
print(all)
topCommentsOverallSentiment(video_id)
print(analyze_review_sentiments("this is bad"))

'''

 








