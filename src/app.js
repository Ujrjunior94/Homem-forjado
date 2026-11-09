import {normalize, escapeHTML as e, parseReference, readingPlan, searchVerses, validateBackup} from './core.js';
import { guides } from './study-guides.js';
import { presentationHTML, startPresentation } from './presentation.js';
import { createSync, mergeGuestRecords } from './sync.js';
import {pdfStudyIndex,pdfStudySession} from './pdf-studies.js';
import {menIndex,manProfile} from './men-of-bible.js';
import {setupPWA, getPWAStatus, installPWA, installationInstructions, prepareAllOffline} from './pwa.js';

const $=s=>document.querySelector(s);
const KEY='homem-forjado-v2';
const defaults={reading:{book:43,chapter:1},notes:{},highlights:{},read:{},devDone:{},devNotes:{},planDone:{},lessonDone:{},answers:{},sermons:[],fontSize:21};
let state,storageOK=true;
try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{state=structuredClone(defaults);storageOK=false;}
let guestState=state;
const sync=createSync({
 getState:()=>state,
 apply:(records,{switchAccount})=>{
  state=records?{...structuredClone(defaults),...records}:guestState;
  if(switchAccount){sermonId=state.sermons[0]?.id||null;selected=null;}
  storageOK=true;
  if(books.length){if(switchAccount&&view==='biblia')navigate('biblia',state.reading);else render();}
 },
 canApply:()=>!document.querySelector('#modal')?.open&&!document.activeElement?.matches('textarea,input,select'),
 notify:updateAccountStatus
});
let books=[],weeks=[],quiz=[],lessons=[],summaries=[],terms=[],timeline=[],plan=[];
let men=[],manId=null,menQuery='',menGroup='Todos';
let pdfStudies={collections:[],sessions:[],figures:{}},pdfSessionId=null,pdfSource='',pdfQuery='';
let view='inicio',studyTab='pdf',studyFilter='',bookFilter='',devTab='reflexao',weekId=1,dayId=1,planMonth=0,dictFilter='',dictLang='Todos',searchQuery='',searchResults=[],searchPage=0,selected=null,compare=false,originalCache={},originalLoading=false,originalError='',lessonId=null,sermonId=state.sermons[0]?.id||null,quizMode='reviewed',quizIndex=0,quizReveal=false,notebookTab='notes',quizChoice=null;
let menu=false,toastTimer,inputTimer,renderVersion=0;
const sources={
 jornada:{title:'Jornada da Bíblia — Guia Completo',pages:250,id:'libfile_b89f5df36aac8191a09baa3c373befc5',desc:'Panorama dos livros, contexto histórico, personagens e estrutura das Escrituras.',nav:'estudos',label:'PANORAMA'},
 desafio:{title:'Desafio Bíblico — 365 Dias com Deus',pages:62,id:'libfile_db9acd54ff988191b383bbde4386a177',desc:'20 semanas temáticas com 120 reflexões extraídas, além de roteiros de leitura. O arquivo fornecido não contém 365 devocionais completos.',nav:'devocionais',label:'DEVOCIONAL'},
 profecias:{title:'Profecias Bíblicas',pages:11,id:'libfile_48907ec934b08191800c28c4c35a180a',desc:'Promessas, leitura messiânica e diferentes abordagens de interpretação profética.',nav:'estudos',label:'PROFECIAS'},
 quiz:{title:'250 Quiz Bíblico',pages:33,id:'libfile_b487187f865c819191741afa84b84023',desc:'250 perguntas do material. 29 questões conferidas com passagens; o restante mantém o gabarito do PDF e está sinalizado para revisão.',nav:'quiz',label:'CONHECIMENTO'}
};
const sourceURL=s=>`https://chatgpt.com/library?file_id=${sources[s].id}&account_id=personal`;
const paths={home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',book:'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16',layers:'m12 3 10 6-10 6L2 9Zm-9 10 9 5 9-5M3 17l9 5 9-5',sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',feather:'M4 20 14 10m-3-5c5-5 10-2 10-2s3 5-2 10l-5 5H6v-8Z',dictionary:'M5 3h13v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 14h13M8 7h7M8 10h5',history:'M3 12a9 9 0 1 0 2-5M3 3v5h5m4-1v6l4 2',quiz:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',note:'M5 3h14v18H5Zm4 5h6m-6 4h6m-6 4h4',library:'M3 4h4v17H3Zm7 0h4v17h-4Zm7 1 3-1 4 16-3 1Z',search:'m20 20-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',arrow:'M4 12h16m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',left:'m15 5-7 7 7 7',check:'m4 12 5 5L20 6',menu:'M3 6h18M3 12h18M3 18h18',close:'m5 5 14 14M19 5 5 19',bookmark:'M6 3h12v18l-6-4-6 4Z',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',upload:'M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4',plus:'M12 4v16M4 12h16',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',copy:'M8 8h13v13H8ZM3 16V3h13',print:'M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6Zm12-3h.01',leaf:'M4 20C2 10 8 3 21 3c0 13-7 19-17 17Zm0 0L16 8',spark:'m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',cloud:'M7 18a5 5 0 1 1 0-10 6 6 0 0 1 11-1 5 5 0 0 1 0 10H7',clock:'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0'};
const icon=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.book}"/></svg>`;
const navs=[['inicio','Início','home'],['biblia','Bíblia Sagrada','book'],['estudos','Estudos & trilhas','layers'],['devocionais','Devocionais','sun'],['pregacoes','Minhas pregações','feather'],['dicionario','Dicionário bíblico','dictionary'],['historia','História da Bíblia','history'],['homens','Homens da Bíblia','book'],['quiz','Quiz bíblico','quiz'],['caderno','Meu caderno','note'],['biblioteca','Biblioteca & ajustes','library']];
const bById=id=>books.find(b=>b.id===Number(id));
const current=()=>bById(state.reading.book)||books[42];
const refText=r=>`${bById(r.book)?.name||''} ${r.chapter}${r.start?':'+r.start+(r.end&&r.end!==r.start?'-'+r.end:''):r.n?':'+r.n:''}`;
const vKey=(b,c,n)=>`${b}:${c}:${n}`;
const passageButton=(ref,label=ref)=>`<button class="btn" data-action="reference" data-ref="${e(ref)}">${icon('book',14)}${e(label)}</button>`;
function save(){
 if(sync.status.signedIn){storageOK=sync.save();return storageOK;}
 guestState=state;
 try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;return true;}catch{storageOK=false;toast('Não foi possível salvar neste navegador. Exporte um backup para preservar seus registros.');return false;}
}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4300);}
function header(title,subtitle='',label='ESCRITURAS & VIDA',extra=''){return `<div class="page-intro"><div><div class="eyebrow">${label}</div><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${extra}</div>`;}
function empty(title,text='',button=''){return `<div class="empty">${icon('leaf',28)}<h3>${title}</h3><p>${text}</p>${button?`<div class="actions" style="justify-content:center">${button}</div>`:''}</div>`;}
function sourceLine(id,pages){return `<div class="source">Base: ${e(sources[id].title)} · p. ${e(pages)} do arquivo. <a href="${sourceURL(id)}" target="_blank" rel="noopener">Consultar PDF pessoal ${icon('external',11)}</a></div>`;}
const illustration=`<svg viewBox="0 0 500 345" fill="none" aria-hidden="true"><defs><linearGradient id="pg" x1="160" y1="160" x2="370" y2="315" gradientUnits="userSpaceOnUse"><stop stop-color="#fff8e5"/><stop offset="1" stop-color="#bda77f"/></linearGradient><linearGradient id="arch" x1="240" y1="0" x2="240" y2="300" gradientUnits="userSpaceOnUse"><stop stop-color="#e8dcc0"/><stop offset="1" stop-color="#d4c29d" stop-opacity="0"/></linearGradient></defs><circle cx="270" cy="146" r="112" stroke="#b9a67e" stroke-opacity=".35"/><circle cx="270" cy="146" r="122" stroke="#b9a67e" stroke-opacity=".15"/><path d="M195 276V113a75 75 0 0 1 150 0v163" fill="url(#arch)" stroke="#cbb992"/><path d="M205 272V114a65 65 0 0 1 130 0v158" stroke="#e8dfc6" stroke-width="4"/><circle cx="270" cy="123" r="27" fill="#e6d5ad"/><path d="m167 222 70-55 44 25 43-45 66 72M138 247l68-41 45 22 61-34 94 50" stroke="#bca880" stroke-width="1.2"/><path d="M174 282c49-8 135-8 224 8" stroke="#ad9674" stroke-opacity=".4"/><ellipse cx="266" cy="287" rx="139" ry="13" fill="#b4a17d" fill-opacity=".15"/><path d="M128 254c52-10 96-6 130 17 33-23 79-27 130-17l-13 35c-51-6-85-5-117 10-33-15-68-16-118-10z" fill="#8e6b45" stroke="#997953"/><path d="M134 243c47-12 90-8 124 18 37-26 83-30 126-18l-12 37c-45-6-80-4-114 13-32-17-70-19-111-13z" fill="#e5d5b4" stroke="#b79d70"/><path d="M146 206c47-6 80 4 112 43 38-37 73-45 115-40l10 53c-49-10-92-6-125 24-32-30-78-33-124-24z" fill="url(#pg)" stroke="#b39a6f"/><path d="M258 249v37m-101-66c38-2 64 8 87 29m-88-18c34-1 59 8 86 29m-86-18c33 0 56 7 84 25m37-18c25-24 51-32 82-29m-81 40c25-21 50-31 82-28m-82 38c29-19 55-26 84-26" stroke="#a58b61" stroke-width="1.1" stroke-opacity=".65"/><path d="m260 287 15 5-7 30-7-7-9 4z" fill="#844d42"/><g stroke="#8b916c" stroke-width="1.5"><path d="M131 284c-32-41-29-74-7-108M119 258l-22-13m20-1 18-15m-18 2-21-15m23 0 16-14m-11-1-12-16"/><path d="M97 245q-9-14-17-11 1 12 17 11Zm38-16q12-12 17-6-5 12-17 6ZM96 216q-9-13-17-9 3 11 17 9Zm39-14q10-14 17-10-3 13-17 10Zm-23-17q-5-15-12-14-1 11 12 14Zm12-9q3-17 12-17 2 11-12 17Z" fill="#9b9d78" fill-opacity=".55"/></g><g stroke="#b6a27c" stroke-opacity=".4"><path d="M400 112h22m-11-11v22M148 110h14m-7-7v14M366 58h10m-5-5v10"/></g></svg>`;

