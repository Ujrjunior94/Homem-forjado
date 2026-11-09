const sessionKey = 'hf-sync-session-v1';
const accountPrefix = 'hf-sync-account-v1:';
const maps = ['notes', 'highlights', 'read', 'devDone', 'devNotes', 'planDone', 'lessonDone', 'answers'];
const sermonFields = ['id', 'title', 'reference', 'audience', 'central', 'context', 'intro', 'point1', 'point2', 'point3', 'application', 'conclusion', 'verses', 'updated'];

function orderedEntries(object) {
  return Object.entries(object).sort(([left], [right]) => left.localeCompare(right));
}

export function snapshot(state = {}) {
  const backup = {};
  for (const group of maps) {
    const entries = orderedEntries(state[group] || {}).filter(([, value]) => {
      if (group === 'notes' || group === 'devNotes') return typeof value === 'string';
      if (group === 'answers') return Number.isInteger(value);
      return typeof value === 'boolean';
    });
    backup[group] = Object.fromEntries(entries);
  }
  const entries = Array.isArray(state.sermons) ? state.sermons : [];
  backup.sermons = entries.filter(item => typeof item?.id === 'string' && typeof item.title === 'string')
    .map(item => Object.fromEntries(sermonFields.map(key => [key, typeof item[key] === 'string' ? item[key] : ''])))
    .sort((left, right) => left.id.localeCompare(right.id));
  return backup;
}

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function mergeBackups(base, local, remote, choice) {
  const merged = {};
  let conflicts = 0;

  function mergeRecords(previous, device, cloud) {
    const keys = new Set([...Object.keys(previous), ...Object.keys(device), ...Object.keys(cloud)]);
    const records = [];
    for (const key of keys) {
      const oldValue = Object.hasOwn(previous, key) ? previous[key] : undefined;
      const localValue = Object.hasOwn(device, key) ? device[key] : undefined;
      const remoteValue = Object.hasOwn(cloud, key) ? cloud[key] : undefined;
      let value;
      if (same(localValue, remoteValue) || same(remoteValue, oldValue)) value = localValue;
      else if (same(localValue, oldValue)) value = remoteValue;
      else {
        conflicts++;
        value = choice === 'cloud' ? remoteValue : localValue;
      }
      if (value !== undefined) records.push([key, value]);
    }
    return Object.fromEntries(records);
  }

  for (const key of maps) merged[key] = mergeRecords(base[key], local[key], remote[key]);
  const byId = items => Object.fromEntries(items.map(item => [item.id, item]));
  merged.sermons = Object.values(mergeRecords(byId(base.sermons), byId(local.sermons), byId(remote.sermons)));
  return { backup: snapshot(merged), conflicts };
}

export function mergeGuestRecords(account, guest) {
  const combined = snapshot(account);
  const incoming = snapshot(guest);
  for (const group of maps) combined[group] = { ...incoming[group], ...combined[group] };
  const byId = new Map(combined.sermons.map(sermon => [sermon.id, sermon]));
  for (const sermon of incoming.sermons) {
    if (!byId.has(sermon.id)) combined.sermons.push(sermon);
    else if (!same(byId.get(sermon.id), sermon)) {
      const copyId = 'import-' + sermon.id + '-' + (sermon.updated || 'original');
      if (!byId.has(copyId)) combined.sermons.push({ ...sermon, id: copyId, title: sermon.title + ' (cópia do navegador)' });
    }
  }
  for (const group of ['notes', 'devNotes']) {
    for (const [key, value] of Object.entries(incoming[group])) {
      if (!value || !Object.hasOwn(account[group] || {}, key) || same(value, account[group][key])) continue;
      const original = account[group][key];
      if (!original) combined[group][key] = value;
      else if (!original.includes('\n\nCópia do navegador\n' + value)) combined[group][key] = original + '\n\nCópia do navegador\n' + value;
    }
  }
  return snapshot(combined);
}

// Consume the implicit return before rendering routes or retaining tokens in browser history.
export function consumeAuthReturn(location, history) {
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has('access_token') && !params.has('error')) return null;
  const returned = {access_token:params.get('access_token'),refresh_token:params.get('refresh_token'),expires_in:Number(params.get('expires_in')) || 3600,error:params.has('error')};
  history.replaceState(null, '', location.pathname + location.search + '#biblioteca');
  return returned;
}

