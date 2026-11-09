import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseReference,validateBackup} from '../src/core.js';
import {menIndex,manProfile,manKey} from '../src/men-of-bible.js';
const people=JSON.parse(await readFile('src/data/men-of-bible.json','utf8'));
const books=JSON.parse(await readFile('dist/data/bible.json','utf8'));
const state={notes:{},lessonDone:{}};
test('32 distinct lives have all requested topics and valid scripture references',()=>{
 assert.equal(people.length,32);assert.equal(new Set(people.map(p=>p.id)).size,32);
 for(const p of people){for(const field of ['who','did','how','limits'])assert.ok(p[field].length>65,p.name+': '+field);assert.ok(p.purpose.text.length>80);assert.ok(['explicito','narrativa'].includes(p.purpose.kind));assert.equal(p.lessons.length,3);assert.ok(p.refs.length>=2);for(const ref of p.refs)assert.ok(parseReference(ref,books),p.name+': '+ref);}
 assert.equal(people.find(p=>p.id==='jesus').group,'Cristo');assert.equal(people.find(p=>p.id==='jo').purpose.kind,'narrativa');
});
test('profiles preserve reflected notes and completion without mixing PDF or chapter records',()=>{
 const p=people.find(p=>p.id==='moises'),key=manKey(p.id);
 const saved={notes:{['lesson:'+key]:'<img onerror=alert(1)>','lesson:pdf:livro-1':'Outro estudo'},lessonDone:{[key]:true,'pdf:livro-1':true}};
 const html=manProfile(people,p,saved);
 assert.ok(html.includes('&lt;img onerror=alert(1)&gt;'));assert.ok(!html.includes('<img onerror'));
 assert.ok(html.includes('data-id="man:moises"'));assert.ok(html.includes('checked'));
 const parsed=validateBackup({format:'homem-forjado-v2',state:saved});assert.equal(parsed.notes['lesson:pdf:livro-1'],'Outro estudo');assert.equal(parsed.lessonDone['man:moises'],true);
});
test('search, groups and interpretive distinctions are visible in the study views',()=>{
 assert.ok(menIndex(people,state,{query:'MOISES',group:'Todos'}).includes('<h2>Moisés</h2>'));
 assert.ok(menIndex(people,state,{group:'Cristo'}).includes('<h2>Jesus Cristo</h2>'));
 assert.ok(!menIndex(people,state,{group:'Cristo'}).includes('<h2>Paulo</h2>'));
 assert.ok(menIndex(people,state,{query:'inexistente-xyz'}).includes('Nenhum perfil encontrado'));
 assert.ok(manProfile(people,people.find(p=>p.id==='jo'),state).includes('Não afirma conhecer todos os motivos'));
 assert.ok(manProfile(people,people.find(p=>p.id==='jesus'),state).includes('A identidade singular de Jesus'));
});
test('the people module and data are available in the built offline shell',async()=>{
 const worker=await readFile('dist/sw.js','utf8');const paths=JSON.parse(worker.match(/const CORE_FILES = (.+);/)[1]);assert.ok(paths.includes('/men-of-bible.js'));assert.ok(paths.includes('/data/men-of-bible.json'));
});
