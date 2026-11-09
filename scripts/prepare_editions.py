"""Build two additional Portuguese editions from identified open sources.
Usage: python scripts/prepare_editions.py --arc-html FILE --bpm-usfx FILE
The 66-book selection follows the canon already used by Homem Forjado.
"""
import argparse,gzip,hashlib,html,json,re
from pathlib import Path
import xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('--arc-html',required=True);p.add_argument('--bpm-usfx',required=True);a=p.parse_args()
base=json.loads(gzip.decompress(Path('assets/bible.json.gz').read_bytes()))
arc_source=Path(a.arc_html).read_bytes();bpm_source=Path(a.bpm_usfx).read_bytes()
arc_ids='Gen Exo Lev Num Deu Jos Jui Ruth ISam IISam IReis IIReis IChr IIChr Esd Neh Est Job Psa Pro Ecc Can Isa Jer Lam Eze Dan Ose Joel Amos Oba Jon Miq Nah Hab Sof Agg Zac Mal Mat Mar Luc Joao Act Rom ICor IICor Gal Eph IPhi Col IThe IIThe ITim IITim Tito IIPhi Heb Thi IPed IIPed IJoao IIJoao IIIJoao Jud Apo'.split()
usfm='GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]*>','',s))).strip()
def empty():return [{**{k:v for k,v in b.items() if k!='chapters'},'chapters':[[] for c in b['chapters']]} for b in base]
arc=empty(); index={code:i for i,code in enumerate(arc_ids)}
for key,body in re.findall(r'<p id="([^"]+)"[^>]*>(.*?)</p>',arc_source.decode(),re.S):
 m=re.fullmatch(r'([A-Za-z]+)(\d+)-(\d+)',key)
 if not m or m[1] not in index:continue
 b,c,n=index[m[1]],int(m[2]),int(m[3])
 body=re.sub(r'<a\b[^>]*class="fnanchor"[^>]*>.*?</a>','',body,flags=re.S)
 body=re.sub(r'<span\s+class="pagenum">.*?</span>','',body,flags=re.S)
 text=re.sub(r'^\d+\s*','',clean(body))
 arc[b]['chapters'][c-1].append({'n':n,'t':text})
bpm=empty(); tree=ET.fromstring(bpm_source); bycode={b.attrib['id']:b for b in tree.findall('book')}
for i,code in enumerate(usfm):
 chapter=0;number=None;parts=[]
 def flush():
  global number,parts
  if number is not None:
   text=re.sub(r'\s+',' ',''.join(parts)).strip()
   if text:bpm[i]['chapters'][chapter-1].append({'n':number,'t':text})
   else:print('Source has no verse text:',code,chapter,number)
  number=None;parts=[]
 def walk(el):
  global chapter,number,parts
  tag=el.tag
  if tag=='c':flush();chapter=int(el.attrib['id'])
  elif tag=='v':flush();number=int(el.attrib['id'])
  elif tag=='ve':flush()
  elif tag in ('f','x','s','r','d','sp','toc','h','id','ide','rem') or el.attrib.get('sfm') in ('mt','mt1','mt2','mt3'):return
  else:
   if el.text and number is not None:parts.append(el.text)
   for child in el:
    walk(child)
    if child.tail and number is not None:parts.append(child.tail)
 walk(bycode[code]);flush()
for name,data in [('arc1911',arc),('bpm',bpm)]:
 for b in data:
  for chapter in b['chapters']:
   ns=[v['n'] for v in chapter]
   assert chapter and len(ns)==len(set(ns)) and ns==sorted(ns),(name,b['name'],ns)
 payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
 Path('assets/bible-'+name+'.json.gz').write_bytes(gzip.compress(payload,mtime=0))
 print(name,len(data),sum(len(b['chapters']) for b in data),sum(len(c) for b in data for c in b['chapters']),len(payload))
print('source checksums',hashlib.sha256(arc_source).hexdigest(),hashlib.sha256(bpm_source).hexdigest())
