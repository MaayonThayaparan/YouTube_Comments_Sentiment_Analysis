import json

# Imports related to Watson Natural Language Understanding (NLU)
from ibm_watson import NaturalLanguageUnderstandingV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson.natural_language_understanding_v1 import Features, SentimentOptions

# Create an `analyze_review_sentiments` method to call Watson NLU and analyze text
# - Call get_request() with specified arguments
# - Get the returned sentiment label such as Positive or Negative

def analyze_review_sentiments(text): 

    url = "https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/c2a00002-1451-4c64-ae8e-fc15145434f9" 
    api_key = "WATSON_API_KEY" 
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
        score = response['sentiment']['document']['score']
    except: 
        label = "neutral"
        score = 0.00

    sentiment = {}
    sentiment['label'] = label
    sentiment['score'] = score

    return sentiment


#This version was not working without try/except block

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