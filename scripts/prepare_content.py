"""Rebuild derived content from the four supplied PDFs and the retrieved Bible data.
PDFs and raw sources are local inputs and are deliberately not committed.
"""
import json, gzip, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def save(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')))
def zipped(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0))
names = 'Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|1 Samuel|2 Samuel|1 Reis|2 Reis|1 Crônicas|2 Crônicas|Esdras|Neemias|Ester|Jó|Salmos|Provérbios|Eclesiastes|Cantares|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oséias|Joel|Amós|Obadias|Jonas|Miquéias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|1 Coríntios|2 Coríntios|Gálatas|Efésios|Filipenses|Colossenses|1 Tessalonicenses|2 Tessalonicenses|1 Timóteo|2 Timóteo|Tito|Filemom|Hebreus|Tiago|1 Pedro|2 Pedro|1 João|2 João|3 João|Judas|Apocalipse'.split('|')
books=[]
for p in sorted((ROOT/'raw/pt').glob('*.json')):
    b=json.loads(p.read_text())
    books.append({'id':b['bookId'],'osis':b['book'],'name':names[b['bookId']-1],'chapters':[[{'n':v['number'],'t':v['text']} for v in ch['verses']] for ch in b['chapters']]})
books.sort(key=lambda b:b['id'])
zipped(ROOT/'assets/bible.json.gz',books)
originals={}
for p in (ROOT/'raw/original').glob('*.json'):
    b=json.loads(p.read_text())
    originals[b['book']]={'edition':b['version'],'chapters':{str(ch['chapter']):[{'n':v['number'],'t':v['text']} for v in ch['verses']] for ch in b['chapters']}}
zipped(ROOT/'assets/originals.json.gz',originals)

pdf=Path('/tmp/Desafio Bíblico – 365 Dias com Deus.txt').read_text().split('\f')
weeks=[]
for i in range(9,49,2):
    p=pdf[i]; nxt=pdf[i+1]
    heading=p.split('📍',1)[1].split('DIA',1)[0].split('Esta semana',1)[0]
    heading=' '.join(heading.split())
    rows=[]
    for line in p.splitlines():
        m=re.search(r'DIA\s+0?([1-6])\s+(.+?)\s{3,}DIA\s+0?[1-6]\s+(.+)',line)
        if m: rows.append({'day':int(m[1]),'refs':[m[2].strip(),m[3].strip()]})
    reflections={}
    for m in re.finditer(r'Dia ([1-6]):\s*(.*?)(?=\nDia [1-6]:|📍 Dia 7|\Z)',nxt,re.S):
        reflections[int(m[1])]=' '.join(m[2].split()).replace('@paulo_marcondes01','').strip()
    ref=re.search(r'Referência:\s*([^\n]+)',p)[1].strip()
    # Week 16 has a copied reference; preserve the actual reading list and disclose it.
    warning='A referência-chave desta semana parece ter sido repetida da semana anterior no PDF; confira as leituras em Esdras e Neemias.' if len(weeks)==15 else None
    weeks.append({'id':len(weeks)+1,'title':heading,'key':ref,'page':i+1,'reflectionPage':i+2,'days':[{'day':r['day'],'refs':r['refs'],'reflection':reflections.get(r['day'],'Leia o texto em seu contexto e registre o que aprendeu.')} for r in rows],'warning':warning})
save(ROOT/'src/data/devotionals.json',weeks)

quiz=Path('/tmp/250+quiz+biblico.txt').read_text().split('\f')
key=dict((int(n),ord(a)-65) for n,a in re.findall(r'(\d{1,3})\s*-\s*([ABCD])',quiz[-2]))
# Explicitly reviewed against the passages; remaining answer key is attributed, not certified.
reviewed={1:'Gênesis 5:27',2:'1 Samuel 16:13',3:'1 Samuel 10:1',4:'Números 22:28',5:'1 Samuel 17:34-36',6:'Apocalipse 1:9',7:'Mateus 1:18-25',8:'Gênesis 7:13',9:'Lucas 22:54-62',10:'Gênesis 4:17',11:'Mateus 26:15',12:'Números 26:59',13:'Juízes 16:4-21',14:'Atos 9:1-6',17:'2 Timóteo 3:16',18:'Hebreus 1:1-2',21:'Mateus 2:1',22:'Lucas 3:23',24:'João 2:1-11',25:'1 Samuel 1:12-16',26:'1 Samuel 25:18-35',27:'1 Samuel 18:17-19',28:'Rute 1:20',244:'Mateus 17:27',245:'1 Pedro 1:1',246:'Ester 2:17',248:'Mateus 27:24-26',249:'1 Timóteo 6:10',250:'Êxodo 20:3'}
questions=[]
text='\n'.join(quiz[:-2])
for page,t in [(0,text)]:
    for m in re.finditer(r'(?:^|\n)(\d{1,3})\s*-\s*(.*?)(?=(?:\n\d{1,3}\s*-)|\Z)',t,re.S):
        parts=re.split(r'\n([ABCD])\s*-\s*\(\s*\)\s*',m[2])
        if len(parts) not in (5,7,9): raise ValueError((m[1],parts))
        n=int(m[1]); question=' '.join(parts[0].split())
        source_page=1+text[:m.start()].count('\n\u000c')
        source_page=next((i+1 for i,p in enumerate(quiz[:-2]) if re.search(r'(?:^|\n)'+str(n)+r'\s*-',p)),1)
        options=[' '.join(parts[j].split()) for j in range(2,len(parts),2)]
        questions.append({'id':n,'question':question,'options':options,'answer':key.get(n),'reviewed':n in reviewed,'ref':reviewed.get(n),'page':source_page})
assert len(questions)==250 and len({q['id'] for q in questions})==250
save(ROOT/'src/data/quiz.json',questions)
print(json.dumps({'books':len(books),'chapters':sum(len(b['chapters']) for b in books),'verses':sum(len(c) for b in books for c in b['chapters']),'originalBooks':len(originals),'weeks':len(weeks),'reflections':sum(len(w['days']) for w in weeks),'questions':len(questions),'reviewed':len(reviewed)},ensure_ascii=False))
