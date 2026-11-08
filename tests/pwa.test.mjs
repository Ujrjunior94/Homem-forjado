import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';

test('PWA assets are complete, versioned and include all 66 original texts',async()=>{
 const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.id,'/');
 for(const icon of [...manifest.icons,{src:'/icons/apple-touch-icon.png',sizes:'180x180'}]){
  const png=await readFile('dist'+icon.src);const [width,height]=icon.sizes.split('x').map(Number);
  assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
 }
 const worker=await readFile('dist/sw.js','utf8');assert.ok(!worker.includes('__HF_'));
 const core=JSON.parse(worker.match(/const CORE_FILES = (.+);/)[1]);
 const originals=JSON.parse(worker.match(/const ORIGINAL_FILES = (.+);/)[1]);
 assert.equal(originals.length,66);assert.ok(core.includes('/pwa.js'));assert.ok(core.includes('/data/bible.json'));
 for(const file of [...core,...originals])assert.ok((await stat('dist'+file)).isFile(),file);
});

test('worker activates an update only after an explicit request',async()=>{
 const handlers={};let skipped=0;
 const context={self:{addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>{skipped++;return Promise.resolve();}}};
 vm.runInNewContext(await readFile('dist/sw.js','utf8'),context);
 assert.equal(skipped,0);
 handlers.message({data:{type:'UNRELATED'}});assert.equal(skipped,0);
 let done;handlers.message({data:{type:'ACTIVATE_UPDATE'},waitUntil:promise=>done=promise});await done;
 assert.equal(skipped,1);
});

test('installed shell and downloaded original texts remain readable when the network is offline',async()=>{
 const handlers={},stores=new Map();let online=true,claimed=false;
 const origin='https://homem-forjado.test';
 const key=request=>new URL(typeof request==='string'?request:request.url,origin).href;
 const network=async request=>{if(!online)throw Error('Offline');const pathname=new URL(key(request)).pathname;return new Response(await readFile('dist'+pathname),{status:200});};
 const cacheAPI={keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),open:async name=>{
  if(!stores.has(name))stores.set(name,new Map());const records=stores.get(name);
  return {match:async request=>records.get(key(request))?.clone(),put:async(request,response)=>records.set(key(request),response.clone()),keys:async()=>[...records.keys()].map(url=>new Request(url)),addAll:async requests=>{const responses=await Promise.all(requests.map(network));requests.forEach((request,i)=>records.set(key(request),responses[i]));}};
 }};
 class LocalRequest extends Request{constructor(path,options){super(new URL(path,origin),options);}}
 vm.runInNewContext(await readFile('dist/sw.js','utf8'),{self:{location:{origin},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{claimed=true;}}},caches:cacheAPI,fetch:network,Request:LocalRequest,Response,URL,AbortSignal});
 let done;handlers.install({waitUntil:promise=>done=promise});await done;
 handlers.activate({waitUntil:promise=>done=promise});await done;assert.ok(claimed);
 const messages=[];handlers.message({data:{type:'DOWNLOAD_ORIGINALS'},ports:[{postMessage:message=>messages.push(message),close(){}}],waitUntil:promise=>done=promise});await done;
 assert.equal(messages.at(-1).type,'COMPLETE');assert.equal(messages.filter(message=>message.type==='PROGRESS').at(-1).completed,66);
 online=false;
 for(const path of ['/','/app.js','/pwa.js','/data/bible.json','/data/devotionals.json','/data/original/John.json']){
  let response;handlers.fetch({request:{url:origin+path,method:'GET',mode:path==='/'?'navigate':'cors'},respondWith:promise=>response=promise});
  assert.equal((await response).status,200,path);
 }
 let intercepted=false;handlers.fetch({request:{url:origin+'/auth/v1/otp',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
