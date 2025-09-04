from openai import OpenAI
import ast

#pip install openai

client = OpenAI(
    api_key="OPENAI_API_KEY",
)

def analyze_comments_oa(comment):

    # This prompt is used to obtain the OpenAI's response in the same format as the Watson NLU
    prompt = 'Provide output as python dictionary in below format: {label: "", score: ""}. \
                Do not output anything except the python dictionary \
                Where score is a float up to 2 decimal places between -1 to +1. \
                Where label can be values: negative (score<0), neutral (score==0), or positive (score>0). \
                Can you rate the sentiment of this sentence:' + comment
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  # Choose the appropriate engine
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # converts the string into a dictionary
    return(ast.literal_eval(response.choices[0].message.content))

'''
comment = analyze_comments_oa("this is great")
print(comment)
print(comment['score'])
print(type(comment['score']))
'''




