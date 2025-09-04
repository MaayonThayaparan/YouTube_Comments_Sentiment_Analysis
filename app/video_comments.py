from googleapiclient.discovery import build, HttpError
from sentiment_analysis import *
from sentiment_analysis_openai import *

"""
-----------------YouTube 'comments' Resource Data Structure-----------------

Documentation: https://developers.google.com/youtube/v3/docs/comments


-----------------YouTube 'commentThreads' Resource Data Structure-----------------

Documentation: https://developers.google.com/youtube/v3/docs/commentThreads


-----------------Data Structure for the below video_comments return object-----------------

video_comments {
    'reply_input' : float,
    'like_input' : float,
    'total_positive_com' : int,
    'total_negative_com' : int,
    'total_neutral_com' : int,
    'total_sentiment_label' : int,
    'total_sentiment_score' : float,
    'total_sentiment_score_weighed' : float,
    'comments' : {
        int : {
            'comment' : String,
            'comment_sentiment_label' : String,
            'comment_sentiment_score' : float,
            'comment_sentiment_score_weighed' : float,
            'likeCount' : int,
            'totalReplyCount' : int,
            'replyPos' : int,
            'replyNeg' : int,
            'replyNeu' : int,
            'replies' : {
                int : { 
                    'reply' : String,
                    'reply_sentiment_label' : String,
                    'reply_sentiment_score' : int,
                    'reply_likeCount' : int,
                    'reply_sentiment_score_weighed' : float,
                }
            }


        }      

    }

}

"""
# YouTube API key
api_key = 'YOUTUBE_API_KEY'

# This function will call IBM Watson NLU for sentiment analysis
def video_comments_watson(video_id,like_input,reply_input,max_input):

    max_input = float(max_input)
    like_input = float(like_input)
    reply_input = float(reply_input)

    # empty list for storing all comments, total likes, and replies
    comments_all = {}

    # store the like_input and reply_input in the return object, can be used for conditional displays after
    comments_all['reply_input'] = reply_input
    comments_all['like_input'] = like_input
    comments_all['total_positive_com'] = 0
    comments_all['total_negative_com'] = 0
    comments_all['total_neutral_com'] = 0
    comments_all['total_sentiment_label'] = 0
    comments_all['total_sentiment_score'] = 0
    comments_all['total_sentiment_score_weighed'] = 0
    comments_all['comments'] = {}


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

                    # Determines the sentiment of the comment
                    comment_sentiment = analyze_review_sentiments(comment)
                    comment_sentiment_label = comment_sentiment['label']
                    comment_sentiment_score = comment_sentiment['score'] 

                    # Updates the total for the video
                    if comment_sentiment_score > 0:
                        comments_all['total_sentiment_label'] += 1
                        comments_all['total_positive_com'] += 1
                    
                    if comment_sentiment_score < 0:
                        comments_all['total_sentiment_label'] += 1
                        comments_all['total_negative_com'] += 1
                    
                    if comment_sentiment_score == 0:
                        comments_all['total_neutral_com'] += 1                    

                    # Variable used for the weighed score
                    comment_sentiment_score_weighed = comment_sentiment_score
                    
                    # if comment has likes, score is multiplied by likes and the like_input

                    if likeCount>0 and like_input != 0:
                        comment_sentiment_score_weighed = comment_sentiment_score * likeCount * like_input
                    
                    # Add comment, total likes, and replies to dictionary

                    comment_info['comment'] = comment
                    comment_info['comment_sentiment_label'] = comment_sentiment_label
                    comment_info['comment_sentiment_score'] = comment_sentiment_score
                    comment_info['likeCount'] = likeCount
                    comment_info['totalReplyCount'] = totalReplyCount
                    comment_info['replyPos'] = 0
                    comment_info['replyNeg'] = 0
                    comment_info['replyNeu'] = 0

        
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

                            # Weighed reply sentiment score
                            reply_sentiment_score_weighed = reply_sentiment_score 

                            # Only incorporate if non-zero reply_input

                            if reply_input != 0:
                                reply_sentiment_score_weighed = reply_sentiment_score_weighed * reply_input

                                # if reply has likes, score is multiplied by likes and the like_input

                                if reply_likeCount>0 and like_input != 0:
                                    reply_sentiment_score_weighed = reply_sentiment_score_weighed * reply_likeCount * like_input

                                # If parent comment sentiment is positive, responses should be added to the score
                                # Positive reply will add to the score, negative score will lower the score
                                if comment_sentiment_score > 0:
                                    comment_sentiment_score_weighed += reply_sentiment_score_weighed

                                # If parent comment sentiment is negative, responses should be added to the score
                                # Positive reply will make more score more negative (since agreeing wit negative comment), negative score will increase the score (for vice versa)

                                if comment_sentiment_score < 0:
                                    comment_sentiment_score_weighed -= reply_sentiment_score_weighed

                            # Updates reply_info dictionary with reply information
                            reply_info['reply'] = reply_comment
                            reply_info['reply_sentiment_label'] = reply_sentiment_label
                            reply_info['reply_sentiment_score'] = reply_sentiment_score
                            reply_info['reply_likeCount'] = reply_likeCount
                            reply_info['reply_sentiment_score_weighed'] = reply_sentiment_score_weighed

                            # Store reply is list
                            replies[replyCount] = reply_info

                            # Increase index for reply counter
                            replyCount +=1
                    
                    # Updates comment info with replies and weighted score
                    comment_info['replies'] = replies
                    comments_all['total_sentiment_score'] += comment_sentiment_score
                    comment_info['comment_sentiment_score_weighed'] = comment_sentiment_score_weighed

                    # Updates the total weighted score
                    comments_all['total_sentiment_score_weighed'] += comment_sentiment_score_weighed

                    # Add comment and info into the comments_all dictionary

                    comments_all['comments'][counter] = comment_info

                    # empty the comment_info object

                    comment_info = {}

                    # empty reply list
                    replies = {}

                    # Ends comment analysis once max comment search is reached

                    if max_input != 0 and counter >= max_input:
                        return comments_all

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
            return("INVALID ID")
            
        if e.resp.status == 403:
            return("COMMENTS DISABLED")
        
