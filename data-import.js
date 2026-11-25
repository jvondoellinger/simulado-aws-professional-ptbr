(() => {
  'use strict';
  const databaseName = 'aws-simulados-local-packs-v1';
  const invalidKeys = new Set(['__proto__', 'prototype', 'constructor']);
  function validate(pack) {
    if (!pack || !Array.isArray(pack.tests) || !pack.questions || typeof pack.questions !== 'object') throw new Error('O arquivo deve conter tests e questions no formato do simulado.');
    const copy = structuredClone(pack);
    copy.images ||= {};
    for (const [id, q] of Object.entries(copy.questions)) {
      if (invalidKeys.has(id) || !q || typeof q !== 'object') throw new Error('Identificador de questão inválido.');
      q.id = id;
      q.platform ||= 'Importado';
      q.questionPt ||= q.questionEn;
      q.questionEn ||= q.questionPt;
      if (typeof q.questionPt !== 'string' || !q.questionPt.trim()) throw new Error('Há uma questão sem enunciado.');
      q.kind ||= q.multiple ? 'multi' : 'single';
      q.multiple = q.kind === 'multi';
      q.options ||= [];
      if (!Array.isArray(q.options)) throw new Error('Alternativas inválidas.');
      q.options.forEach(o => { o.textPt ||= o.textEn; o.textEn ||= o.textPt; });
      q.questionBlocks ||= [{ type: 'text', en: q.questionEn, pt: q.questionPt }];
      q.explanationBlocks ||= [];
      if (!['single', 'multi', 'order', 'match'].includes(q.kind)) throw new Error('Tipo de questão não suportado: ' + q.kind);
      if (q.kind === 'order' && !q.items?.length) throw new Error('Questão de ordenação sem itens.');
      if (q.kind === 'match' && (!q.leftItems?.length || !q.rightItems?.length)) throw new Error('Questão de associação sem colunas.');
      if (['order', 'match'].includes(q.kind)) {
        const rows = q.kind === 'order' ? q.items : q.leftItems;
        const choices = q.kind === 'order' ? q.items : q.rightItems;
        if (!Array.isArray(q.correctSequence) || q.correctSequence.length !== rows.length || q.correctSequence.some(id => !choices.some(item => item.id === id))) throw new Error('Gabarito interativo inválido.');
        for (const item of [...rows, ...choices]) {
          if (typeof item.id !== 'string' || typeof item.textPt !== 'string' || typeof item.textEn !== 'string') throw new Error('Item interativo inválido.');
        }
        if (q.kind === 'order' && new Set(q.correctSequence).size !== rows.length) throw new Error('Ordenação com itens repetidos.');
      } else if (q.options.length < 2 || q.options.some(o => typeof o.textPt !== 'string')) throw new Error('Alternativas ausentes ou inválidas.');
    }
    for (const [id, image] of Object.entries(copy.images)) {
      if (invalidKeys.has(id)) throw new Error('Identificador de imagem inválido.');
      for (const key of ['translatedPath', 'originalPath']) {
        const path = image[key] || '';
        if (path && !/^data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,/i.test(path) && !/^assets\/[a-zA-Z0-9_./-]+$/.test(path)) throw new Error('As imagens importadas devem estar incorporadas no JSON ou na pasta assets.');
        if (path.split('/').includes('..')) throw new Error('Caminho de imagem inválido.');
      }
    }
    for (const test of copy.tests) {
      if (!Array.isArray(test.questionIds) || test.questionIds.some(id => !copy.questions[id])) throw new Error('Um teste referencia questões ausentes no arquivo.');
      test.platform ||= copy.questions[test.questionIds[0]]?.platform || 'Importado';
      test.title ||= 'Teste importado';
    }
    return copy;
  }
  function merge(base, packs) {
    const bank = structuredClone(base);
    bank.images ||= {};
    bank.tests.forEach(t => { t.platform ||= 'Tutorials Dojo'; });
    Object.values(bank.questions).forEach(q => { q.platform ||= 'Tutorials Dojo'; q.kind ||= q.multiple ? 'multi' : 'single'; });
    let nextId = Math.max(0, ...bank.tests.map(t => Number(t.id) || 0)) + 1;
    const testKey = test => test.platform + '::' + (test.sourceTestId || test.title);
    const knownTests = new Map(bank.tests.map(test => [testKey(test), test]));
    const assigned = new Set(bank.tests.flatMap(t => t.questionIds));
    for (const source of packs) {
      const pack = validate(source);
      for (const [id, q] of Object.entries(pack.questions)) {
        if (bank.questions[id] && bank.questions[id].questionEn !== q.questionEn) throw new Error('Conflito de identificação entre arquivos importados.');
        bank.questions[id] = q;
      }
      Object.assign(bank.images, pack.images);
      for (const sourceTest of pack.tests) {
        const key = testKey(sourceTest), existing = knownTests.get(key);
        if (existing) {
          const added = sourceTest.questionIds.filter(id => !assigned.has(id));
          existing.questionIds.push(...added); added.forEach(id => assigned.add(id));
        } else {
          const questionIds = [...new Set(sourceTest.questionIds)].filter(id => !assigned.has(id));
          if (!questionIds.length) continue;
          const test = { ...sourceTest, id: nextId++, questionIds };
          bank.tests.push(test); knownTests.set(key, test); questionIds.forEach(id => assigned.add(id));
        }
      }
    }
    const used = new Set(bank.tests.flatMap(t => t.questionIds));
    for (const id of Object.keys(bank.questions)) if (!used.has(id)) delete bank.questions[id];
    return bank;
  }
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function load() {
    let db;
    try {
      db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const request = db.transaction('data').objectStore('data').get('packs');
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });
    } catch { return []; } finally { db?.close(); }
  }
  async function save(packs) {
    const db = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('data', 'readwrite'); transaction.objectStore('data').put(packs, 'packs');
        transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
      });
    } finally { db.close(); }
  }
  window.LOCAL_QUIZ_PACKS = { validate, merge, load, save };
})();
