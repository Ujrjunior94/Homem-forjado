import test from 'node:test';
import assert from 'node:assert/strict';
import { createSync, consumeAuthReturn, mergeBackups, mergeGuestRecords, snapshot } from '../src/sync.js';

test('different edits and deletions merge, while conflicting text requires a choice', () => {
  const base = snapshot({ notes: { a: 'Inicial', b: 'Apagar' } });
  const local = snapshot({ notes: { a: 'Edição local' } });
  const remote = snapshot({ notes: { a: 'Inicial', b: 'Apagar', c: 'Outro aparelho' } });
  assert.deepEqual(mergeBackups(base, local, remote).backup.notes, { a: 'Edição local', c: 'Outro aparelho' });
  const conflicting = snapshot({ notes: { a: 'Edição remota', b: 'Apagar' } });
  assert.equal(mergeBackups(base, local, conflicting).conflicts, 1);
  assert.equal(mergeBackups(base, local, conflicting, 'cloud').backup.notes.a, 'Edição remota');
  const imported = mergeGuestRecords(local, { notes: { a: 'Rascunho antigo' } });
  assert.equal(imported.notes.a, 'Edição local\n\nCópia do navegador\nRascunho antigo');
  assert.deepEqual(mergeGuestRecords(imported, { notes: { a: 'Rascunho antigo' } }), imported);
});

test('sync retries a concurrent write and preserves a keystroke made during the save', async () => {
  const storage = () => {
    const items = new Map();
    return {
      setItem: (key, value) => items.set(key, value),
      getItem: key => items.get(key) ?? null,
      removeItem: key => items.delete(key)
    };
  };
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true, locks: { request: async (_name, _options, callback) => callback({}) } }
  });

  let cloud = { revision: 1, backup: snapshot({ notes: { cloud: 'Outro aparelho' } }) };
  let current = snapshot({ notes: { guest: 'Registro particular do navegador' } });
  let injectedRace = false;
  let injectedTyping = false;
  let sync;
  globalThis.fetch = async (url, options) => {
    if (url === '/sync-config.json') return Response.json({ url: 'https://fixture.supabase.co', key: 'sb_publishable_fixture' });
    const { pathname } = new URL(url);
    if (pathname === '/auth/v1/verify') {
      return Response.json({ user: { id: 'user-a', email: 'a@example.invalid' }, access_token: 'fixture', refresh_token: 'fixture', expires_in: 3600 });
    }
    if (pathname === '/auth/v1/logout') return Response.json({});
    assert.equal(options.headers.Authorization, 'Bearer fixture');
    if (pathname === '/rest/v1/hf_study_backups') return Response.json([cloud]);
    assert.equal(pathname, '/rest/v1/rpc/hf_save_study_backup');
    const request = JSON.parse(options.body);
    if (!injectedRace) {
      injectedRace = true;
      cloud = { revision: cloud.revision + 1, backup: snapshot({ notes: { ...cloud.backup.notes, remote: 'Novo em outro dispositivo' } }) };
    }
    if (cloud.revision !== request.expected_revision) return Response.json(null);
    cloud = { revision: cloud.revision + 1, backup: request.next_backup };
    if (!injectedTyping) {
      injectedTyping = true;
      current.notes.draft = 'Digitação posterior';
      sync.save();
    }
    return Response.json(cloud.revision);
  };

  sync = createSync({ getState: () => current, apply: next => { current = next || snapshot(); }, canApply: () => true, notify: () => {} });
  await sync.initialize();
  await sync.verifyCode('a@example.invalid', '123456');
  try {
    await sync.synchronize();
    assert.deepEqual(current.notes, { cloud: 'Outro aparelho' });
    current.notes.draft = 'Primeiro rascunho';
    sync.save();
    await sync.synchronize();
    await sync.synchronize();
    assert.equal(sync.status.pending, undefined);
    assert.deepEqual(cloud.backup.notes, {
      cloud: 'Outro aparelho',
      draft: 'Digitação posterior',
      remote: 'Novo em outro dispositivo'
    });
  } finally {
    await sync.signOut();
  }
});


test('authentication return is removed from history before validating the session', () => {
 let target;
 const history={replaceState:(state,title,url)=>target=url};
 assert.equal(consumeAuthReturn({hash:'#biblia?b=43',pathname:'/',search:''},history),null);
 assert.equal(target,undefined);
 const value=consumeAuthReturn({hash:'#access_token=test-access&refresh_token=test-refresh&expires_in=3600',pathname:'/',search:''},history);
 assert.equal(target,'/#biblioteca');assert.equal(value.access_token,'test-access');assert.equal(value.refresh_token,'test-refresh');
 assert.equal(consumeAuthReturn({hash:'#error=access_denied',pathname:'/',search:''},history).error,true);
 assert.equal(target,'/#biblioteca');
});

test('magic link validates the user before opening and synchronizing an account', async () => {
 const previous={window:globalThis.window,fetch:globalThis.fetch};
 let cleaned=false,current=snapshot(),cloud;
 globalThis.sessionStorage.removeItem('hf-sync-session-v1');
 globalThis.window={location:{hash:'#access_token=link-fixture&refresh_token=refresh-fixture&expires_in=3600',pathname:'/',search:''},history:{replaceState:()=>{cleaned=true;}}};
 globalThis.fetch=async(url,options)=>{
  assert.ok(cleaned);
  if(url==='/sync-config.json')return Response.json({url:'https://fixture.supabase.co',key:'sb_publishable_fixture',authReady:true});
  const path=new URL(url).pathname;
  assert.equal(options.headers.Authorization,'Bearer link-fixture');
  if(path==='/auth/v1/user')return Response.json({id:'magic-user',email:'fixture@example.invalid'});
  if(path==='/auth/v1/logout')return Response.json({});
  if(path==='/rest/v1/hf_study_backups')return Response.json(cloud?[cloud]:[]);
  assert.equal(path,'/rest/v1/rpc/hf_save_study_backup');
  cloud={revision:1,backup:JSON.parse(options.body).next_backup};return Response.json(1);
 };
 const sync=createSync({getState:()=>current,apply:next=>current=next||snapshot(),canApply:()=>true,notify:()=>{}});
 try{await sync.initialize();assert.ok(sync.status.signedIn);assert.ok(sync.status.synced);assert.equal(sync.status.email,'fixture@example.invalid');}
 finally{await sync.signOut();globalThis.window=previous.window;globalThis.fetch=previous.fetch;}
});
