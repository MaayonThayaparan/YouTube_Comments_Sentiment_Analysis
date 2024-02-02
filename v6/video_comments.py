from googleapiclient.discovery import build, HttpError
from sentiment_analysis import *

"""
-----------------comments Resource Data Structure-----------------

Documentation: https://developers.google.com/youtube/v3/docs/comments


-----------------commentThreads Resource Data Structure-----------------

Documentation: https://developers.google.com/youtube/v3/docs/commentThreads


"""


api_key = 'AIzaSyAHr4ifOFPDXu8nUGVDnkdo9gK_gFWbtDs'

 
def video_comments(video_id):

    # empty list for storing all comments, total likes, and replies
    comments_all = {}

    #empty list for storing info about single comment, total likes, and replies
    comment_info = {}

    # empty dictionary for storing replies and sentiment
    replies = {}

    # initiliazes counter variable to be used to index the comments_all dictionary, prevents override if comments are the same string
    counter = 1
 
    # creating youtube resource object
    youtube = build('youtube', 'v3',
                    developerKey=api_key)
 
    # retrieve youtube video results
    try: 
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
                        
                        # Used to index the replies, prevents same replies from override in dictionary
                        replyCount = 1
                      
                        # iterate through all reply
                        for reply in item['replies']['comments']:
                            
                            # Create a dictionary with reply info
                            reply_info = {}
                    
                          
                            # Extract reply
                            reply_comment = reply['snippet']['textDisplay']

                            # Extract likeCount
                            reply_likeCount = reply['snippet']['likeCount']

                            # Determines the sentiment of the reply regarding the comment
                            reply_sentiment = analyze_review_sentiments(reply_comment)
                            reply_sentiment_label = reply_sentiment['label']
                            reply_sentiment_score = reply_sentiment['score']

                            # Updates reply_info dictionary with reply information
                            reply_info['reply'] = reply_comment
                            reply_info['reply_sentiment_label'] = reply_sentiment_label
                            reply_info['reply_sentiment_score'] = reply_sentiment_score
                            reply_info['reply_likeCount'] = reply_likeCount

                            # Store reply is list
                            replies[replyCount] = reply_info

                            # Increase index for reply counter
                            replyCount +=1
                    
                    # Determines the sentiment of the comment
                    comment_sentiment = analyze_review_sentiments(comment)
                    comment_sentiment_label = comment_sentiment['label']
                    comment_sentiment_score = comment_sentiment['score']

                    # Add comment, total likes, and replies to dictionary
                    #comment_info['comment'] = comment
                    comment_info['comment'] = comment
                    comment_info['likeCount'] = likeCount
                    comment_info['comment_sentiment_label'] = comment_sentiment_label
                    comment_info['comment_sentiment_score'] = comment_sentiment_score
                    comment_info['replies'] = replies
          

                    # Add comment and info into the comments_all dictionary

                    comments_all[counter] = comment_info

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

    except HttpError as e:
        if e.resp.status == 404:
            comments = 'INVALID ID'
            print(comments)
            return comments
            
        if e.resp.status == 403:
            return("COMMENTS DISABLED")

    except:
        return("This videoID is invalid")
    


# Function to determine overall sentiment of top comments, uses video ID

def topCommentsOverallSentimentID(video_id): 
    
    video_comments = video_comments(video_id)

    # Tracks the absolute total of the label as a number
    total_sentiment_label = 0 

    # Tracks the total score
    total_sentiment_score = 0

    # Converts the total label into a string value
    total_sentiment_label_value = "Neutral"

    # Object to be returned
    overall_sentiment = {}

    # Loop through dictionary of comments and add up label and scores from each comment
    for key,value in video_comments.items():
        comment_sentiment_label = value['comment_sentiment_label']
        comment_sentiment_score = value['comment_sentiment_score']

        # Determines the score if when positive or negative are worth 1 point
        if comment_sentiment_label == 'positive':
            total_sentiment_label +=1
        if comment_sentiment_label == 'negative':
            total_sentiment_label -= 1

        # Increments the overall score
        total_sentiment_score += comment_sentiment_score

    # Determines overall if Positive, Negative, or Neutral
    if total_sentiment_label>0:
        total_sentiment_label_value = "Positive"
    if total_sentiment_label<0:
        total_sentiment_label_value = "Negative"
    if total_sentiment_label==0:
        total_sentiment_label_value = "Neutral"

    overall_sentiment['label'] = total_sentiment_label_value
    overall_sentiment['label_total'] = total_sentiment_label
    overall_sentiment['score'] = total_sentiment_score

    return overall_sentiment


# Function to determine overall sentiment of top comments, parameter is output of the video_comments() function

def topCommentsOverallSentiment(video_comments): 
    
    # Tracks the absolute total of the label as a number
    total_sentiment_label = 0 

    # Tracks the total score
    total_sentiment_score = 0

    # Converts the total label into a string value
    total_sentiment_label_value = "Neutral"

    # Object to be returned
    overall_sentiment = {}
    print(video_comments)
    # Loop through dictionary of comments and add up label and scores from each comment
    for key,value in video_comments.items():
        comment_sentiment_label = value['comment_sentiment_label']
        comment_sentiment_score = value['comment_sentiment_score']

        if comment_sentiment_label == 'positive':
            total_sentiment_label +=1
        if comment_sentiment_label == 'negative':
            total_sentiment_label -= 1

        # Increments the overall score
        total_sentiment_score += comment_sentiment_score

    if total_sentiment_label>0:
        total_sentiment_label_value = "Positive"
    if total_sentiment_label<0:
        total_sentiment_label_value = "Negative"
    if total_sentiment_label==0:
        total_sentiment_label_value = "Neutral"

    # Determines overall if Positive, Negative, or Neutral
    overall_sentiment['label'] = total_sentiment_label_value
    overall_sentiment['label_total'] = total_sentiment_label
    overall_sentiment['score'] = total_sentiment_score

    return overall_sentiment

def getVideo(video_id):

    video_obj = {}

    # creating youtube resource object
    youtube = build('youtube', 'v3',
                    developerKey=api_key)
    
    video=youtube.videos().list(
    part='snippet,statistics',
    id=video_id
    ).execute()

    if video:
        video_items = video['items'][0]
        video_obj['title'] = video_items['snippet']['title']
        video_obj['channel'] = video_items['snippet']['channelTitle']
        
        if video_items['snippet']['thumbnails']['standard']['url']:
            video_obj['thumbnail'] = video_items['snippet']['thumbnails']['standard']['url']
        else:
            video_obj['thumbnail'] = video_items['snippet']['thumbnails']['default']['url']

        video_obj['views'] = video_items['statistics']['viewCount']
        video_obj['likes'] = video_items['statistics']['likeCount']
        video_obj['favorites'] = video_items['statistics']['favoriteCount']
        video_obj['comments'] = video_items['statistics']['commentCount']

    return video_obj




'''
# Enter video id
video_id = "NF1wqBEvIhor"
 

# Call function
all = video_comments(video_id)
print(all)



video_id = "T0sqoW_ps3s1123"
video = getVideo(video_id)
print(video)


'''