function home(){
 const date=new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',timeZone:'America/Bahia'}).format(new Date());
 const b=current(),c=state.reading.chapter;
 const quotes=[[19,23,1],[43,1,5],[20,3,5],[19,119,105],[50,4,6],[40,6,33],[45,12,2]];
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia'}).format(new Date());
 const q=quotes[Array.from(today).reduce((n,x)=>n+x.charCodeAt(0),0)%quotes.length];
 const verse=bById(q[0]).chapters[q[1]-1].find(v=>v.n===q[2]);
 const done=Object.values(state.read).filter(Boolean).length;
 const next=weeks.flatMap(w=>w.days.map(d=>({w,d}))).find(x=>!state.devDone[`${x.w.id}:${x.d.day}`])||{w:weeks[0],d:weeks[0].days[0]};
 const contents=[['biblia','Bíblia Sagrada'],['homens','Homens da Bíblia'],['estudos','Estudos & trilhas'],['devocionais','Devocionais'],['pregacoes','Minhas pregações'],['caderno','Meu caderno']];
 return `<div class="open-spread">
 <section class="folio folio-left" aria-labelledby="welcome-title"><div class="book-running"><span>HOMEM FORJADO</span>${icon('book',15)}</div>
 <div class="eyebrow">ESCRITURAS · ESTUDO · VIDA</div><h1 id="welcome-title">A Palavra que<br><em>forja o homem.</em></h1>
 <p class="folio-intro">Abra as Escrituras. Encontre tempo para ouvir, compreender e guardar o que transforma a vida.</p>
 <div class="ornament" aria-hidden="true">❧</div>
 <div class="resume-entry"><span class="resume-icon">${icon('bookmark',28)}</span><div><small>SEU MARCADOR ESTÁ AQUI</small><strong>${e(b.name)} ${c}</strong></div><button data-nav="biblia" aria-label="Continuar leitura em ${e(b.name)} ${c}">${icon('arrow',18)}</button></div>
 <div class="folio-index-title">ÍNDICE DA JORNADA</div><nav class="folio-index" aria-label="Índice da jornada">${contents.map(([id,label],i)=>`<button data-nav="${id}"><span class="index-num">${['I','II','III','IV','V','VI'][i]}</span><span>${label}</span><span class="index-dots" aria-hidden="true"></span><span class="index-arrow" aria-hidden="true">${icon('chevron',12)}</span></button>`).join('')}</nav>
 <div class="folio-foot"><span>Uma página de cada vez.${done?`<span class="folio-progress">${done} de 1.189 capítulos lidos</span>`:''}</span><span class="folio-page">I</span></div></section>
 <section class="folio folio-right" aria-labelledby="meditation-title"><div class="book-running"><span>PALAVRA PARA HOJE</span><span>${e(date)}</span></div>
 <div class="eyebrow">PAUSA PARA MEDITAR</div><h2 class="folio-title" id="meditation-title">Pão para a jornada.</h2>
 <figure class="daily-scripture"><blockquote>${e(verse.t)}</blockquote><figcaption>${e(bById(q[0]).name)} ${q[1]}:${q[2]}<span class="verse-edition">BLIVRE · 2018</span></figcaption><button class="textlink" data-action="reference" data-ref="${e(bById(q[0]).name)} ${q[1]}:${q[2]}">Ler a passagem completa ${icon('arrow',13)}</button></figure>
 <div class="devotional-entry"><div class="eyebrow">SEU PRÓXIMO ENCONTRO · SEMANA ${next.w.id}</div><h3>${e(next.w.title)}</h3><p>Um momento de leitura, reflexão e oração. Continue do dia ${next.d.day} e registre o que a Palavra ensina.</p><button class="btn primary" data-action="next-dev" data-week="${next.w.id}" data-day="${next.d.day}">Abrir meu devocional ${icon('arrow',14)}</button></div>
 <div class="folio-links"><button data-nav="historia">${icon('history',14)} História da Bíblia</button><button data-nav="dicionario">${icon('dictionary',14)} Dicionário</button><button data-nav="biblioteca">${icon('library',14)} Meus materiais</button><button data-action="show-plan">${icon('leaf',14)} Plano de leitura</button></div>
 <div class="folio-foot"><span>Conhecer. Meditar. Viver.</span><span class="folio-page">II</span></div></section></div>`;
}

