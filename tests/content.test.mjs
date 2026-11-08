import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseReference,readingPlan,searchVerses,validateBackup,escapeHTML} from '../src/core.js';
const load=async name=>JSON.parse(await readFile('dist/data/'+name+'.json','utf8'));
const books=await load('bible');
test('complete Bible and original data exist, with identifiable verse numbers',async()=>{
 assert.equal(books.length,66);
 assert.equal(books.reduce((n,b)=>n+b.chapters.length,0),1189);
 assert.equal(books.flatMap(b=>b.chapters.flat()).length,31102);
 for(const b of books){
  const original=await load('original/'+b.osis);
  assert.equal(original.edition,b.id<=39?'wlc':'tr');
  assert.ok(Object.keys(original.chapters).length>0);
  for(const c of b.chapters){assert.ok(c.length);assert.equal(c[0].n,1);for(const v of c){assert.ok(v.t.length>0);assert.equal(typeof v.n,'number');}}
 }
 assert.match(books[42].chapters[0][0].t,/princípio/);
 assert.match((await load('original/John')).chapters['1'][0].t,/εν αρχη/);
});
test('reading plan covers every chapter once across 365 days',()=>{
 const plan=readingPlan(books),flat=plan.flat(),keys=flat.map(r=>`${r.book}:${r.chapter}`);
 assert.equal(plan.length,365);assert.equal(flat.length,1189);assert.equal(new Set(keys).size,1189);
 assert.ok(plan.every(day=>day.length===3||day.length===4));assert.deepEqual(flat[0],{book:1,chapter:1});assert.deepEqual(flat.at(-1),{book:66,chapter:22});
});
test('references support accents, numbered books, ranges and reject invalid inputs',()=>{
 assert.deepEqual(parseReference('João 3:16',books),{book:43,chapter:3,start:16,end:16});
 assert.deepEqual(parseReference('2 Corintios 5:17–21',books),{book:47,chapter:5,start:17,end:21});
 assert.equal(parseReference('gn 1',books).book,1);
 assert.deepEqual(parseReference('Juízes 13:24-14:4',books),{book:7,chapter:13,start:24,end:4,endChapter:14});
 for(const ref of ['João 99','João 3:99','João 3:20-2','Livro Inventado 3','Gênesis 0'])assert.equal(parseReference(ref,books),null);
});
test('full-text search matches real Bible text with accent normalization',()=>{
 const results=searchVerses(books,'principio');
 assert.ok(results.some(r=>r.book===43&&r.chapter===1&&r.n===1));
 assert.ok(results.some(r=>r.book===1&&r.chapter===1&&r.n===1));
 assert.deepEqual(searchVerses(books,'ab'),[]);
});
test('PDF-derived reflections and questions are complete and carry provenance',async()=>{
 const weeks=await load('devotionals'),quiz=await load('quiz');
 assert.equal(weeks.length,20);assert.equal(weeks.flatMap(w=>w.days).length,120);
 for(const w of weeks)for(const d of w.days){assert.equal(d.refs.length,2);assert.ok(d.reflection.length>40);for(const r of d.refs)assert.ok(parseReference(r,books),`Unresolved PDF reference: ${r}`);}
 assert.equal(quiz.length,250);assert.equal(quiz.filter(q=>q.reviewed).length,29);assert.equal(quiz.find(q=>q.id===237).answer,null);
 for(const q of quiz){assert.ok(q.page);if(q.answer!==null)assert.ok(q.answer>=0&&q.answer<q.options.length,`Bad answer #${q.id}`);if(q.reviewed)assert.ok(parseReference(q.ref,books),q.ref);}
});
test('editorial references resolve and personal PDF watermarks are absent from output',async()=>{
 const lessons=await load('lessons'),terms=await load('dictionary'),summaries=await load('summaries');
 assert.equal(summaries.length,66);assert.equal(lessons.length,8);assert.equal(terms.length,30);
 for(const l of lessons)assert.ok(parseReference(l.read,books),l.read);
 for(const t of terms)assert.ok(parseReference(t.ref,books),t.ref);
 for(const n of ['devotionals','quiz','lessons','summaries','dictionary','timeline'])assert.doesNotMatch(JSON.stringify(await load(n)),/@gmail\.com|05542787827/);
});
test('backup validation rejects malformed personal data and rendering escapes markup',()=>{
 assert.throws(()=>validateBackup({}));assert.throws(()=>validateBackup({format:'homem-forjado-v2',state:{notes:[]}}));
 assert.throws(()=>validateBackup({format:'homem-forjado-v2',state:{notes:{'43:1':{bad:true}}}}));
 assert.equal(validateBackup({format:'homem-forjado-v2',state:{notes:{'43:1':'A minha nota'},sermons:[]}}).notes['43:1'],'A minha nota');
 assert.equal(escapeHTML('<script>"x"</script>'),'&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
});