export function createSync({ getState, apply, canApply, notify }) {
  const authReturn = typeof window !== 'undefined' && window.location ? consumeAuthReturn(window.location, window.history) : null;
  let config = null;
  let session = null;
  let releaseAccount = null;
  let base = snapshot();
  let pending = null;
  let timeout;
  let busy = false;
  let synced = false;
  let updated = '';
  let message = 'Consultando a disponibilidade da sincronização…';

  function status(text) {
    message = text;
    notify();
  }

  function saveSession(value) {
    if (!value?.user?.id || !value.access_token || !value.refresh_token) throw Error('Sessão inválida.');
    session = { ...value, expires_at: Math.floor(Date.now() / 1000) + Number(value.expires_in || 3600) };
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ origin: config.url, session })); } catch {}
  }

  async function request(path, options = {}) {
    const headers = { apikey: config.key };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.token) headers.Authorization = 'Bearer ' + options.token;
    const response = await fetch(config.url + path, {
      method: options.body === undefined ? 'GET' : 'POST',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) {
      const error = Error('Solicitação recusada.');
      error.status = response.status;
      throw error;
    }
    return response.json().catch(() => null);
  }

  async function accessToken() {
    if (session.expires_at > Date.now() / 1000 + 60) return session.access_token;
    const refreshed = await request('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } });
    if (refreshed?.user?.id !== session.user.id) throw Error('Conta inesperada.');
    saveSession(refreshed);
    return session.access_token;
  }

  function persist(state = getState(), nextBase = base) {
    if (!session) return false;
    try {
      localStorage.setItem(accountPrefix + session.user.id, JSON.stringify({ state, base: nextBase }));
      return true;
    } catch {
      status('O navegador não conseguiu guardar a cópia local. Exporte seus registros.');
      return false;
    }
  }

  function clearSession() {
    try { sessionStorage.removeItem(sessionKey); } catch {}
    session = null;
  }

  async function activate() {
    const lockName = accountPrefix + session.user.id;
    if (!navigator.locks) {
      clearSession();
      status('Este navegador precisa ser atualizado para sincronizar com segurança.');
      return false;
    }
    const acquired = await new Promise((resolve, reject) => {
      navigator.locks.request(lockName, { ifAvailable: true }, lock => {
        if (!lock) {
          resolve(false);
          return;
        }
        return new Promise(release => {
          releaseAccount = release;
          resolve(true);
        });
      }).catch(reject);
    });
    if (!acquired) {
      clearSession();
      status('Esta conta já está aberta em outra aba. Feche a outra aba antes de entrar aqui.');
      return false;
    }
    let cached;
    try { cached = JSON.parse(localStorage.getItem(accountPrefix + session.user.id) || 'null'); } catch {}
    base = snapshot(cached?.base);
    synced = false;
    apply(cached?.state || snapshot(), { switchAccount: true });
    status('Buscando os registros da conta…');
    return true;
  }

  async function synchronize(choice) {
    if (!session || !releaseAccount || busy) return;
    if (pending && !choice) return;
    if (!navigator.onLine) {
      status('Sem conexão. Suas alterações aguardam neste navegador.');
      return;
    }
    busy = true;
    try {
      const token = await accessToken();
      for (let attempt = 0; attempt < 3; attempt++) {
        const rows = await request('/rest/v1/hf_study_backups?select=revision,backup,updated_at', { token });
        if (!Array.isArray(rows)) throw Error('Resposta inválida.');
        const row = rows[0];
        const remote = snapshot(row?.backup);
        const local = snapshot(getState());
        // A choice only resolves the exact versions shown to the user.
        const resolution = pending?.revision === (row?.revision || 0) && same(pending?.local, local) ? choice : undefined;
        const result = mergeBackups(base, local, remote, resolution);
        if (result.conflicts && !resolution) {
          pending = { revision: row?.revision || 0, local, count: result.conflicts };
          status('Há edições diferentes do mesmo registro. Escolha qual versão guardar.');
          return;
        }
        const changedLocally = !same(local, result.backup);
        if (changedLocally && !canApply()) {
          status('Há registros novos na conta. Saia do campo de edição para atualizar.');
          return;
        }
        // Keep later keystrokes made during a request. The next pass merges them with the saved result.
        const needsWrite = !same(result.backup, remote);
        if (needsWrite) {
          const revision = await request('/rest/v1/rpc/hf_save_study_backup', {
            token, body: { expected_revision: row?.revision || 0, next_backup: result.backup }
          });
          if (revision === null) continue;
          if (!Number.isInteger(revision)) throw Error('A gravação não foi confirmada.');
        }
        const latest = snapshot(getState());
        if (!same(latest, local) || changedLocally && !canApply()) {
          // Acknowledge what this device actually submitted. The server may also
          // have merged changes the local editor has not displayed yet.
          if (needsWrite && persist(getState(), local)) base = local;
          pending = null;
          schedule();
          return;
        }
        let nextState = getState();
        if (changedLocally) {
          const records = structuredClone(result.backup);
          records.sermons.sort((left, right) => right.updated.localeCompare(left.updated));
          nextState = { ...nextState, ...records };
        }
        if (!persist(nextState, result.backup)) return;
        base = result.backup;
        pending = null;
        synced = true;
        updated = needsWrite ? new Date().toISOString() : (row?.updated_at || '');
        if (changedLocally) apply(nextState, {});
        status('Registros sincronizados.');
        return;
      }
      status('Outro dispositivo está salvando. A sincronização será tentada novamente.');
      schedule();
    } catch (error) {
      status(error.status === 401 ? 'Sua sessão expirou. Saia e entre novamente para sincronizar.' : 'Sincronização indisponível. A cópia deste navegador continua disponível.');
    } finally {
      busy = false;
      notify();
    }
  }

  function schedule() {
    clearTimeout(timeout);
    if (session && releaseAccount) timeout = setTimeout(() => synchronize(), 1500);
  }

  async function initialize() {
    try {
      const response = await fetch('/sync-config.json', { cache: 'no-store' });
      const settings = await response.json();
      if (settings.authReady === false) {
        status('Banco conectado. O acesso à conta aguarda a configuração do e-mail de entrada. Seus registros continuam salvos neste navegador.');
        return;
      }
      if (/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(settings.url || '') && /^sb_publishable_[\w-]+$/.test(settings.key || '')) config = settings;
    } catch {}
    if (!config) {
      status('A conta será habilitada quando o banco do Homem Forjado estiver conectado. Seus registros ficam neste navegador.');
      return;
    }
    status('Entre pelo link enviado ao seu e-mail.');
    if (authReturn) {
      try {
        if (authReturn.error || !authReturn.access_token || !authReturn.refresh_token) throw Error('Link inválido.');
        const user = await request('/auth/v1/user', {token:authReturn.access_token});
        saveSession({...authReturn,user});
        if (await activate()) await synchronize();
      } catch {
        clearSession();
        status('Não foi possível validar este link. Solicite um novo acesso por e-mail.');
      }
      return;
    }
    try {
      const stored = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
      if (stored?.origin === config.url && stored.session?.user?.id && stored.session.access_token && stored.session.refresh_token) session = stored.session;
    } catch {}
    if (session) {
      try {
        if (await activate()) schedule();
      } catch {
        clearSession();
        status('Entre novamente para abrir sua conta neste navegador.');
      }
    }
  }

  return {
    initialize,
    get status() { return { configured: Boolean(config), email: releaseAccount ? session?.user.email : '', signedIn: Boolean(session && releaseAccount), busy, message, updated, pending: pending?.count, synced }; },
    save() { const saved = persist(); if (saved) schedule(); return saved; },
    async sendLink(email) {
      await request('/auth/v1/otp', { body: { email, create_user: true } });
    },
    async verifyCode(email, token) {
      const verified = await request('/auth/v1/verify', { body: { email, token, type: 'email' } });
      saveSession(verified);
      return activate();
    },
    async signOut() {
      if (busy) return;
      clearTimeout(timeout);
      const token = session?.access_token;
      clearSession();
      releaseAccount?.();
      releaseAccount = null;
      if (token) request('/auth/v1/logout?scope=local', { token, body: {} }).catch(() => {});
      pending = null;
      synced = false;
      updated = '';
      apply(null, { switchAccount: true });
      status('Você saiu da conta neste navegador.');
    },
    synchronize,
    schedule
  };
}
