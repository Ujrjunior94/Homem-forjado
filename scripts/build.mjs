import {mkdir, readFile, writeFile, cp, rm} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
await rm('dist', {recursive:true, force:true});
await mkdir('dist/data/original', {recursive:true});
await cp('src', 'dist', {recursive:true});
const url = process.env.HF_SUPABASE_URL?.trim() || '';
const key = process.env.HF_SUPABASE_PUBLISHABLE_KEY?.trim() || '';
if ((url || key) && (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !/^sb_publishable_[\w-]+$/.test(key))) {
  throw new Error('Configure HF_SUPABASE_URL e HF_SUPABASE_PUBLISHABLE_KEY com a URL e a chave pública do projeto.');
}
await writeFile('dist/sync-config.json', JSON.stringify(url ? {url,key} : {}));
await writeFile('dist/data/bible.json', gunzipSync(await readFile('assets/bible.json.gz')));
const originals=JSON.parse(gunzipSync(await readFile('assets/originals.json.gz')));
for (const [osis, data] of Object.entries(originals)) await writeFile(`dist/data/original/${osis}.json`, JSON.stringify(data));
console.log('Built: 66 Bible books, 66 original-language books, static application.');
