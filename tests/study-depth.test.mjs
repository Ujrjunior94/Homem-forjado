import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseReference} from '../src/core.js';
import {renderStudyDepth} from '../src/study-depth.js';
import {manProfile} from '../src/men-of-bible.js';
import {pdfStudySession} from '../src/pdf-studies.js';
const people=JSON.parse(await readFile('src/data/men-of-bible.json','utf8'));
const pdfs=JSON.parse(await readFile('src/data/pdf-studies.json','utf8'));
const supplement=JSON.parse(await readFile('src/data/pdf-study-depth.json','utf8'));
const books=JSON.parse(await readFile('dist/data/bible.json','utf8'));
const quiz=JSON.parse(await readFile('src/data/quiz.json','utf8'));
const empty={notes:{},lessonDone:{},answers:{}};
test('every profile and 20 PDF sessions contain specific close readings with resolvable primary passages',()=>{
 assert.equal(people.filter(p=>p.depth).length,32);const sessions=pdfs.sessions.filter(s=>s.depth);assert.equal(sessions.length,20);
 for(const entry of [...people,...sessions]){const d=entry.depth;assert.equal(d.episodes.length,2);assert.equal(d.connections.length,2);assert.equal(d.questions.length,4);assert.equal(new Set(d.questions).size,4);assert.ok(d.context&&d.theology&&d.practice);
  for(const x of [...d.episodes,...d.connections])assert.ok(parseReference(x.ref,books),entry.id+': '+x.ref);
  for(const ep of d.episodes){assert.ok(ep.analysis.split(/\s+/).length>=65,entry.id);assert.ok(ep.question);}
 }
 assert.equal(new Set(people.flatMap(p=>p.depth.episodes.map(e=>e.analysis))).size,64);
 for(const s of sessions)assert.deepEqual(s.depth,supplement[s.id]);
});
test('inline reading uses the actual Bible text and clearly limits long excerpts',()=>{
 const d=people.find(p=>p.id==='noe').depth,html=renderStudyDepth(d,books,'man-noe');
 const p=parseReference(d.episodes[0].ref,books),text=books.find(b=>b.id===p.book).chapters[p.chapter-1].find(v=>v.n===p.start).t;
 assert.ok(html.includes(text));assert.equal((html.match(/<p><sup>/g)||[]).length,16);assert.ok(html.includes('trecho inicial; abra no leitor para continuar'));assert.ok(html.includes('id="man-noe-episodios"'));assert.ok(html.includes('data-target="man-noe-investigacao"'));
});
test('new study content is escaped and notes retain their existing identities',()=>{
 const person=people.find(p=>p.id==='moises');const saved={...empty,notes:{'lesson:man:moises':'Minha reflexão antiga','lesson:pdf:livro-2':'Meu estudo antigo'},lessonDone:{'man:moises':true,'pdf:livro-2':true}};
 assert.ok(manProfile(people,person,saved,books).includes('Minha reflexão antiga'));
 const session=pdfs.sessions.find(s=>s.id==='livro-2');assert.ok(pdfStudySession(pdfs,session,saved,quiz,books).includes('Meu estudo antigo'));
 const unsafe={...person.depth,context:'<script>alert(1)</script>'};const html=renderStudyDepth(unsafe,books,'safe');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
});
test('the deeper readings are part of the built offline shell',async()=>{
 const worker=await readFile('dist/sw.js','utf8');const paths=JSON.parse(worker.match(/const CORE_FILES = (.+);/)[1]);assert.ok(paths.includes('/study-depth.js'));assert.ok(paths.includes('/data/pdf-study-depth.json'));
});
