import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parseReference,validateBackup} from '../src/core.js';
import {pdfStudyIndex,pdfStudySession} from '../src/pdf-studies.js';
const data=JSON.parse(await readFile('src/data/pdf-studies.json','utf8'));
const books=JSON.parse(await readFile('dist/data/bible.json','utf8'));
const quiz=JSON.parse(await readFile('src/data/quiz.json','utf8'));
const state={lessonDone:{},notes:{},answers:{}};
test('all four PDFs become complete, attributable study collections',()=>{
 assert.equal(data.sessions.length,135);assert.equal(new Set(data.sessions.map(x=>x.id)).size,135);
 assert.deepEqual(data.collections.map(x=>x.count),[73,31,6,25]);
 assert.equal(data.sessions.filter(s=>s.book).length,66);
 assert.equal(data.sessions.flatMap(s=>s.days||[]).length,120);
 assert.equal(data.sessions.flatMap(s=>s.cards||[]).length,77);
 assert.deepEqual(data.sessions.flatMap(s=>s.quizIds||[]),Array.from({length:250},(_,i)=>i+1));
 for(const s of data.sessions){const c=data.collections.find(c=>c.id===s.source);assert.ok(c);assert.ok(s.sections.length);assert.ok(s.pages.every(p=>p>=1&&p<=c.pages));
  for(const ref of [...s.refs,...(s.days||[]).flatMap(d=>d.refs),...(s.cards||[]).flatMap(d=>d.refs)])assert.ok(parseReference(ref,books),s.id+': '+ref);
 }
 const body=JSON.stringify(data);assert.ok(!/[\w.+-]+@[\w.-]+\.[a-z]+/i.test(body));assert.ok(!/HP\d{8,}|\b\d{11}\b/.test(body));
});
test('native PDF figures have source coordinates and are included in the offline cache',async()=>{
 const worker=await readFile('dist/sw.js','utf8');const core=JSON.parse(worker.match(/const CORE_FILES = (.+);/)[1]);
 assert.equal(Object.keys(data.figures).length,13);
 for(const f of Object.values(data.figures)){assert.ok(f.alt&&f.caption&&f.page);assert.ok((await stat('src'+f.src)).size>500);assert.ok(core.includes(f.src));assert.ok(f.width>100&&f.height>100);}
 assert.ok(core.includes('/pdf-studies.js'));assert.ok(core.includes('/data/pdf-studies.json'));
});
test('study views retain notes, progress, original questions and safe rendering',()=>{
 const s=data.sessions.find(s=>s.id==='livro-1');const saved={...state,notes:{'lesson:pdf:livro-1':'<script>test</script>'},lessonDone:{'pdf:livro-1':true}};
 const html=pdfStudySession(data,s,saved,quiz);assert.ok(html.includes('&lt;script&gt;test'));assert.ok(html.includes('data-id="pdf:livro-1"'));assert.ok(html.includes('checked'));
 assert.ok(pdfStudyIndex(data,state,{source:'profecias'}).includes('6 sessões'));
 const q237=data.sessions.find(s=>s.quizIds?.includes(237));assert.ok(pdfStudySession(data,q237,state,quiz).includes('O PDF não informa uma resposta'));
 const backup=validateBackup({format:'homem-forjado-v2',state:saved});assert.equal(backup.notes['lesson:pdf:livro-1'],'<script>test</script>');
});
