import openai
import requests
import json
from bs4 import BeautifulSoup
from bs4.element import Comment

def tag_visible(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True


def text_from_html(body):
    soup = BeautifulSoup(body, 'html.parser')
    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)  
    return u" ".join(t.strip() for t in visible_texts)

f = open ('bookmarks.json', "r")
  
data = json.loads(f.read())

openai.api_key = ''

print("Starting...")

for i in data:
    url = i['url']
    try:
        r = requests.get(url, timeout=300)
        html = r.text
        text = text_from_html(html)

        if text != '':
            
            response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                    {"role": "system", "content": "You are a helpful assistant who reads websites and provides a list of tags for those websites."},
                    {"role": "user", "content": "Please read the following text and provide me a comma-separated list of tags or keywords to summarize this text: " + text},
                ]
            )

            result = response.choices[0].message.content
            result = result.replace('.', '')
            if not 'provide the text' in result and not 'I\'m sorry' in result and not 'provide me with the text' in result and not 'I\'m happy' in result and not 'share the text' in result:
                i['tags'] = result
                print("+1")
            else:
                print("error")
    except:
        print('error')

with open('bookmarks-out.json', 'w') as outfile:
    json.dump(data, outfile)

print("Finished!")