/**
 * Időzseton: exercise the ACTUAL inline application script, including navigation
 * and download handlers, without copying the functions under test.
 *
 * Run from the repository root: node tests/navigation_guard.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'Az alkalmazás JavaScript-kódja nem található');

const nodes = {
  app: { innerHTML: '' },
  'steps-nav': { innerHTML: '' }
};
const downloads = [];
const listeners = {};
const context = vm.createContext({
  document: {
    getElementById: id => nodes[id] || null,
    addEventListener: (name, fn) => { listeners[name] = fn; },
    createElement: () => ({
      click() { downloads.push('download'); },
      set href(value) { this._href = value; },
      set download(value) { this._download = value; }
    })
  },
  window: { scrollTo() {} },
  URL: { createObjectURL: () => 'blob:local-test', revokeObjectURL() {} },
  Blob: class { constructor(parts, options) { this.parts = parts; this.options = options; } },
  setTimeout() {},
  confirm: () => false
});
vm.runInContext(match[1], context, { filename: 'index.html' });
const run = code => vm.runInContext(code, context);

function resultsStepButton() {
  const button = nodes['steps-nav'].innerHTML.match(/<button[^>]*data-page="3"[\s\S]*?<\/button>/);
  assert.ok(button, 'Az összevetés navigációs gombja hiányzik');
  return button[0];
}

// Start with two completed, valid 24-hour days.
run(`
  state.real.forEach(t => { t.cat = 'sleep'; });
  prepareIdeal();
  state.ideal.forEach(t => { t.cat = 'sleep'; });
  state.reached = 3;
  state.page = 2;
  render();
`);
assert.equal(run('hasCompleteDays()'), true);
assert.doesNotMatch(resultsStepButton(), /\bdisabled\b/);
run('setPage(3)');
assert.equal(run('state.page'), 3);
assert.match(nodes.app.innerHTML, /Mit mutat a két napod/);
run('downloadText()');
assert.equal(downloads.length, 1, 'A teljes eredménynek letölthetőnek kell lennie');

// Regression: remove one hour after previously reaching results.
run(`
  state.ideal[0].cat = null;
  state.page = 2;
  render();
`);
assert.equal(run('hasCompleteDays()'), false);
assert.match(resultsStepButton(), /\bdisabled\b/, 'A felső összevetés gombot tiltani kell');
run('setPage(3)');
assert.equal(run('state.page'), 2, '23 órás tervvel nem lehet összevetésre lépni');
assert.match(nodes.app.innerHTML, /mind a 24 óráját/);
run('downloadText()');
assert.equal(downloads.length, 1, 'A hiányos terv nem exportálható');

// An incomplete plan must not unlock the results even via advance().
run('state.reached = 2; advance(3)');
assert.equal(run('state.page'), 2);
assert.equal(run('state.reached'), 2);

// Restoring the 24th token re-enables both comparison and download.
run('state.ideal[0].cat = "sleep"; render();');
assert.match(resultsStepButton(), /\bdisabled\b/); // Az előrehaladási határ még a 2. lépés
run('state.reached = 3; render(); setPage(3)');
assert.equal(run('state.page'), 3);
run('downloadText()');
assert.equal(downloads.length, 2);

// If the real day is incomplete, redirect to its allocation screen.
run('state.real[0].cat = null; state.page = 3; render()');
assert.equal(run('state.page'), 1);
assert.match(nodes.app.innerHTML, /mind a 24 óráját/);
run('downloadText()');
assert.equal(downloads.length, 2, 'Hiányos valós nap sem exportálható');

console.log('✓ Időzseton: 24 órás összevetés és letöltés védelme sikeres.');
