import { escapeHTML, parseReference } from './core.js';

function passageText(books, ref) {
  const book = books.find(item => item.id === ref.book);
  const endChapter = ref.endChapter || ref.chapter;
  const lines = [];
  for (let chapter = ref.chapter; chapter <= endChapter; chapter++) {
    for (const verse of book.chapters[chapter - 1]) {
      if (chapter === ref.chapter && ref.start && verse.n < ref.start) continue;
      if (chapter === endChapter && ref.end && verse.n > ref.end) break;
      if (lines.length === 36) return [...lines, '<p>Abra a Bíblia para ler o restante da passagem.</p>'].join('');
      const label = endChapter === ref.chapter ? verse.n : chapter + ':' + verse.n;
      lines.push('<p><sup>' + label + '</sup> ' + escapeHTML(verse.t) + '</p>');
    }
  }
  return lines.join('');
}

export function presentationHTML(sermon, fields, books) {
  const references = new Map();
  const candidates = [sermon.reference, sermon.verses]
    .filter(Boolean).join('\n').split(/[;\n]/);
  for (const line of candidates) {
    const reference = line.split(/\s+[—–-]\s+/)[0].trim();
    const passage = parseReference(reference, books);
    if (passage) references.set(reference, passage);
  }
  const sections = fields
    .filter(([key]) => String(sermon[key] || '').trim())
    .map(([key, label]) => '<section><h3>' + escapeHTML(label) + '</h3><p class="stage-text">' + escapeHTML(sermon[key]) + '</p></section>');
  const excerpts = [...references].map(([reference, passage]) =>
    '<details><summary>' + escapeHTML(reference) + ' <small>· Bíblia Livre</small></summary><div class="stage-excerpt">' + passageText(books, passage) + '</div></details>'
  );
  return `
    <div class="stage-controls">
      <output id="sermon-clock" aria-label="Tempo decorrido">00:00</output>
      <button type="button" class="btn" data-stage="toggle">Iniciar</button>
      <button type="button" class="btn" data-stage="reset">Zerar</button>
    </div>
    <span class="eyebrow">MODO DE APRESENTAÇÃO</span>
    <h2>${escapeHTML(sermon.title || 'Sem título')}</h2>
    <p class="stage-reference">${escapeHTML(sermon.reference || '')}</p>
    ${excerpts.length ? '<div class="stage-passages">' + excerpts.join('') + '</div>' : ''}
    ${sections.join('') || '<p>Preencha o esboço para consultar os pontos da mensagem aqui.</p>'}
  `;
}

export function startPresentation(dialog) {
  dialog.classList.add('sermon-stage');
  let elapsed = 0;
  let started = null;
  const clock = dialog.querySelector('#sermon-clock');
  const toggle = dialog.querySelector('[data-stage="toggle"]');

  function updateClock() {
    const total = Math.floor((elapsed + (started === null ? 0 : performance.now() - started)) / 1000);
    clock.textContent = String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  function control(event) {
    const action = event.target.closest('[data-stage]')?.dataset.stage;
    if (action === 'toggle') {
      if (started === null) {
        started = performance.now();
        toggle.textContent = 'Pausar';
      } else {
        elapsed += performance.now() - started;
        started = null;
        toggle.textContent = 'Retomar';
      }
    } else if (action === 'reset') {
      elapsed = 0;
      started = null;
      toggle.textContent = 'Iniciar';
    }
    updateClock();
  }

  const timer = setInterval(updateClock, 250);
  dialog.addEventListener('click', control);
  dialog.addEventListener('close', () => {
    clearInterval(timer);
    dialog.removeEventListener('click', control);
    dialog.classList.remove('sermon-stage');
  }, { once: true });
}
