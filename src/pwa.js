let registration;
let registerPromise;
let installPrompt;
let refreshRequested = false;
let downloadPromise;
let notify = () => {};
const status = {
  supported: 'serviceWorker' in navigator && 'caches' in window,
  installed: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  ready: false,
  updateAvailable: false,
  downloading: false,
  completed: 0,
  total: 66,
  message: 'Preparando os recursos offline…'
};

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  notify();
});
window.addEventListener('appinstalled', () => {
  status.installed = true;
  installPrompt = null;
  notify();
});

export function getPWAStatus() {
  return { ...status, canInstall: Boolean(installPrompt) };
}

export function installationInstructions() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.';
  }
  return 'Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial. No computador, use o botão de instalação na barra de endereço, quando disponível.';
}

export async function installPWA() {
  if (!installPrompt) return false;
  const prompt = installPrompt;
  installPrompt = null;
  await prompt.prompt();
  await prompt.userChoice;
  notify();
  return true;
}

function showUpdate() {
  status.updateAvailable = Boolean(registration?.waiting);
  const banner = document.getElementById('pwa-update');
  if (banner) banner.hidden = !status.updateAvailable;
  notify();
}

export function setupPWA(onStatus) {
  notify = onStatus;
  const button = document.getElementById('pwa-update-button');
  button?.addEventListener('click', () => {
    if (!registration?.waiting) return;
    refreshRequested = true;
    button.disabled = true;
    button.textContent = 'Atualizando…';
    registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  });
  if (!status.supported) {
    status.message = 'Este navegador não oferece os recursos necessários para leitura offline.';
    notify();
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshRequested) location.reload();
    else showUpdate();
  });
  registerPromise = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    .then(result => {
      registration = result;
      showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') showUpdate();
        });
      });
      return navigator.serviceWorker.ready;
    })
    .then(() => {
      status.ready = true;
      status.message = 'Bíblia em português, estudos, devocionais e ferramentas disponíveis offline neste aparelho.';
      notify();
      return registration;
    })
    .catch(() => {
      status.message = 'Não foi possível preparar o modo offline. Confira a conexão e reabra o aplicativo.';
      notify();
      return null;
    });
  window.addEventListener('online', () => registration?.update().catch(() => {}));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) registration?.update().catch(() => {});
  });
}

export async function prepareAllOffline() {
  if (downloadPromise) return downloadPromise;
  if (!status.supported) throw Error(status.message);
  let activationTimeout;
  const ready = await Promise.race([
    registerPromise,
    new Promise(resolve => { activationTimeout = setTimeout(() => resolve(null), 15000); })
  ]);
  clearTimeout(activationTimeout);
  if (!ready?.active) throw Error('O modo offline ainda não ficou pronto. Confira a conexão e tente novamente.');
  downloadPromise = new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    let timeout;
    status.downloading = true;
    function finish(error) {
      clearTimeout(timeout);
      channel.port1.close();
      status.downloading = false;
      downloadPromise = null;
      notify();
      if (error) reject(error);
      else resolve();
    }
    function resetTimeout() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        status.message = 'O download foi interrompido. Conecte-se à internet e tente novamente.';
        finish(Error(status.message));
      }, 25000);
    }
    channel.port1.onmessage = ({ data }) => {
      resetTimeout();
      if (data.type === 'PROGRESS') {
        status.completed = data.completed;
        status.total = data.total;
        status.message = 'Baixando livros em hebraico e grego — ' + data.completed + ' de ' + data.total + '.';
        notify();
      } else if (data.type === 'COMPLETE') {
        status.message = 'Pronto. Bíblia em português, estudos e todos os livros em hebraico e grego disponíveis offline neste aparelho.';
        finish();
      } else if (data.type === 'ERROR') {
        status.message = 'Download parcial. Os livros já baixados foram guardados. Confira a conexão e tente novamente.';
        finish(Error(status.message));
      }
    };
    resetTimeout();
    ready.active.postMessage({ type: 'DOWNLOAD_ORIGINALS' }, [channel.port2]);
    notify();
  });
  return downloadPromise;
}
