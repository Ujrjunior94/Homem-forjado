import {mkdir, readFile, writeFile, cp, rm, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
await rm('dist', {recursive:true, force:true});
await mkdir('dist/data/original', {recursive:true});
await cp('src', 'dist', {recursive:true});
const url = process.env.HF_SUPABASE_URL?.trim() || '';
const key = process.env.HF_SUPABASE_PUBLISHABLE_KEY?.trim() || '';
if ((url || key) && (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !/^sb_publishable_[\w-]+$/.test(key))) {
  throw new Error('Configure HF_SUPABASE_URL e HF_SUPABASE_PUBLISHABLE_KEY com a URL e a chave pública do projeto.');
}
await writeFile('dist/sync-config.json', JSON.stringify(url ? {url,key,authReady:process.env.HF_SUPABASE_AUTH_READY === 'true'} : {}));
await writeFile('dist/data/bible.json', gunzipSync(await readFile('assets/bible.json.gz')));
for(const edition of ['arc1911','bpm']) await writeFile(`dist/data/bible-${edition}.json`,gunzipSync(await readFile(`assets/bible-${edition}.json.gz`)));
const originals=JSON.parse(gunzipSync(await readFile('assets/originals.json.gz')));
for (const [osis, data] of Object.entries(originals)) await writeFile(`dist/data/original/${osis}.json`, JSON.stringify(data));
async function listFiles(directory) {
  const entries = await readdir(directory, {withFileTypes:true});
  const files = await Promise.all(entries.map(entry => entry.isDirectory() ? listFiles(`${directory}/${entry.name}`) : `${directory}/${entry.name}`));
  return files.flat();
}
const coreFiles = (await listFiles('dist')).filter(file => file !== 'dist/sw.js' && !file.startsWith('dist/data/original/')).sort();
const hash = createHash('sha256');
for (const file of coreFiles) hash.update(file).update(await readFile(file));
hash.update(await readFile('src/sw.js'));
const revision = hash.digest('hex').slice(0,16);
const originalRevision = createHash('sha256').update(await readFile('assets/originals.json.gz')).digest('hex').slice(0,16);
const worker = (await readFile('src/sw.js','utf8'))
  .replaceAll('__HF_REVISION__',revision)
  .replaceAll('__HF_ORIGINAL_REVISION__',originalRevision)
  .replace('__HF_CORE_FILES__',JSON.stringify(coreFiles.map(file => file.slice(4))))
  .replace('__HF_ORIGINAL_FILES__',JSON.stringify(Object.keys(originals).sort().map(osis => `/data/original/${osis}.json`)));
await writeFile('dist/sw.js',worker);
console.log('Built: 66 Bible books, 66 original-language books, static application.');
