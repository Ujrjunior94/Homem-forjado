import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseReference,searchVerses} from '../src/core.js';
import {editions,editionById,scriptureText,passageVerses} from '../src/bible-editions.js';
import {prayerIndex,prayerDetail,prayerNoteId} from '../src/prayers.js';
import {renderAdvancedStudy} from '../src/study-depth.js';
const load=async name=>JSON.parse(await readFile('dist/data/'+name+'.json','utf8'));
const [base,arc,bpm,prayers,advanced,men,pdfs]=await Promise.all(['bible','bible-arc1911','bible-bpm','prayers','advanced-studies','men-of-bible','pdf-studies'].map(load));
test('three identified editions retain full book/chapter structure and genuinely different source texts',()=>{
 assert.equal(editions.length,3);
 for(const data of [base,arc,bpm]){assert.equal(data.length,66);assert.equal(data.reduce((n,b)=>n+b.chapters.length,0),1189);
  for(const b of data)for(const c of b.chapters){assert.ok(c.length);assert.equal(new Set(c.map(v=>v.n)).size,c.length);for(const v of c){assert.ok(v.t.trim());assert.equal(typeof v.n,'number');assert.doesNotMatch(v.t,/<[^>]+>|\[\d+\]/);}}
 }
 assert.equal(arc.flatMap(b=>b.chapters.flat()).length,31104);assert.equal(bpm.flatMap(b=>b.chapters.flat()).length,31098);
 assert.match(arc[39].chapters[5].find(v=>v.n===9).t,/Pae nosso/);assert.match(bpm[39].chapters[5].find(v=>v.n===9).t,/Orem desta maneira/);
 assert.notEqual(base[42].chapters[2][15].t,arc[42].chapters[2][15].t);
 assert.equal(searchVerses(arc,'aquelle').some(x=>x.book===43&&x.chapter===3&&x.n===16),true);
 assert.ok(editionById('bpm').notice.includes('revisão'));assert.ok(editionById('arc1911').notice.includes('Ortografia histórica'));
});
test('missing source verses are shown as gaps and never silently filled from another edition',()=>{
 assert.equal(bpm[41].chapters[16].some(v=>v.n===36),false);assert.ok(base[41].chapters[16].some(v=>v.n===36));
 const html=scriptureText('Lucas 17:36',bpm,editionById('bpm'),{canonical:base});assert.ok(html.includes('não apresenta texto'));assert.ok(!html.includes(base[41].chapters[16].find(v=>v.n===36).t));
 const full=scriptureText('Mateus 6:9-13',arc,editionById('arc1911'),{canonical:base});assert.ok(full.includes('Pae nosso'));assert.ok(full.includes('ARC')===false);assert.equal((full.match(/<p><sup>/g)||[]).length,5);
 const cross=passageVerses('Gênesis 1:31-2:3',base);assert.equal(cross.length,4);assert.equal(cross[3].chapter,2);
});
test('24 prayer pages resolve actual biblical passages, search situations and preserve safe personal notes',()=>{
 assert.equal(prayers.length,24);assert.equal(new Set(prayers.map(p=>p.id)).size,24);
 for(const p of prayers){assert.ok(parseReference(p.ref,base),p.id);assert.equal(p.movements.length,3);assert.ok(p.context&&p.interpretation&&p.response&&p.adaptation);assert.ok(p.situations.length);for(const ed of [{data:base,id:'blivre'},{data:arc,id:'arc1911'},{data:bpm,id:'bpm'}])assert.ok(scriptureText(p.ref,ed.data,editionById(ed.id),{canonical:base}).includes('scripture-passages'));}
 const index=prayerIndex(prayers,{query:'enfermidade',situation:'Enfermidade e fragilidade'});assert.ok(index.includes('Quando a enfermidade traz angústia'));assert.ok(!index.includes('Quando há motivos para agradecer'));
 const p=prayers.find(p=>p.id==='medo');const html=prayerDetail(p,{notes:{'lesson:prayer:medo':'<script>nota</script>'},lessonDone:{'prayer:medo':true}},arc,editionById('arc1911'),base);
 assert.ok(html.includes('&lt;script&gt;nota'));assert.ok(!html.includes('<script>nota'));assert.ok(html.includes('data-id="prayer:medo"'));assert.ok(html.includes('checked'));assert.ok(html.includes('ADAPTAÇÃO PARA HOJE'));assert.ok(html.includes('Esta sugestão foi escrita para o aplicativo'));
});
test('all 32 profiles and 20 PDF sessions have referenced multi-part exegesis, a genuine interpretive question and reasoned answers',()=>{
 assert.equal(Object.keys(advanced).length,52);
 for(const p of men)assert.ok(advanced['man:'+p.id],p.id);
 assert.equal(pdfs.sessions.filter(s=>advanced['pdf:'+s.id]).length,20);
 for(const [id,a] of Object.entries(advanced)){
  assert.ok(a.argument);assert.ok(a.walkthrough.length>=3);for(const part of a.walkthrough){assert.ok(parseReference(part.ref,base),id+': '+part.ref);assert.ok(part.title&&part.text.split(/\s+/).length>=35,id);}
  assert.ok(a.tension.question&&a.tension.discussion.split(/\s+/).length>50,id);assert.equal(a.answers.length,2);assert.equal(a.synthesis.outline.length,3);
  const html=renderAdvancedStudy(a,base,id);assert.ok(html.includes('Análise por trechos'));assert.ok(html.includes('Pistas de resposta'));assert.ok(html.includes(a.tension.question));
 }
 const a=structuredClone(advanced['man:moises']);a.argument='<img src=x onerror=alert(1)>';assert.ok(!renderAdvancedStudy(a,base,'safe').includes('<img src=x'));
});
test('new editions, prayers and detailed analysis belong to the offline shell',async()=>{
 const sw=await readFile('dist/sw.js','utf8'),paths=JSON.parse(sw.match(/const CORE_FILES = (.+);/)[1]);
 for(const path of ['/data/bible-arc1911.json','/data/bible-bpm.json','/data/prayers.json','/data/advanced-studies.json','/prayers.js','/bible-editions.js'])assert.ok(paths.includes(path),path);
 const app=await readFile('src/app.js','utf8');assert.ok(app.includes("state.notes['lesson:'+el.dataset.id]"));assert.ok(app.includes("const prayerId=prayerNoteId(key)"));assert.ok(app.includes("searchVerses(readerBooks(),searchQuery)"));
});

test('prayer notebook IDs resolve the exact saved page without retaining a separator',()=>{
 for(const p of prayers){assert.equal(prayerNoteId('lesson:prayer:'+p.id),p.id);assert.equal(prayers.find(x=>x.id===prayerNoteId('lesson:prayer:'+p.id)).title,p.title);}
 assert.equal(prayerNoteId('lesson:man:moises'),null);assert.equal(prayerNoteId('43:1'),null);
});
