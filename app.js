(async () => {
  'use strict';
  let packs = await window.LOCAL_QUIZ_PACKS.load();
  let bank = window.LOCAL_QUIZ_PACKS.merge(window.QUIZ_DATA, packs);
  const storageKey = 'td-aws-professional-ptbr-v2';
  const $ = selector => document.querySelector(selector);
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function read(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
  }
  const saved = read(storageKey);
  const state = { activeTest: Number(saved.activeTest) || 1, tests: saved.tests && typeof saved.tests === 'object' ? saved.tests : {} };
  if (!bank.tests.some(t => t.id === state.activeTest)) state.activeTest = 1;
  const equal = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);
  const interactive = q => ['order', 'match'].includes(q.kind);
  const expected = q => interactive(q) ? q.correctSequence : q.options.flatMap((o, i) => o.correct ? [String(i)] : []);
  function testState(id) {
    const raw = state.tests[id] || {};
    const clock = raw.clock || {};
    state.tests[id] = {
      answers: raw.answers && typeof raw.answers === 'object' ? raw.answers : {},
      confirmed: raw.confirmed && typeof raw.confirmed === 'object' ? raw.confirmed : {},
      clock: { elapsedMs: Math.max(0, Number(clock.elapsedMs) || 0), startedAt: Number(clock.startedAt) > 0 ? Number(clock.startedAt) : null }
    };
    return state.tests[id];
  }
  bank.tests.forEach(t => testState(t.id));
  // Keep the selections and confirmations from the original 75-question HTML.
  if (!saved.tests) {
    const legacy = read('td-aws-professional-ptbr-v1');
    const confirmations = read('td-aws-professional-ptbr-v1-confirmations');
    const first = state.tests[1];
    bank.tests[0].questionIds.forEach((id, i) => {
      const oldId = 'q' + (i + 1);
      if (Array.isArray(legacy[oldId])) first.answers[id] = legacy[oldId].map(String);
      if (Array.isArray(confirmations[oldId])) first.confirmed[id] = confirmations[oldId].map(String);
    });
  }
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {} }
  let active = bank.tests.find(t => t.id === state.activeTest);
  // Only the selected test may have a running stopwatch.
  for (const test of bank.tests) if (test.id !== active.id) pauseClock(test.id);
  function elapsed(clock) { return clock.elapsedMs + (clock.startedAt ? Math.max(0, Date.now() - clock.startedAt) : 0); }
  function pauseClock(id) {
    const clock = state.tests[id].clock;
    if (clock.startedAt) { clock.elapsedMs = elapsed(clock); clock.startedAt = null; }
  }
  function startClock() {
    const clock = state.tests[active.id].clock;
    if (!clock.startedAt) clock.startedAt = Date.now();
    persist(); updateClock();
  }
  function updateClock() {
    const clock = state.tests[active.id].clock;
    const seconds = Math.floor(elapsed(clock) / 1000);
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds / 60) % 60, s = seconds % 60;
    $('#clock').textContent = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
    $('#timer-toggle').textContent = clock.startedAt ? 'Pausar' : (clock.elapsedMs ? 'Continuar' : 'Iniciar');
    $('#timer-status').textContent = clock.startedAt ? 'Em andamento' : (clock.elapsedMs ? 'Pausado' : 'Pronto para iniciar');
  }
  function selections(id) {
    const q = bank.questions[id];
    const values = state.tests[active.id].answers[id];
    if (interactive(q)) return Array.isArray(values) && values.some(Boolean) ? values.map(String) : [];
    return Array.isArray(values) ? [...new Set(values.map(String).filter(v => /^\d+$/.test(v) && Number(v) < q.options.length))].sort((a, b) => Number(a) - Number(b)) : [];
  }
  function confirmed(id) { return selections(id).length > 0 && equal(state.tests[active.id].confirmed[id], selections(id)); }
  function updateProgress() {
    const ids = active.questionIds;
    const marked = ids.filter(id => selections(id).length).length;
    const checked = ids.filter(confirmed);
    const graded = checked.filter(id => bank.questions[id].gradingAvailable !== false);
    const correct = graded.filter(id => equal(selections(id), expected(bank.questions[id]))).length;
    $('#answered').textContent = marked + ' de ' + ids.length + ' respondidas';
    $('#score').textContent = correct + (correct === 1 ? ' acerto em ' : ' acertos em ') + graded.length + ' corrigidas' + (checked.length > graded.length ? ' · ' + (checked.length - graded.length) + ' sem gabarito' : '');
    $('#progress').value = checked.length;
    $('#progress').max = Math.max(1, ids.length);
  }
  function linkedText(el, text) {
    const pattern = /https?:\/\/[^\s<>]+/g;
    let start = 0;
    for (const match of text.matchAll(pattern)) {
      el.append(document.createTextNode(text.slice(start, match.index)));
      const url = match[0].replace(/[.,;]+$/, '');
      const a = node('a', '', url); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; el.append(a);
      el.append(document.createTextNode(match[0].slice(url.length))); start = match.index + match[0].length;
    }
    el.append(document.createTextNode(text.slice(start)));
  }
  function renderBlocks(blocks, english = false) {
    const fragment = document.createDocumentFragment();
    for (const block of blocks) {
      if (block.type === 'code') { fragment.append(node('pre', '', block.text)); continue; }
      if (block.type === 'text') {
        const p = node('p'); linkedText(p, english ? block.en : block.pt); fragment.append(p); continue;
      }
      const image = bank.images[block.imageId];
      if (!image) continue;
      const figure = node('figure');
      const a = node('a', 'image-link'); a.href = english ? image.originalPath : image.translatedPath; a.target = '_blank'; a.rel = 'noopener';
      const img = node('img'); img.src = a.href; img.alt = english ? image.alt : image.altPt; img.loading = 'lazy'; img.decoding = 'async';
      img.width = english ? image.originalWidth : image.width; img.height = english ? image.originalHeight : image.height;
      a.append(img); figure.append(a);
      figure.append(node('figcaption', '', english ? 'Imagem original. Clique para ampliar.' : (image.translatedRegions ? 'Textos traduzidos automaticamente na imagem. Clique para ampliar.' : 'Nomes técnicos e elementos visuais preservados. Clique para ampliar.')));
      if (!english) {
        const details = node('details', 'image-original'); details.append(node('summary', '', 'Ver imagem original'));
        const original = node('img'); original.src = image.originalPath; original.alt = image.alt; original.loading = 'lazy'; original.width = image.originalWidth; original.height = image.originalHeight;
        details.append(original); figure.append(details);
      }
      fragment.append(figure);
    }
    return fragment;
  }
  function clearFeedback(card) {
    const feedback = card.querySelector('.feedback'); feedback.textContent = ''; feedback.className = 'feedback';
    card.querySelectorAll('.option').forEach(el => el.classList.remove('is-correct', 'is-incorrect'));
    const explanation = card.querySelector('.explanation'); if (explanation) explanation.remove();
    card.dataset.confirmed = 'false';
  }
  function showGrade(card, q) {
    const picked = selections(q.id), keys = expected(q);
    const feedback = card.querySelector('.feedback');
    if (!picked.length || (interactive(q) && (picked.length !== expected(q).length || picked.includes('') || (q.kind === 'order' && new Set(picked).size !== picked.length)))) { feedback.className = 'feedback warning'; feedback.textContent = 'Complete a resposta antes de confirmar. Na ordenação, use cada item uma vez.'; return false; }
    const available = q.gradingAvailable !== false;
    const correct = available && equal(picked, keys);
    feedback.className = 'feedback ' + (!available ? 'warning' : correct ? 'correct' : 'incorrect');
    const keyText = interactive(q) ? keys.map((id, i) => (q.kind === 'match' ? q.leftItems[i].textPt : String(i + 1)) + ' → ' + (q.kind === 'match' ? q.rightItems : q.items).find(item => item.id === id)?.textPt).join('; ') : keys.map(i => String.fromCharCode(65 + Number(i))).join(', ');
    feedback.textContent = available ? (correct ? 'Resposta correta! ' : 'Resposta incorreta. ') + 'Gabarito: ' + keyText + '.' : 'Resposta registrada. Gabarito e explicação não recebidos nesta captura; esta questão não entra na nota.';
    card.querySelectorAll('.interactive-row').forEach((row, i) => { row.classList.toggle('is-correct', available && picked[i] === keys[i]); row.classList.toggle('is-incorrect', available && picked[i] !== keys[i]); });
    card.dataset.confirmed = 'true';
    card.querySelectorAll('fieldset input').forEach(input => {
      const label = input.closest('.option');
      label.classList.toggle('is-correct', keys.includes(input.value));
      label.classList.toggle('is-incorrect', input.checked && !keys.includes(input.value));
    });
    if (!card.querySelector('.explanation')) {
      const explanation = node('section', 'explanation'); explanation.setAttribute('aria-label', 'Explicação da resposta');
      explanation.append(node('h3', '', 'Explicação da resposta'), q.explanationBlocks.length ? renderBlocks(q.explanationBlocks) : node('p', '', 'Explicação não recebida nesta captura.'));
      const original = node('details', 'original'); original.lang = 'en';
      original.append(node('summary', '', 'Ver explicação original em inglês'), renderBlocks(q.explanationBlocks, true));
      explanation.append(original); card.querySelector('form').after(explanation);
    }
    return true;
  }
  function makeCard(id, index) {
    const q = bank.questions[id], card = node('section', 'question'); card.id = 'q' + (index + 1); card.dataset.questionId = id;
    const title = node('div', 'question-title'); const heading = node('h2', '', 'Questão ' + String(index + 1).padStart(2, '0')); heading.id = card.id + '-title';
    card.setAttribute('aria-labelledby', heading.id);
    title.append(heading, node('span', 'kind', q.kind === 'order' ? 'Ordenação' : q.kind === 'match' ? 'Associação' : q.multiple ? 'Múltipla seleção' : 'Resposta única')); card.append(title);
    const statement = node('div', 'statement');
    if (q.questionBlocks.some(b => b.type !== 'text')) statement.append(renderBlocks(q.questionBlocks));
    else for (const p of q.questionPt.split(/\n\s*\n/)) statement.append(node('p', '', p));
    card.append(statement);
    const form = node('form', 'answer-form'), fieldset = node('fieldset'); fieldset.append(node('legend', 'sr-only', 'Alternativas da questão ' + (index + 1)));
    if (interactive(q)) {
      const rows = q.kind === 'match' ? q.leftItems : q.items;
      const choices = q.kind === 'match' ? q.rightItems : q.items;
      rows.forEach((item, i) => {
        const label = node('label', 'option interactive-row');
        label.append(node('span', '', q.kind === 'match' ? item.textPt : 'Posição ' + (i + 1)));
        const select = node('select'); select.setAttribute('aria-label', q.kind === 'match' ? item.textPt : 'Posição ' + (i + 1));
        const placeholder = node('option', '', 'Selecionar'); placeholder.value = ''; select.append(placeholder);
        [...choices].sort((a, b) => a.textPt.localeCompare(b.textPt, 'pt-BR')).forEach(choice => { const option = node('option', '', choice.textPt); option.value = choice.id; select.append(option); });
        select.value = selections(id)[i] || '';
        select.addEventListener('change', () => {
          const ts = state.tests[active.id]; ts.answers[id] = [...fieldset.querySelectorAll('select')].map(el => el.value); delete ts.confirmed[id]; clearFeedback(card);
          if (!ts.clock.startedAt && ts.clock.elapsedMs === 0) startClock(); persist(); updateProgress();
        });
        label.append(select); fieldset.append(label);
      });
    }
    q.options.forEach((option, i) => {
      const label = node('label', 'option'), input = node('input'); input.type = q.multiple ? 'checkbox' : 'radio'; input.name = id; input.value = String(i); input.checked = selections(id).includes(input.value);
      input.setAttribute('aria-label', 'Alternativa ' + String.fromCharCode(65 + i));
      label.append(input, node('span', 'letter', String.fromCharCode(65 + i)), node('span', '', option.textPt));
      input.addEventListener('change', () => {
        const ts = state.tests[active.id]; ts.answers[id] = [...fieldset.querySelectorAll('input:checked')].map(el => el.value);
        delete ts.confirmed[id]; clearFeedback(card);
        if (!ts.clock.startedAt && ts.clock.elapsedMs === 0) startClock();
        persist(); updateProgress();
      });
      fieldset.append(label);
    });
    const submit = node('button', 'confirm-answer', 'Confirmar resposta'); submit.type = 'submit';
    const feedback = node('p', 'feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); feedback.setAttribute('aria-atomic', 'true');
    form.append(fieldset, submit, feedback);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (showGrade(card, q)) { state.tests[active.id].confirmed[id] = selections(id); persist(); updateProgress(); }
    });
    card.append(form);
    const original = node('details', 'original-question'); original.append(node('summary', '', 'Ver questão original em inglês'));
    const en = node('div', 'original'); en.lang = 'en'; en.append(node('p', '', q.questionEn));
    const list = node('ol'); list.type = 'A'; q.options.forEach(o => list.append(node('li', '', o.textEn))); en.append(list); original.append(en); card.append(original);
    if (interactive(q)) {
      for (const items of q.kind === 'order' ? [q.items] : [q.leftItems, q.rightItems]) {
        const originalItems = node('ul');
        [...items].sort((a, b) => a.textEn.localeCompare(b.textEn)).forEach(item => originalItems.append(node('li', '', item.textEn)));
        en.append(originalItems);
      }
    }
    if (confirmed(id)) showGrade(card, q);
    return card;
  }
  const normal = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filter() {
    const query = normal($('#search').value.trim()); let count = 0;
    for (const card of $('#questions').children) {
      const q = bank.questions[card.dataset.questionId];
      card.hidden = !!query && !normal(q.questionPt + ' ' + q.options.map(o => o.textPt).join(' ')).includes(query);
      if (!card.hidden) count++;
    }
    $('#visible').textContent = count + (count === 1 ? ' questão exibida' : ' questões exibidas'); $('#empty').hidden = count !== 0;
  }
  function render() {
    $('#test-select').value = String(active.id);
    $('#test-title').textContent = active.title;
    $('#test-description').textContent = active.questionIds.length + ' questões únicas' + (active.duplicatesRemoved ? ' · ' + active.duplicatesRemoved + ' repetições removidas desta tentativa' : '');
    $('#search').value = ''; $('#questions').replaceChildren(...active.questionIds.map(makeCard));
    $('#jump').replaceChildren(node('option', '', 'Selecionar')); $('#jump').firstChild.value = '';
    active.questionIds.forEach((_, i) => { const option = node('option', '', String(i + 1).padStart(2, '0')); option.value = 'q' + (i + 1); $('#jump').append(option); });
    filter(); updateProgress(); updateClock(); persist();
  }
  function refreshPickers() {
    const platforms = [...new Set(bank.tests.map(t => t.platform))];
    $('#provider-select').replaceChildren(...platforms.map(platform => { const option = node('option', '', platform); option.value = platform; return option; }));
    $('#provider-select').value = active.platform;
    $('#test-select').replaceChildren(...bank.tests.filter(t => t.platform === active.platform).map(test => { const option = node('option', '', test.title + ' · ' + test.questionIds.length + ' questões'); option.value = String(test.id); return option; }));
    $('#bank-count').textContent = platforms.length + ' plataformas · ' + bank.tests.length + ' testes · ' + Object.keys(bank.questions).length + ' questões';
  }
  $('#provider-select').addEventListener('change', event => {
    pauseClock(active.id); active = bank.tests.find(t => t.platform === event.target.value); state.activeTest = active.id; refreshPickers(); render();
  });
  $('#import-file').addEventListener('change', async event => {
    try {
      const file = event.target.files[0]; if (!file) return;
      const pack = window.LOCAL_QUIZ_PACKS.validate(JSON.parse(await file.text()));
      const nextPacks = [...packs, pack], nextBank = window.LOCAL_QUIZ_PACKS.merge(window.QUIZ_DATA, nextPacks);
      pauseClock(active.id); packs = nextPacks; bank = nextBank; bank.tests.forEach(t => testState(t.id));
      active = bank.tests.find(t => t.platform === pack.tests[0].platform) || bank.tests[0]; state.activeTest = active.id;
      let message = 'Arquivo importado neste navegador.';
      try { await window.LOCAL_QUIZ_PACKS.save(packs); } catch { message += ' O navegador não permitiu salvar o pacote; importe novamente na próxima abertura.'; }
      refreshPickers(); render(); $('#import-status').textContent = message;
    } catch (error) { $('#import-status').textContent = 'Não foi possível importar: ' + error.message; }
    event.target.value = '';
  });
  refreshPickers();
  $('#test-select').addEventListener('change', event => {
    pauseClock(active.id); state.activeTest = Number(event.target.value); active = bank.tests.find(t => t.id === state.activeTest);
    render(); window.scrollTo({ top: 0, behavior: 'instant' });
  });
  $('#search').addEventListener('input', filter);
  $('#jump').addEventListener('change', event => {
    if (!event.target.value) return; $('#search').value = ''; filter(); document.getElementById(event.target.value).scrollIntoView({ behavior: 'smooth' });
  });
  $('#timer-toggle').addEventListener('click', () => {
    const clock = state.tests[active.id].clock;
    if (clock.startedAt) { pauseClock(active.id); persist(); updateClock(); } else startClock();
  });
  $('#timer-reset').addEventListener('click', () => { state.tests[active.id].clock = { elapsedMs: 0, startedAt: null }; persist(); updateClock(); });
  const viewer = node('dialog', 'image-dialog');
  viewer.setAttribute('aria-label', 'Imagem ampliada');
  const viewerBar = node('div', 'viewer-bar');
  viewerBar.append(node('strong', '', 'Diagrama da explicação'));
  const zoom = node('button', '', 'Tamanho original'); zoom.type = 'button';
  const close = node('button', '', 'Fechar'); close.type = 'button';
  const canvas = node('div', 'viewer-canvas fit'), largeImage = node('img');
  canvas.append(largeImage); viewerBar.append(zoom, close); viewer.append(viewerBar, canvas); document.body.append(viewer);
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  zoom.addEventListener('click', () => {
    const fit = canvas.classList.toggle('fit'); zoom.textContent = fit ? 'Tamanho original' : 'Ajustar à tela';
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a.image-link');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault(); largeImage.src = link.href; largeImage.alt = link.querySelector('img').alt;
    canvas.classList.add('fit'); zoom.textContent = 'Tamanho original'; viewer.showModal();
  });
  $('#print').addEventListener('click', () => window.print());
  window.addEventListener('pagehide', persist);
  setInterval(() => { updateClock(); if (state.tests[active.id].clock.startedAt) persist(); }, 1000);
  $('#bank-count').textContent = bank.tests.length + ' testes · ' + Object.keys(bank.questions).length + ' questões sem repetição';
  render();
})();
