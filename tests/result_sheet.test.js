'use strict';
const assert = require('node:assert/strict');
const sheet = require('../js/result-sheet.js');
const context = { measureText: text => ({ width: Array.from(text).length * 6 }) };
for (const input of ['Árvíztűrő tükörfúrógép.\nMásodik sor.\n\nUtolsó.', 'ő'.repeat(4000), '👨‍👩‍👧‍👦 közös idő és jóllét']) {
  const lines = sheet.wrapText(context, input, 120);
  assert.ok(lines.every(line => context.measureText(line).width <= 120));
  assert.equal(lines.join('').replace(/\s/g, ''), input.replace(/\s/g, ''));
}
assert.deepEqual(sheet.wrapText(context, '', 100), ['']);
assert.throws(() => sheet.wrapText(context, 'szöveg', 0));
(async () => {
  const categories = Array.from({ length: 12 }, (_, i) => ({ id: String(i), color: '#344D68' }));
  const realTokens = Array.from({ length: 24 }, () => ({ cat: '0' }));
  await assert.rejects(sheet.renderPages({ categories, realTokens, idealTokens: realTokens.slice(1) }), /24/);
  await assert.rejects(sheet.toPNG([]), /Nincs menthető/);
  console.log('✓ Eredménylap: hosszú ékezetes szavak, Unicode, sortörések és érvénytelen bemenetek.');

  const previousDocument = global.document;
  let records = [], canvasNumber = 0;
  global.document = {
    createElement() {
      const page = ++canvasNumber;
      const canvas = { width: 0, height: 0 };
      const context = {
        font: '12px Arial',
        measureText(text) { return { width: Array.from(String(text)).length * parseFloat(this.font.match(/[\d.]+px/)[0]) * 0.52 }; },
        fillText(text, x, y) { records.push({ page, text: String(text), x, y }); }
      };
      for (const method of ['beginPath','moveTo','arcTo','arc','closePath','fill','stroke','setLineDash','scale','fillRect','lineTo','save','restore']) context[method] = () => {};
      canvas.getContext = () => context;
      return canvas;
    }
  };
  try {
    const palette = Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: 'Kategória ' + i, symbol: 'A', color: '#344D68', group: i < 3 ? 'red' : 'green' }));
    const tokens = Array.from({ length: 24 }, (_, id) => ({ id, cat: String(Math.floor(id / 2)) }));
    for (let lines = 0; lines <= 70; lines++) {
      records = [];
      await sheet.renderPages({
        categories: palette, realTokens: tokens, idealTokens: tokens,
        commitment: 'Átgondolom a következő napomat.\n'.repeat(lines),
        insights: [{ title: 'Eredeti útmutatás', verse: 'Ef 5,15–16', body: 'Az eredeti útmutatás szövege. '.repeat(14) + 'VÉGEIRÁNYTŰ' }]
      });
      const heading = records.find(record => record.text === 'Bibliai iránytű');
      const card = records.find(record => record.text === 'Eredeti útmutatás');
      const lastBody = records.find(record => record.text.includes('VÉGEIRÁNYTŰ'));
      const closing = records.find(record => record.text === 'A két időkerék nem erkölcsi osztályzat.');
      assert.equal(heading.page, card.page, 'A fejezetcím nem maradhat az előző oldalon.');
      assert.equal(lastBody.page, closing.page, 'A zárómondat ne kerüljön külön üres oldalra.');
      assert.ok(records.every(record => record.y >= 0 && record.y <= sheet.PAGE_HEIGHT));
    }
  } finally {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
  }
  console.log('✓ 71 oldaltörési határeset: nincs magára maradó fejezetcím vagy külön zárómondatos oldal.');
})().catch(error => { console.error(error); process.exitCode = 1; });
