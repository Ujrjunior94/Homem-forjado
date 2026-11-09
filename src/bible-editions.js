import {escapeHTML as e,parseReference} from './core.js';
export const editions=[
 {id:'blivre',name:'Bíblia Livre · 2018',short:'BLIVRE 2018',file:'bible',notice:'Revisão da tradição de Almeida, edição Textus Receptus. CC BY 4.0.',source:'https://ebible.org/Scriptures/details.php?id=porbr2018'},
 {id:'arc1911',name:'Almeida Revista e Corrigida · 1911',short:'ARC 1911',file:'bible-arc1911',notice:'Ortografia histórica preservada. Edição de 1900, reimpressão de Lisboa de 1911; difere das revisões modernas da ARC. Domínio público.',source:'https://www.gutenberg.org/ebooks/62383'},
 {id:'bpm',name:'Bíblia Portuguesa Mundial · em revisão',short:'BPM · em revisão',file:'bible-bpm',notice:'Rascunho de tradução ainda em revisão, conforme eBible.org. Seleção dos 66 livros do cânon usado neste app; a fonte também inclui outros livros. Domínio público.',source:'https://ebible.org/Scriptures/details.php?id=porbrbsl'}
];
export const editionById=id=>editions.find(x=>x.id===id)||editions[0];
export function editionSelect(id,value,label='Versão da Bíblia'){
 return `<label class="field"><span>${e(label)}</span><select id="${e(id)}" aria-label="${e(label)}">${editions.map(x=>`<option value="${x.id}" ${x.id===value?'selected':''}>${e(x.name)}</option>`).join('')}</select></label>`;
}
export function passageVerses(ref,books){
 const p=parseReference(ref,books);if(!p)return [];
 const b=books.find(b=>b.id===p.book),last=p.endChapter||p.chapter,rows=[];
 for(let c=p.chapter;c<=last;c++)for(const v of b.chapters[c-1]||[]){
  if(c===p.chapter&&p.start&&v.n<p.start||c===last&&p.end&&v.n>p.end)continue;
  rows.push({...v,chapter:c});
 }
 return rows;
}
export function scriptureText(ref,books,edition,{limit=0,canonical=books}={}){
 // Resolve against the canonical locator so a missing numbered verse remains visible as a gap.
 const p=parseReference(ref,canonical);if(!p)return '<p class="notice">Referência indisponível.</p>';
 const b=books.find(b=>b.id===p.book),rows=[];
 for(let c=p.chapter;c<=(p.endChapter||p.chapter);c++)for(const v of b?.chapters[c-1]||[]){
  if(c===p.chapter&&p.start&&v.n<p.start||c===(p.endChapter||p.chapter)&&p.end&&v.n>p.end)continue;
  rows.push({...v,chapter:c});
 }
 const excerpt=limit?rows.slice(0,limit):rows;
 return `<div class="scripture-passages" data-edition="${e(edition.id)}">${excerpt.map(v=>`<p><sup>${p.endChapter?v.chapter+':':''}${v.n}</sup>${e(v.t)}</p>`).join('')||'<p class="notice">Esta edição não apresenta texto nesta numeração. Consulte o capítulo e compare as edições.</p>'}<small>${e(edition.name)}${limit&&rows.length>limit?' · trecho inicial; abra no leitor para continuar':''}.</small></div>`;
}
