import urllib.request, urllib.parse, http.cookiejar
from html.parser import HTMLParser
from pathlib import Path
from collections import Counter
url='https://dibbs2.bsm.dla.mil/Downloads/RFQ/Archive/in261005.txt'
class Form(HTMLParser):
 def __init__(self):
  super().__init__(); self.action=None; self.fields={}
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='form': self.action=d.get('action')
  if tag=='input' and d.get('name') and d.get('type') in ['hidden','submit']: self.fields[d['name']]=d.get('value','')
jar=http.cookiejar.CookieJar()
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
with opener.open(url,timeout=30) as r:
 body=r.read(); initial_url=r.url
form=Form(); form.feed(body.decode('utf-8'))
if form.action:
 action=urllib.parse.urljoin(initial_url,form.action)
 req=urllib.request.Request(action,data=urllib.parse.urlencode(form.fields).encode('ascii'))
 with opener.open(req,timeout=30) as r:
  body=r.read(); print('After consent:',r.status,r.headers.get('Content-Type'),r.url)
 if b'<html' in body.lower():
  with opener.open(url,timeout=30) as r:
   body=r.read(); print('File retry:',r.status,r.headers.get('Content-Type'),r.url)
output_path = Path(__file__).resolve().parent / 'in261005.txt'
output_path.write_bytes(body)
print('Saved to:', output_path)
text=body.decode('utf-8',errors='replace')
if '<html' in text.lower():
 print('Result: HTML page, download not confirmed'); print(text[:200])
else:
 lines=[x for x in text.splitlines() if x.strip()]
 print('Downloaded bytes:',len(body)); print('Rows:',len(lines)); print('Row lengths:',dict(Counter(map(len,lines))))
 print('Distinct solicitations:',len({x[:13] for x in lines})); print('First row:',repr(lines[0]))