function bible(){
 const b=current(),c=Math.max(1,Math.min(state.reading.chapter,b.chapters.length));state.reading.chapter=c;
 const verses=b.chapters[c-1],key=`${b.id}:${c}`;
 const original=originalCache[b.osis];
 const originalVerses=original?.chapters[String(c)]||[];
 const lang=b.id<=39?'Hebraico · WLC':'Grego · TR 1550';
 const selectedVerse=selected?verses.find(v=>v.n===selected):null;
 return `${header('Bíblia Sagrada','Leia com atenção. Explore o contexto. Guarde o que aprendeu.','LEITOR BÍBLICO',`<button class="btn subtle" data-action="book-index">${icon('library',15)} Livros</button>`)}
 <div class="reader-toolbar"><label class="field"><span>Livro</span><select id="book-select" aria-label="Livro da Bíblia">${books.map(x=>`<option value="${x.id}" ${b.id===x.id?'selected':''}>${e(x.name)}</option>`).join('')}</select></label><label class="field chapter"><span>Capítulo</span><select id="chapter-select" aria-label="Capítulo">${b.chapters.map((_,i)=>`<option ${c===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label><label class="field"><span>Modo de leitura</span><select id="compare-select"><option value="pt" ${!compare?'selected':''}>Bíblia Livre · Português</option><option value="original" ${compare?'selected':''}>Português + ${b.id<=39?'hebraico':'grego'}</option></select></label><div class="controls push"><button class="iconbtn" data-action="font-down" aria-label="Diminuir letra">A−</button><button class="iconbtn" data-action="font-up" aria-label="Aumentar letra">A+</button><button class="iconbtn" data-action="reader-search" aria-label="Pesquisar na Bíblia">${icon('search',17)}</button></div></div>
 ${selectedVerse?`<div class="verse-actions"><strong>${e(b.name)} ${c}:${selected}</strong><button class="btn" data-action="highlight">${icon('bookmark',14)} ${state.highlights[vKey(b.id,c,selected)]?'Remover destaque':'Destacar'}</button><button class="btn" data-action="open-guide">${icon('layers',14)} Estudar passagem</button><button class="btn" data-action="verse-note">${icon('note',14)} Anotar</button><button class="btn" data-action="verse-sermon">${icon('feather',14)} Usar na pregação</button><button class="iconbtn" data-action="copy-verse" aria-label="Copiar versículo">${icon('copy',14)}</button><button class="iconbtn" data-action="unselect" aria-label="Fechar seleção">${icon('close',14)}</button></div>`:''}
 <div class="reader-layout"><article class="reader-sheet"><div class="reader-head"><div class="eyebrow">${b.id<=39?'ANTIGO':'NOVO'} TESTAMENTO · ${b.chapters.length} CAPÍTULOS</div><h2>${e(b.name)} <span style="color:var(--gold)">${c}</span></h2><p>${compare?'Bíblia Livre em diálogo com uma edição textual identificada':'Bíblia Livre · revisão de 2018'}</p></div><div class="reader-body">
 ${compare?`<div class="verses-compare"><div><div class="column-label">PORTUGUÊS · BLIVRE</div>${verses.map(v=>verseHTML(b,c,v)).join('')}</div><div><div class="column-label">${lang}</div>${original?originalVerses.length?originalVerses.map(v=>`<div class="original-verse" lang="${b.id<=39?'he':'grc'}" dir="${b.id<=39?'rtl':'ltr'}"><sup>${v.n}</sup>${e(v.t)}</div>`).join(''):'<p class="helper">Este capítulo não corresponde à numeração da edição original selecionada. Consulte a edição de origem.</p>':`<div class="notice">${originalError?e(originalError):'Carregando a edição de consulta…'}${originalError?'<button class="textlink" data-action="retry-original">Tentar novamente</button>':''}</div>`}</div></div>`:verses.map(v=>verseHTML(b,c,v)).join('')}
 </div>${compare?'<div class="reader-note">As colunas mostram o capítulo de cada edição. A numeração e os limites de versículos podem diferir, sobretudo em Salmos, Joel e Malaquias. Não é um alinhamento palavra por palavra. WLC e TR são edições textuais; o aramaico aparece nos trechos pertinentes do WLC.</div>':''}<div class="reader-bottom"><button class="btn" data-action="prev-chapter" ${b.id===1&&c===1?'disabled':''}>${icon('left',13)} Anterior</button><label class="checklabel"><input id="mark-read" type="checkbox" ${state.read[key]?'checked':''}> Capítulo lido</label><button class="btn" data-action="next-chapter" ${b.id===66&&c===22?'disabled':''}>Próximo ${icon('chevron',13)}</button></div></article>
 <aside class="context-panel"><span class="eyebrow">UM OLHAR SOBRE O LIVRO</span><h3>${e(b.name)}</h3><p class="context-summary">${e(summaries[b.id-1])}</p><button class="textlink" data-action="book-overview" data-book="${b.id}">Explorar o panorama ${icon('arrow',13)}</button><div><button class="textlink" data-action="open-guide" data-chapter="true">Estudar este capítulo ${icon('arrow',13)}</button></div><hr><span class="eyebrow">ANOTAÇÕES DO CAPÍTULO</span><textarea id="chapter-note" aria-label="Anotações do capítulo" placeholder="O que este texto está ensinando?">${e(state.notes[key]||'')}</textarea><span class="helper" id="note-status">${storageOK?'Salvas neste navegador enquanto você escreve.':'Armazenamento indisponível. Exporte um backup.'}</span><hr><button class="textlink" data-nav="dicionario">${icon('dictionary',14)} Consultar dicionário</button><p class="helper" style="margin-top:12px">Toque em um versículo para destacar, anotar ou incluir em uma pregação.</p></aside></div>`;
}
function guideIndex(){
 return `<div class="grid-2">${guides.map(guide=>`
 <button class="study-card" data-action="open-guide" data-ref="${e(guide.ref)}">
  <span class="eyebrow">${e(guide.ref)}</span>
  <h3>${e(guide.title)}</h3>
  <p>${e(guide.context)}</p>
  <span class="textlink">Abrir guia ${icon('arrow',14)}</span>
 </button>`).join('')}</div>`;
}

function openGuide(reference, wholeChapter=false){
 const book=current(),chapter=state.reading.chapter;
 const number=wholeChapter?null:selected;
 const requested=reference?parseReference(reference,books):null;
 if(reference&&!requested){toast('A passagem do guia está indisponível.');return;}
 const targetBook=requested?bById(requested.book):book;
 const targetChapter=requested?.chapter||chapter;
 const matches=guides.filter(guide=>{
  const passage=parseReference(guide.ref,books);
  if(!passage||passage.book!==targetBook.id||passage.chapter!==targetChapter)return false;
  if(reference)return guide.ref===reference;
  return number===null||number>=passage.start&&number<=passage.end;
 });
 const guide=matches[0];
 const title=guide?.ref||targetBook.name+' '+targetChapter+(number?':'+number:'');
 const passage=guide?parseReference(guide.ref,books):null;
 const noteKey=passage?.start?vKey(targetBook.id,targetChapter,passage.start):number?vKey(targetBook.id,targetChapter,number):targetBook.id+':'+targetChapter;
 const questions=guide?.questions||[
  'Quem fala, a quem se dirige e o que vem antes e depois da passagem?',
  'Qual é a ideia central que você consegue sustentar com o texto?',
  'Que atitude concreta você pode tomar em resposta ao que leu?'
 ];
 const context=guide?.context||summaries[targetBook.id-1];
 showModal(`
  <span class="eyebrow">GUIA DE ESTUDO</span>
  <h2>${e(guide?.title||title)}</h2>
  <div class="actions guide-actions">${passageButton(title,'Ler '+title)}</div>
  <section class="guide-section">
   <h3>${guide?'Contexto da passagem':'Panorama do livro'}</h3>
   <p>${e(context)}</p>
  </section>
  ${guide?`<section class="guide-section"><h3>Leia em paralelo</h3>
   ${guide.links.map(([ref,why])=>`<div class="guide-link">${passageButton(ref)}<p>${e(why)}</p></div>`).join('')}
  </section>`:''}
  <section class="guide-section">
   <h3>Perguntas para estudar</h3>
   <ol>${questions.map(question=>`<li>${e(question)}</li>`).join('')}</ol>
  </section>
  <label class="field"><span>Minha anotação de estudo</span><textarea id="verse-note-text" data-key="${e(noteKey)}" placeholder="O que você aprendeu?">${e(state.notes[noteKey]||'')}</textarea></label>
  <div class="actions"><button class="btn primary" data-action="close-modal">Concluir</button></div>
 `);
}

function verseHTML(b,c,v){const key=vKey(b.id,c,v.n);return `<div id="verse-${v.n}" class="verse ${state.highlights[key]?'highlight':''} ${selected===v.n?'selected':''}" tabindex="0" role="button" aria-label="${e(b.name)} ${c}:${v.n}, selecionar versículo" data-action="select-verse" data-verse="${v.n}"><sup>${v.n}</sup>${e(v.t)}${state.notes[key]?'<span class="note-dot" title="Versículo com anotação">●</span>':''}</div>`;}
function search(){
 const paged=searchResults.slice(searchPage*30,(searchPage+1)*30);
 return `${header('Encontre na Palavra','Busque uma expressão ou uma referência, como João 3:16.','BUSCA BÍBLICA')}<form id="bible-search-form" class="search-field" style="margin-bottom:25px"><label class="sr-only" for="bible-query">Expressão ou referência bíblica</label><input id="bible-query" value="${e(searchQuery)}" placeholder="Ex.: graça, amor, Salmos 23…" type="search"><button class="btn primary" type="submit">${icon('search',16)} Buscar</button></form>${searchQuery?`<div class="panel-heading"><span class="helper">${searchResults.length} versículos encontrados para “${e(searchQuery)}”</span><span class="tag">Bíblia Livre</span></div>`:''}<div class="results">${paged.map(r=>`<button class="result" data-action="reference" data-ref="${e(refText(r))}"><strong>${e(refText(r))}</strong><p>${e(r.t)}</p></button>`).join('')||empty(searchQuery?'Nenhum resultado encontrado.':'Qual passagem você deseja explorar?',searchQuery?'Use uma expressão mais curta ou confira o nome do livro e a numeração.':'A busca por texto começa com 3 caracteres e considera todos os 66 livros.')}</div>${searchResults.length>30?`<div class="actions"><button class="btn" data-action="search-prev" ${searchPage===0?'disabled':''}>Anterior</button><span class="helper">${searchPage+1} / ${Math.ceil(searchResults.length/30)}</span><button class="btn" data-action="search-next" ${(searchPage+1)*30>=searchResults.length?'disabled':''}>Próxima</button></div>`:''}`;
}

function menView(){
 const person=men.find(p=>p.id===manId);
 return person?manProfile(men,person,state):menIndex(men,state,{query:menQuery,group:menGroup});
}
function studies(){
 if(studyTab==='pdf'&&pdfSessionId){const session=pdfStudies.sessions.find(x=>x.id===pdfSessionId);if(session)return pdfStudySession(pdfStudies,session,state,quiz);}
 if(lessonId){const l=lessons.find(x=>x.id===lessonId);if(l)return lesson(l);}
 const filtered=lessons.filter(l=>normalize(l.title+' '+l.category+' '+l.subtitle).includes(normalize(studyFilter)));
 return `${header('Conheça a história. Compreenda o texto.','Um estudo cuidadoso começa com boas perguntas.','ESTUDOS & TRILHAS')}<div class="tabs"><button data-nav="homens">Homens da Bíblia</button><button data-action="study-tab" data-tab="pdf" class="${studyTab==='pdf'?'active':''}">Sessões dos PDFs</button><button data-action="study-tab" data-tab="trilhas" class="${studyTab==='trilhas'?'active':''}">Trilhas de estudo</button><button data-action="study-tab" data-tab="panorama" class="${studyTab==='panorama'?'active':''}">Panorama dos 66 livros</button><button data-action="study-tab" data-tab="guias" class="${studyTab==='guias'?'active':''}">Guias por passagem</button></div>${studyTab==='pdf'?pdfStudyIndex(pdfStudies,state,{source:pdfSource,query:pdfQuery}):studyTab==='guias'?guideIndex():studyTab==='trilhas'?`<div class="filter-row"><div class="search-field">${icon('search',16)}<input id="study-filter" type="search" aria-label="Filtrar trilhas" placeholder="Busque um tema de estudo…" value="${e(studyFilter)}"></div><span class="helper">${lessons.filter(l=>state.lessonDone[l.id]).length} de ${lessons.length} concluídos</span></div><div class="grid-2">${filtered.map(l=>`<button class="study-card" data-action="lesson" data-id="${l.id}"><span class="tag ${l.category==='Profecias'?'gold':''}">${state.lessonDone[l.id]?icon('check',11):''}${l.category}</span><h3>${l.title}</h3><p>${l.subtitle}</p><span class="textlink">Abrir estudo ${icon('arrow',14)}</span></button>`).join('')||empty('Nenhuma trilha encontrada.','Tente outro tema.')}</div>`:panorama()}`;
}
function panorama(){const filtered=books.filter(b=>normalize(b.name).includes(normalize(bookFilter)));return `<div class="filter-row"><div class="search-field">${icon('search',16)}<input id="book-filter" type="search" value="${e(bookFilter)}" placeholder="Encontre um livro…" aria-label="Buscar livro no panorama"></div><span class="tag">Cânon protestante · 66 livros</span></div><div class="grid-3">${filtered.map(b=>`<button class="study-card book-card" data-action="book-overview" data-book="${b.id}"><span class="eyebrow">${String(b.id).padStart(2,'0')} · ${b.id<=39?'ANTIGO':'NOVO'} TESTAMENTO</span><h3>${e(b.name)}</h3><p>${b.chapters.length} capítulos · ${e(summaries[b.id-1].split('. ')[0])}.</p></button>`).join('')||empty('Livro não encontrado.')}</div>`;}
function lesson(l){return `<button class="textlink back" data-action="back-lessons">${icon('left',14)} Todas as trilhas</button><article class="article"><span class="tag">${l.category}</span><h1>${l.title}</h1><p class="lead">${l.subtitle}</p>${passageButton(l.read)}${l.sections.map(([h,p])=>`<section><h2>${h}</h2><p>${p}</p></section>`).join('')}<div class="question">${l.question}</div><label class="field"><span>Minha resposta e minhas descobertas</span><textarea id="lesson-note" data-id="${l.id}" placeholder="Registre sua reflexão…">${e(state.notes['lesson:'+l.id]||'')}</textarea></label><div class="actions"><label class="checklabel"><input id="lesson-done" data-id="${l.id}" type="checkbox" ${state.lessonDone[l.id]?'checked':''}> Marcar estudo como concluído</label></div>${sourceLine(l.source,l.pages)}<p class="helper" style="margin-top:10px">Síntese editorial elaborada para o aplicativo a partir dos temas dos materiais. Comentário e interpretação aparecem separados do texto bíblico.</p></article>`;}
function overview(id){const b=bById(id);const readCount=b.chapters.filter((_,i)=>state.read[`${b.id}:${i+1}`]).length;showModal(`<span class="tag">${b.id<=39?'Antigo':'Novo'} Testamento</span><h2 style="margin-top:14px">${e(b.name)}</h2><p>${e(summaries[b.id-1])}</p><div class="notice">${b.chapters.length} capítulos · ${b.chapters.reduce((n,c)=>n+c.length,0)} versículos nesta edição · ${readCount} capítulos lidos.</div><h3>Para observar na leitura</h3><p style="font-size:16px;margin-top:12px">Quem fala e a quem? Qual é o gênero do texto? O que acontece antes e depois da passagem? Anote também o que permanece em dúvida.</p><div class="actions">${passageButton(b.name+' 1','Começar a leitura')}</div>${sourceLine('jornada','16–250')}<p class="helper" style="margin-top:10px">Panorama resumido e adaptado para o aplicativo. As contagens vêm da edição bíblica incluída.</p>`);}

function devotionals(){
 return `${header('Um tempo com Deus.','Leitura, reflexão e uma resposta guardada no coração.','DEVOCIONAIS')}<div class="tabs"><button data-action="dev-tab" data-tab="reflexao" class="${devTab==='reflexao'?'active':''}">Jornada de reflexão</button><button data-action="dev-tab" data-tab="plano" class="${devTab==='plano'?'active':''}">Bíblia em 365 dias</button></div>${devTab==='plano'?planView():devView()}`;
}
function devView(){
 const w=weeks.find(w=>w.id===weekId)||weeks[0],d=w.days.find(d=>d.day===dayId),key=`${w.id}:${dayId}`;
 return `<div class="dev-layout"><aside class="week-list">${weeks.map(w=>`<button class="week-item ${w.id===weekId?'active':''}" data-action="week" data-week="${w.id}"><small>SEMANA ${String(w.id).padStart(2,'0')} · ${Object.keys(state.devDone).filter(k=>k.startsWith(w.id+':')&&state.devDone[k]).length}/7</small><strong>${e(w.title)}</strong></button>`).join('')}</aside><article class="panel"><span class="eyebrow">SEMANA ${w.id} DE 20</span><h2 style="margin-top:12px;line-height:1.4">${e(w.title)}</h2><div class="day-selector">${Array.from({length:7},(_,i)=>`<button data-action="dev-day" data-day="${i+1}" class="${dayId===i+1?'active':''} ${state.devDone[`${w.id}:${i+1}`]?'done':''}" aria-label="Dia ${i+1}${state.devDone[`${w.id}:${i+1}`]?', concluído':''}">${i+1}</button>`).join('')}</div><span class="tag">${dayId===7?'Dia de pausa e revisão':'Dia '+dayId+' · Leitura & reflexão'}</span>${d?`<div class="dev-reading">${d.refs.map(r=>passageButton(r)).join('')}</div><section class="article"><h3 style="margin:20px 0 12px">Para meditar</h3><p style="font:20px/1.9 var(--serif)">${e(d.reflection)}</p></section>`:`<div class="article"><h3 style="margin:22px 0 13px">Recordar, agradecer, responder.</h3><p style="font:20px/1.9 var(--serif)">Releia suas anotações da semana. Que descoberta mudou sua maneira de enxergar a passagem? Agradeça por algo concreto e escolha uma atitude para a próxima semana.</p><p class="helper" style="margin:15px 0">Roteiro de revisão criado para o aplicativo, inspirado na proposta semanal do material.</p></div>`}${w.warning?`<div class="notice">${e(w.warning)}</div>`:''}<label class="field" style="margin-top:25px"><span>MEU DIÁRIO · ORAÇÃO E APLICAÇÃO</span><textarea id="dev-note" class="journal-field" data-key="${key}" placeholder="O que aprendi? Como posso viver isso? Minha oração…">${e(state.devNotes[key]||'')}</textarea></label><div class="card-footer"><label class="checklabel"><input id="dev-done" type="checkbox" data-key="${key}" ${state.devDone[key]?'checked':''}> Concluí este momento</label><button class="textlink" data-action="dev-next">Próximo dia ${icon('arrow',14)}</button></div>${sourceLine('desafio',d?w.page+', '+w.reflectionPage:w.reflectionPage)}<p class="helper" style="margin-top:10px">Reflexões dos dias 1–6: Paulo Marcondes, conforme o material fornecido. São 120 reflexões em 20 semanas. O PDF fornecido é parcial em relação ao título “365 Dias”.</p></article></div>`;
}
function planView(){
 const done=Object.keys(state.planDone).filter(k=>state.planDone[k]).length;
 const from=planMonth*30,to=Math.min(from+30,365);
 return `<div class="panel" style="margin-bottom:22px"><div class="panel-heading"><h2>A Bíblia inteira, no seu ritmo.</h2><span class="tag">${done} / 365 dias</span></div><p class="helper">Plano complementar criado para o aplicativo: todos os 1.189 capítulos em ordem canônica, distribuídos em 365 dias. Ele é independente dos roteiros do PDF.</p><div class="progress-line"><i style="width:${done/365*100}%"></i></div><div class="controls"><button class="btn" data-action="plan-prev" ${planMonth===0?'disabled':''}>${icon('left',13)} Anteriores</button><span class="helper">Dias ${from+1}–${to}</span><button class="btn" data-action="plan-next" ${planMonth===12?'disabled':''}>Próximos ${icon('chevron',13)}</button></div></div><div class="plan-grid">${plan.slice(from,to).map((refs,i)=>`<section class="plan-day ${state.planDone[from+i]?'done':''}"><label class="checklabel"><input type="checkbox" data-plan-day="${from+i}" ${state.planDone[from+i]?'checked':''}><span class="eyebrow">DIA ${from+i+1}</span></label>${refs.map(r=>`<button class="textlink" data-action="reference" data-ref="${e(refText(r))}">${e(refText(r))}</button>`).join('')}</section>`).join('')}</div>`;
}

const sermonFields=[['central','Ideia central','Em uma frase, o que a passagem ensina?'],['context','Contexto da passagem','Autor, destinatários, gênero e situação…'],['intro','Introdução','Como apresentar o tema e a pergunta da mensagem?'],['point1','1. Primeiro movimento','Explique o texto e registre as referências que sustentam este ponto.'],['point2','2. Segundo movimento','Desenvolva o argumento mantendo a ligação com a passagem.'],['point3','3. Terceiro movimento','Conclua o desenvolvimento do texto.'],['application','Aplicação','Que resposta concreta e coerente com o texto pode ser proposta?'],['conclusion','Conclusão e oração','Retome a ideia central e prepare o encerramento.'],['verses','Referências e versículos','Inclua versículos pelo leitor bíblico ou registre suas referências aqui.']];
function makeSermon(title='Nova mensagem'){const s={id:crypto.randomUUID(),title,reference:'',audience:'',...Object.fromEntries(sermonFields.map(([key])=>[key,''])),updated:new Date().toISOString()};state.sermons.unshift(s);sermonId=s.id;save();return s;}
function sermons(){
 const s=state.sermons.find(s=>s.id===sermonId)||state.sermons[0];if(s)sermonId=s.id;
 return `${header('Uma mensagem que nasce do estudo.','Do primeiro insight ao esboço pronto para compartilhar.','MINHAS PREGAÇÕES',`<button class="btn primary" data-action="new-sermon">${icon('plus',14)} Nova mensagem</button>`)}${!s?empty('Sua próxima mensagem começa aqui.','Abra um esboço, escolha uma passagem e organize o que o texto ensina.','<button class="btn primary" data-action="new-sermon">'+icon('feather',15)+' Criar primeiro esboço</button>'):`<div class="composer-layout"><aside class="sermon-list">${state.sermons.map(x=>`<button data-action="choose-sermon" data-id="${e(x.id)}" class="${x.id===s.id?'active':''}"><strong data-title-for="${e(x.id)}">${e(x.title||'Sem título')}</strong><small>${e(x.reference||'Escolha uma passagem')}</small></button>`).join('')}</aside><article class="panel composer"><div class="panel-heading"><span class="eyebrow">CADERNO DE MENSAGENS</span><span class="editor-status" id="sermon-status">${icon('check',12)} ${storageOK?'Salvo neste navegador':'Salvamento indisponível'}</span></div><label class="sr-only" for="sermon-title">Título da mensagem</label><input class="title" id="sermon-title" data-sermon-field="title" value="${e(s.title)}" placeholder="Título da mensagem"><div class="grid-2"><label class="field"><span>Passagem principal</span><input data-sermon-field="reference" value="${e(s.reference)}" placeholder="Ex.: João 15:1-8"></label><label class="field"><span>Ocasião ou público</span><input data-sermon-field="audience" value="${e(s.audience)}" placeholder="Ex.: Culto de domingo"></label></div><div class="actions"><button class="textlink" data-action="sermon-read">${icon('book',14)} Abrir passagem na Bíblia</button><button class="textlink push" data-action="sermon-template">Preencher perguntas-guia ${icon('spark',13)}</button></div>${sermonFields.map(([key,label,placeholder])=>`<label class="field"><span>${label}</span><textarea data-sermon-field="${key}" placeholder="${placeholder}">${e(s[key]||'')}</textarea></label>`).join('')}<div class="actions"><button class="btn primary" data-action="present-sermon">${icon('book',14)} Modo de apresentação</button><button class="btn" data-action="print-sermon">${icon('print',14)} Imprimir / salvar PDF</button><button class="btn" data-action="download-sermon">${icon('download',14)} Baixar texto</button><button class="btn danger push" data-action="delete-sermon">${icon('trash',14)} Excluir</button></div><p class="helper" style="margin-top:17px">Acompanhe a sincronização e exporte seus registros em Biblioteca & ajustes.</p></article></div>`}`;
}
function dictionary(){const found=terms.filter(t=>normalize(Object.values(t).join(' ')).includes(normalize(dictFilter))&&(dictLang==='Todos'||t.language===dictLang));return `${header('Palavras que abrem caminhos.','Um glossário para compreender termos, ideias e contextos.','DICIONÁRIO BÍBLICO')}<div class="filter-row"><div class="search-field">${icon('search',16)}<input id="dictionary-filter" value="${e(dictFilter)}" placeholder="Ex.: graça, torá, logos, aliança…" type="search" aria-label="Buscar termo no dicionário"></div><select id="dictionary-lang" aria-label="Filtrar por idioma">${['Todos','Hebraico','Grego','Estudo','História'].map(l=>`<option ${dictLang===l?'selected':''}>${l}</option>`).join('')}</select></div><p class="helper" style="margin-bottom:22px">${found.length} verbetes · Definições introdutórias elaboradas para o app. Os códigos Strong abrem um léxico externo para aprofundamento; uma palavra pode ter vários sentidos.</p><div class="grid-2">${found.map(t=>`<article class="panel dictionary-card"><div class="panel-heading"><h3>${e(t.term)}</h3><span class="tag">${t.language}</span></div>${t.original?`<div class="lexeme"><span lang="${t.language==='Hebraico'?'he':'grc'}" dir="${t.language==='Hebraico'?'rtl':'ltr'}">${t.original}</span><small>${t.transliteration} · ${t.strong}</small></div>`:''}<p>${e(t.definition)}</p><div class="actions"><button class="textlink" data-action="reference" data-ref="${e(t.ref)}">${e(t.ref)} ${icon('arrow',13)}</button>${t.strong?`<a class="textlink push" href="https://www.blueletterbible.org/lexicon/${t.strong.toLowerCase()}/kjv/${t.language==='Hebraico'?'wlc':'tr'}/0-1/" target="_blank" rel="noopener">Léxico ${icon('external',12)}</a>`:''}</div></article>`).join('')||empty('Nenhum termo encontrado.','Tente uma palavra em português ou um código Strong.')}</div>`;}
function history(){return `${header('Uma história que atravessa gerações.','Das comunidades antigas ao texto que você lê hoje.','HISTÓRIA DA BÍBLIA')}<div class="notice">As datas de composição e autoria de vários livros são debatidas. Esta linha do tempo apresenta períodos amplos e distingue a história da transmissão dos acontecimentos narrados.</div><div class="timeline">${timeline.map(x=>`<section class="timeline-item"><div class="eyebrow">${x.date}</div><h2>${x.title}</h2><p>${x.text}</p></section>`).join('')}</div><div class="grid-2"><button class="feature" data-action="lesson" data-id="origem"><span class="feature-icon">${icon('library',18)}</span><h3>De onde vêm os livros?</h3><p>Explore os cânones e a formação da coleção bíblica.</p></button><button class="feature" data-action="lesson" data-id="linguas"><span class="feature-icon">${icon('dictionary',18)}</span><h3>Do manuscrito à tradução</h3><p>Entenda as edições e as línguas utilizadas no leitor.</p></button></div>${sourceLine('jornada','7–15, 103, 175')}<p class="helper" style="margin-top:10px">Síntese contextual para estudo; datas tradicionais apresentadas nos PDFs não são tratadas como consenso histórico.</p>`;}
function quizView(){
 const questions=quizMode==='reviewed'?quiz.filter(q=>q.reviewed):quiz;
 quizIndex=Math.min(quizIndex,questions.length-1);const q=questions[quizIndex];
 const attempted=quiz.filter(q=>q.reviewed&&state.answers[q.id]!==undefined),correct=attempted.filter(q=>state.answers[q.id]===q.answer).length;
 return `${header('Aprenda a cada pergunta.','Teste o que sabe e volte ao texto para compreender.','QUIZ BÍBLICO')}<div class="tabs"><button data-action="quiz-mode" data-mode="reviewed" class="${quizMode==='reviewed'?'active':''}">29 questões conferidas</button><button data-action="quiz-mode" data-mode="all" class="${quizMode==='all'?'active':''}">Banco completo · 250</button></div><article class="quiz-panel panel"><div class="panel-heading"><span class="eyebrow">QUESTÃO ${quizIndex+1} / ${questions.length} · PDF Nº ${q.id}</span><span class="tag ${q.reviewed?'':'gold'}">${q.reviewed?'Conferida com a Bíblia':'Gabarito em revisão'}</span></div><div class="progress-line"><i style="width:${(quizIndex+1)/questions.length*100}%"></i></div><h2>${e(q.question.toLocaleLowerCase('pt-BR').replace(/^./,x=>x.toUpperCase()))}</h2>${q.options.map((op,i)=>`<button class="quiz-option ${quizChoice===i?'chosen':''} ${quizReveal&&q.reviewed&&i===q.answer?'correct':''} ${quizReveal&&q.reviewed&&quizChoice===i&&i!==q.answer?'wrong':''}" data-action="quiz-option" data-option="${i}" ${quizReveal?'disabled':''}><b>${String.fromCharCode(65+i)}</b>${e(op)}</button>`).join('')}${!q.reviewed?'<div class="notice">Esta questão preserva o texto do PDF e ainda não foi conferida. Não entra na pontuação. Algumas perguntas do banco têm formulações ambíguas ou gabaritos problemáticos.</div>':''}${quizReveal?`<div class="quiz-feedback"><h3>${q.reviewed?(quizChoice===q.answer?'Uma boa descoberta.':'Vamos voltar ao texto?'):'O que diz o material'}</h3><p class="small">${q.answer===null?'O PDF não fornece resposta para esta questão. Nenhuma foi inventada.':`Gabarito ${q.reviewed?'conferido':'do PDF'}: ${String.fromCharCode(65+q.answer)} — ${e(q.options[q.answer]||'Alternativa ausente no material')}.`}</p>${q.ref?`<div class="actions">${passageButton(q.ref,'Ler '+q.ref)}</div><p class="helper" style="margin-top:12px">Leia também o capítulo para conferir o contexto da resposta.</p>`:''}</div>`:''}<div class="actions"><button class="btn" data-action="quiz-prev" ${quizIndex===0?'disabled':''}>${icon('left',13)} Anterior</button>${!quizReveal?`<button class="btn primary" data-action="quiz-reveal" ${quizChoice===null?'disabled':''}>Conferir resposta</button>`:`<button class="btn primary" data-action="quiz-next" ${quizIndex===questions.length-1?'disabled':''}>Próxima ${icon('arrow',13)}</button>`}<span class="helper push">${correct} acertos em ${attempted.length} conferidas respondidas</span></div>${sourceLine('quiz',q.page)}<p class="helper" style="margin-top:10px">A questão 237 tem gabarito ausente. A questão 20 depende da edição e não integra o conjunto conferido. Respostas e pontuação refletem sua última tentativa.</p></article>`;
}
function notebook(){
 const entries=Object.entries(state.notes).filter(([,v])=>v.trim());
 const highlighted=Object.entries(state.highlights).filter(([,v])=>v);
 return `${header('O que a Palavra deixou em você.','Suas descobertas, registros e passagens guardadas.','MEU CADERNO')}<div class="tabs"><button data-action="notebook-tab" data-tab="notes" class="${notebookTab==='notes'?'active':''}">Anotações (${entries.length})</button><button data-action="notebook-tab" data-tab="highlights" class="${notebookTab==='highlights'?'active':''}">Destaques (${highlighted.length})</button><button data-action="notebook-tab" data-tab="journal" class="${notebookTab==='journal'?'active':''}">Diário devocional</button></div><div class="panel">${notebookTab==='notes'?entries.map(([key,text])=>{let label,action;if(key.startsWith('lesson:man:')){label=men.find(p=>p.id===key.slice(11))?.name||'Homem da Bíblia';action=`data-action="man-profile" data-id="${e(key.slice(11))}"`;}else if(key.startsWith('lesson:')){label=key.startsWith('lesson:pdf:')?pdfStudies.sessions.find(s=>s.id===key.slice(11))?.title||'Sessão dos PDFs':lessons.find(l=>l.id===key.slice(7))?.title||'Estudo';action=key.startsWith('lesson:pdf:')?`data-action="pdf-session" data-id="${e(key.slice(11))}"`:`data-action="lesson" data-id="${e(key.slice(7))}"`;}else{const [b,c,n]=key.split(':').map(Number);label=`${bById(b)?.name||'Livro'} ${c}${n?':'+n:''}`;action=`data-action="reference" data-ref="${e(label)}"`;}return `<section class="note-row"><div><button class="textlink" ${action}>${e(label)} ${icon('arrow',12)}</button><p>${e(text)}</p></div><button class="iconbtn" data-action="delete-note" data-key="${e(key)}" aria-label="Excluir anotação">${icon('trash',14)}</button></section>`;}).join('')||empty('Seu caderno está começando.','Toque em um versículo para anotar, ou registre sua reflexão nas trilhas de estudo.'):notebookTab==='highlights'?highlighted.map(([key])=>{const [b,c,n]=key.split(':').map(Number),book=bById(b),v=book?.chapters[c-1]?.find(v=>v.n===n);return v?`<section class="note-row"><div><button class="textlink" data-action="reference" data-ref="${e(book.name)} ${c}:${n}">${e(book.name)} ${c}:${n} ${icon('arrow',12)}</button><p>${e(v.t)}</p></div><button class="iconbtn" data-action="remove-highlight" data-key="${e(key)}" aria-label="Remover destaque">${icon('bookmark',14)}</button></section>`:'';}).join('')||empty('Guarde as passagens que deseja revisitar.','Abra a Bíblia, selecione um versículo e escolha Destacar.'):Object.entries(state.devNotes).filter(([,v])=>v.trim()).map(([key,text])=>{const [w,d]=key.split(':').map(Number);return `<section class="note-row"><div><button class="textlink" data-action="next-dev" data-week="${w}" data-day="${d}">Semana ${w} · dia ${d} ${icon('arrow',12)}</button><p>${e(text)}</p></div></section>`;}).join('')||empty('Seu diário está à espera.','Escreva uma oração ou aplicação na área de devocionais.')}</div>`;
}
function pwaPanel(){
 const status=getPWAStatus();
 return `<section class="panel pwa-panel" aria-labelledby="pwa-heading"><div class="panel-heading"><h2 id="pwa-heading">Seu livro também é um aplicativo.</h2><span class="tag">PWA</span></div><p class="helper">Instale na tela inicial para abrir direto no celular. Depois de preparar a leitura offline, você pode estudar sem conexão. PDFs externos e sincronização de conta precisam de internet.</p><div class="backup-row"><button class="btn primary" data-action="pwa-install" ${status.installed?'disabled':''}>${icon('download',14)} ${status.installed?'Aplicativo instalado':'Instalar aplicativo'}</button></div><p class="helper" id="pwa-status" role="status">${e(status.message)}</p></section>`;
}
function updatePWAStatus(){
 const status=getPWAStatus();
 if($('#pwa-status'))$('#pwa-status').textContent=status.message;
 const install=$('[data-action="pwa-install"]');
 if(install){install.disabled=status.installed;install.textContent=status.installed?'Aplicativo instalado':'Instalar aplicativo';}
 const download=$('[data-action="offline-download"]');
 if(download){download.disabled=status.downloading;download.textContent=status.downloading?`Baixando ${status.completed}/${status.total}…`:'Preparar leitura offline';}
 if($('#offline-status')&&(status.downloading||status.completed))$('#offline-status').textContent=status.message;
}

function accountPanel(){
 return `<section class="panel account-panel" aria-labelledby="account-heading">
  <h2 id="account-heading">Minha conta</h2>
  <p id="account-status" class="helper" role="status">${e(sync.status.message)}</p>
  <div id="account-controls" class="backup-row">${accountControls()}</div>
 </section>`;
}

function accountControls(){
 const status=sync.status;
 if(!status.configured)return '';
 if(!status.signedIn)return '<button class="btn primary" data-action="account-login">Entrar com e-mail</button>';
 if(status.pending){
  return `<button class="btn" data-action="export-backup">Baixar cópia deste dispositivo</button>
   <button class="btn primary" data-action="account-resolve" data-choice="local" ${status.busy?'disabled':''}>Manter minha edição</button>
   <button class="btn" data-action="account-resolve" data-choice="cloud" ${status.busy?'disabled':''}>Usar edição da conta</button>
   <button class="btn" data-action="account-logout" ${status.busy?'disabled':''}>Sair</button>`;
 }
 const hasGuestRecords=['notes','highlights','read','devDone','devNotes','planDone','lessonDone','answers','sermons'].some(key=>Object.keys(guestState[key]||{}).length);
 return `<button class="btn primary" data-action="account-sync" ${status.busy?'disabled':''}>Sincronizar agora</button>
  ${status.synced&&hasGuestRecords?'<button class="btn" data-action="account-import">Incluir registros do navegador</button>':''}
  <button class="btn" data-action="account-logout" ${status.busy?'disabled':''}>Sair</button>`;
}

function updateAccountStatus(){
 const status=sync.status;
 const label=$('#account-status'),controls=$('#account-controls');
 const time=status.updated?' Última cópia: '+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(status.updated))+'.':'';
 if(label)label.textContent=(status.email?status.email+' · ':'')+status.message+time;
 if(controls){
  const markup=accountControls();
  if(controls.dataset.markup!==markup){controls.innerHTML=markup;controls.dataset.markup=markup;}
 }
}

function showAccountLogin(){
 showModal(`<h2>Entrar na sua conta</h2><p>Receba um link no seu e-mail para entrar sem senha. Abra o link neste aparelho.</p>
  <form id="account-email" class="account-form">
   <label class="field"><span>Seu e-mail</span><input name="email" type="email" autocomplete="email" required></label>
   <p class="helper" role="status"></p>
   <button class="btn primary" type="submit">Enviar link de acesso</button>
  </form>`);
}

async function submitAccount(form){
 if(!sync.status.configured||sync.status.signedIn)return;
 const email=new FormData(form).get('email');
 const button=form.querySelector('[type=submit]');
 const status=form.querySelector('[role=status]');
 button.disabled=true;
 try{
  await sync.sendLink(email);
  if(!form.isConnected)return;
  form.outerHTML=`<p>Confira sua caixa de entrada e abra o link recebido neste aparelho. A conta será aberta e sincronizada automaticamente.</p><p class="helper">Se não receber, confira o spam. O envio gratuito atual atende os membros da organização do aplicativo.</p><button class="btn" type="button" data-action="account-retry">Trocar e-mail ou reenviar</button>`;
 }catch(error){
  status.textContent=error.status===429?'Aguarde antes de solicitar outro link.':'Não foi possível enviar o link. Confira o e-mail. O envio atual é limitado aos membros da organização do aplicativo.';
 }finally{button.disabled=false;}
}
function library(){return `${header('Sua mesa de estudo.','Os quatro materiais que deram origem a esta jornada.','BIBLIOTECA & AJUSTES')}${accountPanel()}${pwaPanel()}<div class="library-grid">${Object.entries(sources).map(([id,s])=>`<article class="library-card"><div class="book-cover">${icon('book',25)}<small>${s.label}</small></div><div><span class="eyebrow">${s.pages} PÁGINAS · PDF PESSOAL</span><h3 style="margin-top:9px">${s.title}</h3><p>${s.desc}</p><div class="controls"><a class="textlink" href="${sourceURL(id)}" target="_blank" rel="noopener">Abrir PDF ${icon('external',12)}</a><button class="textlink" data-action="pdf-source" data-source="${id}">Abrir sessões de estudo ${icon('arrow',12)}</button></div></div></article>`).join('')}</div><section class="panel" style="margin-top:25px"><div class="panel-heading"><h2>Seus registros, com você.</h2><span class="tag">Neste navegador</span></div><p class="helper">Anotações, destaques, diário, progresso e pregações ficam salvos neste dispositivo. Para levar seus dados a outro aparelho, sincronize com sua conta ou exporte um backup; a importação combina registros e preserva os que já existem.</p><div class="backup-row" style="margin-top:18px"><button class="btn primary" data-action="export-backup">${icon('download',14)} Exportar backup</button><label class="btn">${icon('upload',14)} Importar backup<input type="file" id="import-backup" accept="application/json,.json"></label><button class="btn" data-action="offline-download">${icon('cloud',14)} Preparar leitura offline</button></div><p class="helper" id="offline-status" style="margin-top:13px">A Bíblia em português e os estudos ficam disponíveis offline após o primeiro carregamento com o cache ativo. O botão também baixa as 66 edições de consulta. PDFs e léxico externo exigem conexão.</p></section><section class="panel credits"><h3>Fontes, edições e notas de leitura</h3><p><strong>Português:</strong> Bíblia Livre (BLIVRE), © 2018 Diego Santos, Mario Sérgio e Marco Teles. Revisão da tradição de Almeida. Texto completo, 66 livros, 1.189 capítulos e 31.102 versículos. <a href="https://sites.google.com/site/biblialivre/" target="_blank" rel="noopener">Projeto Bíblia Livre</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.</p><p><strong>Hebraico e trechos aramaicos:</strong> Westminster Leningrad Codex (WLC), Westminster Hebrew Institute. <a href="https://tanach.us/Pages/Tanach.xml#License" target="_blank" rel="noopener">Condições de uso do WLC</a>.</p><p><strong>Grego:</strong> Textus Receptus (Stephanus 1550), domínio público. WLC e TR são edições textuais de consulta, não os autógrafos. Podem diferir da base textual e da versificação da tradução portuguesa.</p><p>Dados estruturados obtidos de <a href="https://github.com/midvash/bible-data" target="_blank" rel="noopener">midvash/bible-data</a>. A consulta básica funciona com arquivos incluídos no aplicativo, sem chaves de API. O dicionário é introdutório e abre verbetes de Strong no Blue Letter Bible para aprofundamento.</p><p><strong>Seus PDFs:</strong> permanecem acessíveis pelos links pessoais. O código do aplicativo não inclui os arquivos originais nem marcas pessoais presentes neles. Reflexões devocionais creditadas a Paulo Marcondes; demais autorias não identificadas de modo seguro nas páginas analisadas.</p><p><strong>Revisão editorial:</strong> o devocional fornecido contém repetições e uma referência aparentemente copiada na semana 16. O quiz contém questões ambíguas e gabarito ausente na questão 237. As trilhas incluem notas para distinguir contexto histórico, interpretação confessional e aplicação. O cânon usado no leitor é o protestante; outras tradições cristãs têm cânones diferentes.</p></section>`;}

function render(keepFocus=false){
 const focus=keepFocus?document.activeElement?.id:null,start=focus?document.activeElement.selectionStart:null;
 const labels=navs.find(n=>n[0]===view)||['busca','Busca bíblica'];
 const templates={homens:menView,inicio:home,biblia:bible,estudos:studies,devocionais:devotionals,pregacoes:sermons,dicionario:dictionary,historia:history,quiz:quizView,caderno:notebook,biblioteca:library,busca:search};
 document.documentElement.style.setProperty('--reader-size',Math.max(16,Math.min(30,Number(state.fontSize)||21))+'px');
 document.title=`${labels[1]} · Homem Forjado`;
 const quickNav=[['inicio','Início','home'],['biblia','Bíblia','book'],['estudos','Estudos','layers'],['devocionais','Diário','sun'],['pregacoes','Pregar','feather'],['caderno','Caderno','note']];
 $('#app').innerHTML=`<button class="shade ${menu?'show':''}" data-action="toggle-menu" aria-label="Fechar índice" ${!menu?'tabindex="-1"':''}></button>
 <aside class="sidebar ${menu?'open':''}" id="study-index" aria-label="Índice completo" ${menu?'role="dialog" aria-modal="true"':''} ${menu?'':'inert'}><div class="drawer-heading"><a class="brand" href="#inicio"><span><strong>Homem Forjado</strong><small>Escrituras & vida</small></span></a><button class="iconbtn" data-action="toggle-menu" aria-label="Fechar índice">${icon('close',19)}</button></div><div class="nav-label">SUA JORNADA</div><nav aria-label="Navegação principal">${navs.map(([id,label,ic],i)=>`${i===5?'<div class="nav-label">PARA APROFUNDAR</div>':''}<button class="nav-item ${view===id?'active':''}" data-nav="${id}" ${view===id?'aria-current="page"':''}>${icon(ic,17)}${label}</button>`).join('')}</nav><div class="sidebar-foot"><p class="sidebar-quote">“Lâmpada para os meus pés<br>é tua palavra, e luz para<br>o meu caminho.”<small>SALMOS 119:105 · BLIVRE</small></p><div class="local-pill"><span class="dot"></span>Seu estudo, no seu ritmo.</div></div></aside>
 <header class="desk-header"><a class="brand" href="#inicio"><span class="brand-seal">${icon('book',23)}</span><span><strong>Homem Forjado</strong><small>ESCRITURAS & VIDA</small></span></a><span class="desk-motto">Sabedoria que atravessa o tempo.</span><div class="desk-actions"><form id="global-search" class="top-search"><button aria-label="Buscar na Bíblia" type="submit">${icon('search',16)}</button><label class="sr-only" for="global-query">Buscar passagem ou palavra</label><input id="global-query" placeholder="Passagem ou palavra…" type="search"></form><button class="index-button" data-action="toggle-menu" aria-label="Abrir índice completo" aria-controls="study-index" aria-expanded="${menu}">${icon('menu',16)} Índice</button></div></header>
 <div class="volume-layout"><main class="main"><div class="workspace" data-view="${e(view)}" id="content" tabindex="-1"><div class="page-content">${!storageOK?'<div class="notice">O navegador não permitiu salvar seus registros. Exporte um backup antes de sair.</div>':''}${(templates[view]||home)()}${view!=='inicio'?'<footer class="footer"><span>HOMEM FORJADO · CONHECER, MEDITAR, VIVER.</span><span>Uma página de cada vez.</span></footer>':''}</div></div></main><nav class="book-tabs" aria-label="Marcadores do livro">${quickNav.map(([id,label,ic])=>`<button data-nav="${id}" class="${view===id?'active':''}" ${view===id?'aria-current="page"':''} title="${e(navs.find(n=>n[0]===id)[1])}">${icon(ic,15)}${label}</button>`).join('')}</nav></div>
 <footer class="desk-footer"><span>HOMEM FORJADO · UM ENCONTRO COM A PALAVRA</span><span>Conhecimento que cria raízes. Fé que se torna vida.</span></footer>
 <nav class="mobile-nav" aria-label="Navegação rápida">${[['inicio','Início','home'],['biblia','Bíblia','book'],['estudos','Estudos','layers'],['devocionais','Devocional','sun']].map(([id,label,ic])=>`<button data-nav="${id}" class="${view===id?'active':''}" ${view===id?'aria-current="page"':''}>${icon(ic,19)}${label}</button>`).join('')}<button data-action="toggle-menu" aria-label="Abrir índice completo" aria-controls="study-index" aria-expanded="${menu}">${icon('menu',19)}Mais</button></nav>`;
 if(focus&&$('#'+focus)){const el=$('#'+focus);el.focus({preventScroll:true});if(typeof start==='number')try{el.setSelectionRange(start,start);}catch{}}
 updatePWAStatus();
 renderVersion++;
 if(view==='biblia'&&compare&&!originalCache[current().osis]&&!originalLoading&&!originalError)loadOriginal();
}
function setMenu(open){
 menu=open;render();
 requestAnimationFrame(()=>$(menu?'.sidebar [data-action="toggle-menu"]':'.index-button')?.focus({preventScroll:true}));
}
function navigate(next,params={}){
 if($('#modal').open)$('#modal').close();menu=false;
 const hash=next==='biblia'?`biblia?b=${params.book||state.reading.book}&c=${params.chapter||state.reading.chapter}${params.start?'&s='+params.start+(params.end?'&end='+params.end:''):''}`:next;
 if(location.hash.slice(1)===hash){route();}else location.hash=hash;
}
function route(){
 const [name,qs]=location.hash.slice(1).split('?');view=navs.some(n=>n[0]===name)||name==='busca'?name:'inicio';
 if(view==='biblia'&&qs){const p=new URLSearchParams(qs),b=bById(p.get('b')),c=Number(p.get('c'));if(b&&b.chapters[c-1]){state.reading={book:b.id,chapter:c};selected=Number(p.get('s'))||null;save();}}
 if(view==='homens'){manId=qs?new URLSearchParams(qs).get('personagem'):null;}
 if(view==='estudos'&&qs){const p=new URLSearchParams(qs);if(p.has('pdf')){pdfSessionId=p.get('pdf');studyTab='pdf';lessonId=null;}else if(p.has('colecao')){pdfSessionId=null;pdfSource=p.get('colecao');studyTab='pdf';lessonId=null;}}
 menu=false;originalError='';render();window.scrollTo({top:0});
 if(view==='biblia'&&selected)requestAnimationFrame(()=>$('#verse-'+selected)?.scrollIntoView({block:'center'}));
}
async function loadOriginal(){
 const osis=current().osis;originalLoading=true;
 try{const response=await fetch(`/data/original/${osis}.json`);if(!response.ok)throw Error();originalCache[osis]=await response.json();originalError='';}
 catch{originalError='Não foi possível carregar esta edição. Verifique a conexão e tente novamente.';}
 finally{originalLoading=false;if(view==='biblia'&&current().osis===osis)render();else if(view==='biblia'&&compare)render();}
}
function moveChapter(delta){const b=current();let id=b.id,c=state.reading.chapter+delta;if(c<1){id--;c=bById(id)?.chapters.length;}else if(c>b.chapters.length){id++;c=1;}if(!bById(id))return;selected=null;navigate('biblia',{book:id,chapter:c});}
function showModal(html){$('#modal').innerHTML=`<button class="iconbtn close" data-action="close-modal" aria-label="Fechar">${icon('close',16)}</button>${html}`;$('#modal').showModal();}
function goReference(ref){const parsed=parseReference(ref,books);if(!parsed){toast('Referência não reconhecida. Use livro, capítulo e versículo, como João 3:16.');return;}navigate('biblia',parsed);if(parsed.endChapter)toast(`A leitura começa aqui e continua até ${bById(parsed.book).name} ${parsed.endChapter}:${parsed.end}. Use Próximo para avançar.`);else if(/\d[abc]\b/i.test(ref))toast('O material indica parte de um versículo. O leitor mostra o versículo inteiro para manter o contexto.');}
function doSearch(query){searchQuery=query.trim();const ref=parseReference(searchQuery,books);if(ref){navigate('biblia',ref);return;}if(normalize(searchQuery).length<3){toast('Digite pelo menos 3 caracteres para buscar uma expressão.');return;}searchResults=searchVerses(books,searchQuery);searchPage=0;navigate('busca');}
function download(name,content,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function sermonText(s){return `${s.title}\n${s.reference||''}\n${s.audience||''}\n\n`+sermonFields.map(([key,label])=>`${label.toUpperCase()}\n${s[key]||''}`).join('\n\n');}
function quizCurrent(){return (quizMode==='reviewed'?quiz.filter(q=>q.reviewed):quiz)[quizIndex];}

document.addEventListener('click',async event=>{
 const el=event.target.closest('[data-nav],[data-action]');if(!el||el.disabled)return;
 const d=el.dataset,a=d.action;
 if(d.nav){if(d.nav==='estudos')lessonId=null;navigate(d.nav);return;}
 const b=current(),c=state.reading.chapter,key=selected?vKey(b.id,c,selected):'',v=selected?b.chapters[c-1].find(v=>v.n===selected):null;
 switch(a){
 case 'toggle-menu':setMenu(!menu);break;
 case 'open-guide':openGuide(d.ref,d.chapter==='true');break;
 case 'present-sermon':{
  const sermon=state.sermons.find(item=>item.id===sermonId);
  if(sermon){showModal(presentationHTML(sermon,sermonFields,books));startPresentation($('#modal'));}
  break;
 }
 case 'account-login':showAccountLogin();break;
 case 'account-retry':$('#modal').close();showAccountLogin();break;
 case 'account-logout':await sync.signOut();break;
 case 'account-sync':await sync.synchronize();break;
 case 'account-resolve':await sync.synchronize(d.choice);break;
 case 'account-import':{
  if(!sync.status.signedIn||!sync.status.synced)break;
  const records=mergeGuestRecords(state,guestState);
  state={...state,...records,sermons:[...records.sermons].sort((a,b)=>b.updated.localeCompare(a.updated))};
  save();render();toast('Registros do navegador incluídos na sua conta.');
  break;
 }
 case 'close-modal':$('#modal').close();break;
 case 'reference':goReference(d.ref);break;
 case 'prev-chapter':moveChapter(-1);break;
 case 'next-chapter':moveChapter(1);break;
 case 'font-down':case 'font-up':state.fontSize=Math.max(16,Math.min(30,state.fontSize+(a==='font-up'?1:-1)));save();render();break;
 case 'select-verse':selected=Number(d.verse);render();break;
 case 'unselect':selected=null;render();break;
 case 'highlight':if(key){state.highlights[key]=!state.highlights[key];save();render();}break;
 case 'remove-highlight':delete state.highlights[d.key];save();render();break;
 case 'verse-note':if(v)showModal(`<h2>${e(b.name)} ${c}:${selected}</h2><p>${e(v.t)}</p><label class="field"><span>Minha anotação</span><textarea id="verse-note-text" data-key="${key}" placeholder="O que você observou nesta passagem?">${e(state.notes[key]||'')}</textarea></label><p class="helper" style="margin-top:12px">Salvo neste navegador enquanto você escreve.</p><div class="actions"><button class="btn primary" data-action="close-modal">Concluir</button></div>`);break;
 case 'copy-verse':if(v){try{await navigator.clipboard.writeText(`${v.t}\n${b.name} ${c}:${selected} · Bíblia Livre`);toast('Versículo copiado.');}catch{showModal(`<h2>Copiar versículo</h2><textarea readonly>${e(v.t+'\n'+b.name+' '+c+':'+selected+' · Bíblia Livre')}</textarea><p class="helper">Selecione o texto para copiar.</p>`);}}break;
 case 'verse-sermon':if(v){const s=state.sermons.find(s=>s.id===sermonId)||makeSermon();s.verses+=(s.verses?'\n\n':'')+`${b.name} ${c}:${selected} — ${v.t} (Bíblia Livre)`;s.updated=new Date().toISOString();if(!s.reference)s.reference=`${b.name} ${c}:${selected}`;save();toast('Versículo incluído em “'+s.title+'”.');}break;
 case 'retry-original':originalError='';render();break;
 case 'book-index':showModal(`<h2>Escolha um livro</h2><p class="helper" style="margin-bottom:20px">Antigo e Novo Testamento · cânon protestante</p><div class="book-index">${books.map(b=>`<button data-action="reference" data-ref="${e(b.name)} 1">${e(b.name)}<small>${b.chapters.length} capítulos</small></button>`).join('')}</div>`);break;
 case 'reader-search':navigate('busca');setTimeout(()=>$('#bible-query')?.focus(),30);break;
 case 'search-prev':searchPage--;render();window.scrollTo({top:0});break;
 case 'search-next':searchPage++;render();window.scrollTo({top:0});break;
 case 'study-tab':studyTab=d.tab;lessonId=null;pdfSessionId=null;render();break;
 case 'pdf-source':pdfSessionId=null;pdfSource=d.source;pdfQuery='';studyTab='pdf';lessonId=null;location.hash='estudos?colecao='+encodeURIComponent(pdfSource);break;
 case 'pdf-session':lessonId=null;studyTab='pdf';location.hash='estudos?pdf='+encodeURIComponent(d.id);break;
 case 'man-profile':location.hash='homens?personagem='+encodeURIComponent(d.id);break;
 case 'pdf-answer':state.answers[d.question]=Number(d.option);save();render();break;
 case 'pdf-image':{const f=pdfStudies.figures[d.id];if(f)showModal(`<figure class="pdf-figure pdf-expanded"><img src="${e(f.src)}" width="${f.width}" height="${f.height}" alt="${e(f.alt)}"><figcaption>${e(f.caption)}</figcaption></figure>`);break;}
 case 'lesson':lessonId=d.id;if(view!=='estudos')navigate('estudos');else{render();window.scrollTo({top:0});}break;
 case 'back-lessons':lessonId=null;render();window.scrollTo({top:0});break;
 case 'book-overview':overview(Number(d.book));break;
 case 'dev-tab':devTab=d.tab;render();break;
 case 'show-plan':devTab='plano';navigate('devocionais');break;
 case 'week':weekId=Number(d.week);dayId=1;render();break;
 case 'dev-day':dayId=Number(d.day);render();break;
 case 'next-dev':weekId=Number(d.week);dayId=Number(d.day);devTab='reflexao';navigate('devocionais');break;
 case 'dev-next':if(dayId<7)dayId++;else if(weekId<20){weekId++;dayId=1;}else toast('Você chegou ao fim das 20 semanas. Releia seus registros e retome quando desejar.');render();break;
 case 'plan-prev':planMonth=Math.max(0,planMonth-1);render();break;
 case 'plan-next':planMonth=Math.min(12,planMonth+1);render();break;
 case 'new-sermon':makeSermon();render();break;
 case 'choose-sermon':sermonId=d.id;render();break;
 case 'sermon-read':{const s=state.sermons.find(s=>s.id===sermonId);if(s?.reference)goReference(s.reference);else toast('Preencha a passagem principal para abrir a Bíblia.');break;}
 case 'sermon-template':{const s=state.sermons.find(s=>s.id===sermonId);if(!s)break;for(const [key,,placeholder]of sermonFields)if(!s[key])s[key]=placeholder;s.updated=new Date().toISOString();save();render();toast('Perguntas-guia incluídas nos campos vazios.');break;}
 case 'print-sermon':{const s=state.sermons.find(s=>s.id===sermonId);if(!s)break;$('#print-area').innerHTML=`<h1>${e(s.title)}</h1><p>${e(s.reference)}${s.audience?' · '+e(s.audience):''}</p>${sermonFields.filter(([key])=>s[key]).map(([key,label])=>`<section><h2>${label}</h2><p>${e(s[key])}</p></section>`).join('')}<p class="helper">Preparado em Homem Forjado · ${new Intl.DateTimeFormat('pt-BR').format(new Date())}</p>`;window.print();break;}
 case 'download-sermon':{const s=state.sermons.find(s=>s.id===sermonId);if(s)download((s.title||'pregacao').replace(/[^\p{L}\p{N}-]+/gu,'-')+'.txt',sermonText(s));break;}
 case 'delete-sermon':showModal(`<h2>Excluir esta mensagem?</h2><p>Esta ação remove o esboço deste navegador. Você pode baixar o texto antes de excluir.</p><div class="actions"><button class="btn" data-action="close-modal">Manter mensagem</button><button class="btn danger" data-action="confirm-delete-sermon">Excluir mensagem</button></div>`);break;
 case 'confirm-delete-sermon':state.sermons=state.sermons.filter(s=>s.id!==sermonId);sermonId=state.sermons[0]?.id||null;save();$('#modal').close();render();break;
 case 'quiz-mode':quizMode=d.mode;quizIndex=0;quizChoice=null;quizReveal=false;render();break;
 case 'quiz-option':quizChoice=Number(d.option);render();break;
 case 'quiz-reveal':{const q=quizCurrent();if(quizChoice===null)break;quizReveal=true;if(q.reviewed){state.answers[q.id]=quizChoice;save();}render();break;}
 case 'quiz-next':case 'quiz-prev':quizIndex+=a==='quiz-next'?1:-1;quizChoice=null;quizReveal=false;render();break;
 case 'notebook-tab':notebookTab=d.tab;render();break;
 case 'delete-note':showModal(`<h2>Excluir esta anotação?</h2><p>O texto será removido deste navegador.</p><div class="actions"><button class="btn" data-action="close-modal">Manter</button><button class="btn danger" data-action="confirm-delete-note" data-key="${e(d.key)}">Excluir</button></div>`);break;
 case 'confirm-delete-note':delete state.notes[d.key];save();$('#modal').close();render();break;
 case 'export-backup':download('homem-forjado-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'homem-forjado-v2',exportedAt:new Date().toISOString(),state},null,2),'application/json');toast('Backup exportado com seus registros.');break;
 case 'offline-download':await prepareOffline();break;
 case 'pwa-install':if(!await installPWA()&&!getPWAStatus().installed)showModal(`<h2>Instalar Homem Forjado</h2><p>${e(installationInstructions())}</p>`);break;
 }
});
document.addEventListener('keydown',event=>{
 if(menu&&event.key==='Escape'){event.preventDefault();setMenu(false);return;}
 if(menu&&event.key==='Tab'){
  const targets=Array.from(document.querySelectorAll('.sidebar a[href],.sidebar button:not([disabled])'));
  const first=targets[0],last=targets.at(-1);
  if(event.shiftKey&&event.target===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&event.target===last){event.preventDefault();first?.focus();}
 }
 if((event.key==='Enter'||event.key===' ')&&event.target.matches('.verse')){event.preventDefault();event.target.click();}
});
document.addEventListener('submit',event=>{
 const form=event.target;
 if(form.id==='global-search'||form.id==='bible-search-form'){
  event.preventDefault();doSearch(form.querySelector('input').value);
 }else if(form.id==='account-email'||form.id==='account-code'){
  event.preventDefault();submitAccount(form);
 }
});
document.addEventListener('focusout',()=>sync.schedule());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync.schedule();});
window.addEventListener('online',()=>sync.schedule());
setInterval(()=>{if(!document.hidden)sync.synchronize();},45000);
document.addEventListener('input',event=>{
 const el=event.target,id=el.id;
 if(['dictionary-filter','study-filter','book-filter','pdf-study-filter','men-search'].includes(id)){if(id==='men-search')menQuery=el.value;if(id==='pdf-study-filter')pdfQuery=el.value;if(id==='dictionary-filter')dictFilter=el.value;if(id==='study-filter')studyFilter=el.value;if(id==='book-filter')bookFilter=el.value;clearTimeout(inputTimer);inputTimer=setTimeout(()=>render(true),180);return;}
 if(id==='chapter-note')state.notes[`${state.reading.book}:${state.reading.chapter}`]=el.value;
 else if(id==='verse-note-text')state.notes[el.dataset.key]=el.value;
 else if(id==='lesson-note')state.notes['lesson:'+el.dataset.id]=el.value;
 else if(id==='dev-note')state.devNotes[el.dataset.key]=el.value;
 else if(el.dataset.sermonField){const s=state.sermons.find(s=>s.id===sermonId);if(!s)return;s[el.dataset.sermonField]=el.value;s.updated=new Date().toISOString();if(el.dataset.sermonField==='title')document.querySelectorAll('[data-title-for]').forEach(n=>{if(n.dataset.titleFor===sermonId)n.textContent=el.value||'Sem título';});}
 else return;
 const saved=save();if($('#sermon-status'))$('#sermon-status').textContent=saved?'✓ Salvo neste navegador':'Falha ao salvar — exporte um backup';if($('#note-status'))$('#note-status').textContent=saved?'Salvo neste navegador.':'Falha ao salvar — exporte um backup';
});
document.addEventListener('change',async event=>{
 const el=event.target;
 if(el.id==='book-select'){selected=null;navigate('biblia',{book:Number(el.value),chapter:1});}
 if(el.id==='chapter-select'){selected=null;navigate('biblia',{chapter:Number(el.value)});}
 if(el.id==='compare-select'){compare=el.value==='original';originalError='';render();}
 if(el.id==='mark-read'){state.read[`${state.reading.book}:${state.reading.chapter}`]=el.checked;save();}
 if(el.id==='dev-done'){state.devDone[el.dataset.key]=el.checked;save();render();}
 if(el.id==='lesson-done'){state.lessonDone[el.dataset.id]=el.checked;save();}
 if(el.dataset.planDay!==undefined){state.planDone[el.dataset.planDay]=el.checked;save();render();}
 if(el.id==='men-group'){menGroup=el.value;render();}
 if(el.id==='dictionary-lang'){dictLang=el.value;render();}
 if(el.id==='import-backup'){
  const file=el.files[0];if(!file)return;
  try{if(file.size>10*1024*1024)throw Error('O backup excede o tamanho permitido de 10 MB.');const imported=validateBackup(JSON.parse(await file.text()));
   for(const k of ['notes','highlights','read','devDone','devNotes','planDone','lessonDone','answers'])if(imported[k])state[k]={...imported[k],...state[k]};
   const existing=new Map(state.sermons.map(s=>[s.id,s]));for(const s of imported.sermons||[])if(!existing.has(s.id))state.sermons.push(s);
   if(save()){render();toast('Backup combinado. Registros já existentes foram preservados.');}
  }catch(error){toast(error.message||'Não foi possível ler este arquivo.');}
 }
});
async function prepareOffline(){
 try{await prepareAllOffline();toast('Leitura offline preparada neste dispositivo.');}
 catch(error){toast(error.message||'Não foi possível concluir o download offline.');}
}
async function boot(){
 try{
  const names=['bible','devotionals','quiz','lessons','summaries','dictionary','timeline','pdf-studies','men-of-bible'];
  [books,weeks,quiz,lessons,summaries,terms,timeline,pdfStudies,men]=await Promise.all(names.map(async name=>{const r=await fetch(`/data/${name}.json`);if(!r.ok)throw Error('Arquivo indisponível: '+name);return r.json();}));
  if(books.length!==66||!books[42]?.chapters[0]?.length)throw Error('O texto bíblico está incompleto.');
  if(!bById(state.reading?.book)||!bById(state.reading.book).chapters[state.reading.chapter-1])state.reading={book:43,chapter:1};
  plan=readingPlan(books);window.addEventListener('hashchange',route);route();
  sync.initialize();

 }catch(error){$('#app').innerHTML=`<div class="initial"><img src="/icon.svg" alt="" width="60" height="60"><h1>Vamos retomar a leitura.</h1><p>Não foi possível carregar os arquivos de estudo. Confira a conexão e recarregue a página.</p><p class="helper">${e(error.message)}</p><a class="btn primary" href="/">Tentar novamente</a></div>`;}
}
setupPWA(updatePWAStatus);
boot();
