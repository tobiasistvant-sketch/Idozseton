'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function application() {
  const downloads = [], snapshots = [], buttons = [{ disabled: false }, { disabled: false }, { disabled: false }];
  const status = { textContent: '', className: '', setAttribute() {} };
  const nodes = { app: { innerHTML: '' }, 'steps-nav': { innerHTML: '' }, commitment: { value: 'Árvíztűrő tükörfúrógép.' }, 'export-status': status };
  let pendingBlob;
  const sheet = {
    async renderPages(snapshot) { snapshots.push(snapshot); return [{ width: 1588, height: 2246 }]; },
    async toPNG() { return new Blob(['PNG'], { type: 'image/png' }); }
  };
  const pdf = { async fromCanvases() { return new Blob(['PDF'], { type: 'application/pdf' }); } };
  const context = vm.createContext({
    document: {
      getElementById: id => nodes[id] || null,
      querySelectorAll: () => buttons,
      addEventListener() {},
      createElement: () => ({ click() { downloads.push({ filename: this.download, blob: pendingBlob }); } })
    },
    window: { scrollTo() {}, ResultSheet: sheet, PDFExport: pdf },
    URL: { createObjectURL(blob) { pendingBlob = blob; return 'blob:local'; }, revokeObjectURL() {} },
    Blob, setTimeout() {}, confirm: () => false
  });
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  const run = code => vm.runInContext(code, context);
  run(`
    state.real.forEach((t, i) => { t.cat = CATEGORIES[Math.floor(i / 2)].id; });
    prepareIdeal();
    state.ideal.forEach((t, i) => { t.cat = CATEGORIES[Math.floor(i / 2)].id; });
    state.ideal[0].cat = 'sport';
    state.ideal[10].cat = 'sleep';
    state.reached = 3; state.page = 3; render();
  `);
  return { run, downloads, snapshots, buttons, nodes, status, sheet, pdf };
}

(async () => {
  let app = application();
  const before = app.run('JSON.stringify([state.real, state.ideal])');
  const snapshot = app.run('createResultSnapshot()');
  assert.equal(snapshot.categories.length, 12);
  assert.equal(snapshot.categories.reduce((n, c) => n + c.real, 0), 24);
  assert.equal(snapshot.categories.reduce((n, c) => n + c.ideal, 0), 24);
  assert.equal(snapshot.commitment, app.nodes.commitment.value);
  assert.ok(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.idealTokens[0]));
  assert.equal(app.run('JSON.stringify([state.real, state.ideal])'), before);
  app.run("state.ideal[0].cat='school'");
  assert.equal(snapshot.idealTokens[0].cat, 'sport');
  console.log('✓ Leválasztott, változatlan pillanatkép és aktuális vállalás.');

  app = application();
  const expected = app.run('getInsights()');
  app.run('downloadText()');
  const txt = await app.downloads[0].blob.text();
  const txtBytes = new Uint8Array(await app.downloads[0].blob.arrayBuffer());
  assert.deepEqual(Array.from(txtBytes.slice(0, 3)), [0xef, 0xbb, 0xbf]);
  assert.ok(txt.includes(app.nodes.commitment.value));
  for (const insight of expected) {
    for (const field of ['title', 'verse', 'body', 'question']) assert.ok(txt.includes(insight[field]));
    assert.ok(!txt.includes(insight.source), 'A teljes bibliográfia nem ismétlődik a TXT-ben.');
  }
  assert.equal((txt.match(/\|/g) || []).length, 39);
  console.log('✓ Részletes UTF-8 TXT: 12 kategória, igehelyek, eredeti szöveg/kérdés, ismétlődő bibliográfia nélkül.');

  for (const format of ['png', 'pdf']) {
    app = application();
    const allocation = app.run('JSON.stringify([state.real,state.ideal])');
    await app.run(`downloadVisual('${format}')`);
    assert.equal(app.downloads.length, 1);
    assert.equal(app.downloads[0].filename, `Idozseton_szemelyes_eredmeny.${format}`);
    assert.equal(app.snapshots.length, 1);
    assert.equal(app.snapshots[0].commitment, app.nodes.commitment.value);
    assert.equal(app.run('JSON.stringify([state.real,state.ideal])'), allocation);
    assert.ok(app.buttons.every(button => !button.disabled));
  }
  console.log('✓ PNG/PDF ugyanazt a pillanatképet kapja, a letöltés nem változtat az időbeosztáson.');

  for (const operation of ["downloadText()", "downloadVisual('png')", "downloadVisual('pdf')"]) {
    app = application();
    app.run('state.ideal[0].cat=null');
    await app.run(operation);
    assert.equal(app.downloads.length, 0);
    assert.equal(app.snapshots.length, 0);
    assert.equal(app.run('state.page'), 2);
  }
  console.log('✓ Mindhárom formátum tiltott 23 órás tervnél.');

  app = application();
  app.sheet.renderPages = async () => { throw new Error('Nincs elegendő memória.'); };
  await app.run("downloadVisual('png')");
  assert.equal(app.downloads.length, 0);
  assert.match(app.status.textContent, /Nem sikerült.*Nincs elegendő memória/);
  assert.ok(app.buttons.every(button => !button.disabled));
  app.sheet.renderPages = async snapshot => { app.snapshots.push(snapshot); return [{ width: 1588, height: 2246 }]; };
  await app.run("downloadVisual('pdf')");
  assert.equal(app.downloads.length, 1);
  console.log('✓ Exporthiba érthető visszajelzést ad, a következő kísérlet működik.');

  app = application();
  let finish;
  app.sheet.renderPages = snapshot => {
    app.snapshots.push(snapshot);
    return new Promise(resolve => { finish = () => resolve([{ width: 1588, height: 2246 }]); });
  };
  const pending = app.run("downloadVisual('png')");
  await app.run("downloadVisual('pdf')");
  assert.equal(app.snapshots.length, 1, 'Az ismételt kattintás nem indít új exportot.');
  app.nodes.commitment.value = 'Későbbi szerkesztés';
  app.run("state.ideal[0].cat='school'");
  finish(); await pending;
  assert.equal(app.snapshots[0].commitment, 'Árvíztűrő tükörfúrógép.');
  assert.equal(app.snapshots[0].idealTokens[0].cat, 'sport');
  console.log('✓ Folyamatban lévő export következetes marad szerkesztés és ismételt kattintás mellett.');

  app = application();
  let complete;
  app.sheet.renderPages = () => new Promise(resolve => { complete = () => resolve([{ width: 1588, height: 2246 }]); });
  const stale = app.run("downloadVisual('pdf')");
  app.run('state.ideal[0].cat=null'); complete(); await stale;
  assert.equal(app.downloads.length, 0);
  assert.equal(app.run('state.page'), 2);
  console.log('✓ Közben hiányossá vált időbeosztás sem enged letöltést.');
})().catch(error => { console.error(error); process.exitCode = 1; });