# This functional will call OpenAI for sentiment analysis
def video_comments_oa(video_id,like_input,reply_input,max_input):

    max_input = float(max_input)
    like_input = float(like_input)
    reply_input = float(reply_input)

    # empty list for storing all comments, total likes, and replies
    comments_all = {}

    # store the like_input and reply_input in the return object, can be used for conditional displays after
    comments_all['reply_input'] = reply_input
    comments_all['like_input'] = like_input
    comments_all['total_positive_com'] = 0
    comments_all['total_negative_com'] = 0
    comments_all['total_neutral_com'] = 0
    comments_all['total_sentiment_label'] = 0
    comments_all['total_sentiment_score'] = 0
    comments_all['total_sentiment_score_weighed'] = 0
    comments_all['comments'] = {}


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

                    # Determines the sentiment of the comment
                    comment_sentiment = analyze_comments_oa(comment)
                    comment_sentiment_label = comment_sentiment['label']
                    comment_sentiment_score = float(comment_sentiment['score'])

                    # Updates the total for the video
                    if comment_sentiment_score > 0:
                        comments_all['total_sentiment_label'] += 1
                        comments_all['total_positive_com'] += 1
                    
                    if comment_sentiment_score < 0:
                        comments_all['total_sentiment_label'] += 1
                        comments_all['total_negative_com'] += 1
                    
                    if comment_sentiment_score == 0:
                        comments_all['total_neutral_com'] += 1                    

                    # Variable used for the weighed score
                    comment_sentiment_score_weighed = comment_sentiment_score
                    
                    # if comment has likes, score is multiplied by likes and the like_input

                    if likeCount>0 and like_input != 0:
                        comment_sentiment_score_weighed = comment_sentiment_score * likeCount * like_input
                    
                    # Add comment, total likes, and replies to dictionary

                    comment_info['comment'] = comment
                    comment_info['comment_sentiment_label'] = comment_sentiment_label
                    comment_info['comment_sentiment_score'] = comment_sentiment_score
                    comment_info['likeCount'] = likeCount
                    comment_info['totalReplyCount'] = totalReplyCount
                    comment_info['replyPos'] = 0
                    comment_info['replyNeg'] = 0
                    comment_info['replyNeu'] = 0

        
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
                            reply_sentiment = analyze_comments_oa(reply_comment)
                            reply_sentiment_label = reply_sentiment['label']
                            reply_sentiment_score = float(reply_sentiment['score'])

                            # Weighed reply sentiment score
                            reply_sentiment_score_weighed = reply_sentiment_score 

                            # Only incorporate if non-zero reply_input
                            
                            if reply_input != 0:
                                reply_sentiment_score_weighed = reply_sentiment_score_weighed * reply_input

                                # if reply has likes, score is multiplied by likes and the like_input

                                if reply_likeCount>0 and like_input != 0:
                                    reply_sentiment_score_weighed = reply_sentiment_score_weighed * reply_likeCount * like_input

                                # If parent comment sentiment is positive, responses should be added to the score
                                # Positive reply will add to the score, negative score will lower the score
                                if comment_sentiment_score > 0:
                                    comment_sentiment_score_weighed += reply_sentiment_score_weighed

                                # If parent comment sentiment is negative, responses should be added to the score
                                # Positive reply will make more score more negative (since agreeing wit negative comment), negative score will increase the score (for vice versa)

                                if comment_sentiment_score < 0:
                                    comment_sentiment_score_weighed -= reply_sentiment_score_weighed

                            # Updates reply_info dictionary with reply information
                            reply_info['reply'] = reply_comment
                            reply_info['reply_sentiment_label'] = reply_sentiment_label
                            reply_info['reply_sentiment_score'] = reply_sentiment_score
                            reply_info['reply_likeCount'] = reply_likeCount
                            reply_info['reply_sentiment_score_weighed'] = reply_sentiment_score_weighed

                            # Store reply is list
                            replies[replyCount] = reply_info

                            # Increase index for reply counter
                            replyCount +=1
                    
                    # Updates comment info with replies and weighted score
                    comment_info['replies'] = replies
                    comments_all['total_sentiment_score'] += comment_sentiment_score
                    comment_info['comment_sentiment_score_weighed'] = comment_sentiment_score_weighed

                    # Updates the total weighted score
                    comments_all['total_sentiment_score_weighed'] += comment_sentiment_score_weighed

                    # Add comment and info into the comments_all dictionary

                    comments_all['comments'][counter] = comment_info

                    # empty the comment_info object

                    comment_info = {}

                    # empty reply list
                    replies = {}

                    # Ends comment analysis once max comment search is reached

                    if max_input != 0 and counter >= max_input:
                        return comments_all

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
            return("INVALID ID")
            
        if e.resp.status == 403:
            return("COMMENTS DISABLED")
        
        


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






