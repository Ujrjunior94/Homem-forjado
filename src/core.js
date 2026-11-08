export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const aliases='gn|ex|lv|nm|dt|js|jz|rt|1sm|2sm|1rs|2rs|1cr|2cr|ed|ne|et|jo|sl|pv|ec|ct|is|jr|lm|ez|dn|os|jl|am|ob|jn|mq|na|hc|sf|ag|zc|ml|mt|mc|lc|joao|at|rm|1co|2co|gl|ef|fp|cl|1ts|2ts|1tm|2tm|tt|fm|hb|tg|1pe|2pe|1jo|2jo|3jo|jd|ap'.split('|');
export function parseReference(value, books){
 const input=normalize(value).replace(/[–—]/g,'-').replace(/\./g,'');
 const m=input.match(/^(.+?)\s+(\d+)(?::(\d+)[abc]?(?:-(?:(\d+):)?(\d+)[abc]?)?)?$/);
 if(!m)return null;
 const prefix=m[1].replace(/\s+/g,'');
 const b=books.find((b,i)=>[normalize(b.name).replace(/\s+/g,''),normalize(b.osis),aliases[i]].includes(prefix));
 if(!b)return null;
 const chapter=Number(m[2]),start=m[3]?Number(m[3]):null,end=m[5]?Number(m[5]):start,endChapter=m[4]?Number(m[4]):chapter;
 const verses=b.chapters[chapter-1];
 const lastVerses=b.chapters[endChapter-1];
 if(!verses||!lastVerses||endChapter<chapter||start!==null&&(!verses.some(v=>v.n===start)||!lastVerses.some(v=>v.n===end)||endChapter===chapter&&end<start))return null;
 return {book:b.id,chapter,start,end,...(endChapter!==chapter?{endChapter}: {})};
}
export function readingPlan(books,days=365){
 const chapters=books.flatMap(b=>b.chapters.map((_,i)=>({book:b.id,chapter:i+1})));
 return Array.from({length:days},(_,day)=>chapters.slice(Math.floor(day*chapters.length/days),Math.floor((day+1)*chapters.length/days)));
}
export function searchVerses(books,query){
 const q=normalize(query);
 if(q.length<3)return [];
 const found=[];
 for(const b of books)for(let i=0;i<b.chapters.length;i++)for(const v of b.chapters[i])if(normalize(v.t).includes(q))found.push({book:b.id,chapter:i+1,n:v.n,t:v.t});
 return found;
}
export function validateBackup(data){
 if(!data||data.format!=='homem-forjado-v2'||!data.state||typeof data.state!=='object'||Array.isArray(data.state))throw Error('Arquivo de backup não reconhecido.');
 const s=data.state;
 for(const k of ['notes','highlights','read','devDone','devNotes','planDone','lessonDone','answers'])if(s[k]!==undefined&&(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k])))throw Error('Dados inválidos no backup.');
 if(s.sermons!==undefined&&(!Array.isArray(s.sermons)||s.sermons.some(x=>!x||typeof x.id!=='string'||typeof x.title!=='string')))throw Error('Pregações inválidas no backup.');
 for(const [k,v] of Object.entries(s.notes||{}))if(typeof v!=='string')throw Error('Anotações inválidas no backup.');
 for(const [k,v] of Object.entries(s.devNotes||{}))if(typeof v!=='string')throw Error('Diário inválido no backup.');
 return s;
}
