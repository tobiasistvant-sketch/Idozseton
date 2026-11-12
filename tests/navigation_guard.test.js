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

// Validate all 24 entries, including sparse slots and inherited object keys.
const invalidDays = [
  'null',
  '[]',
  'new Array(24)',
  'Array.from({ length: 24 }, (_, id) => id === 12 ? undefined : { cat: "sleep" })',
  'Array.from({ length: 23 }, () => ({ cat: "sleep" }))',
  'Array.from({ length: 25 }, () => ({ cat: "sleep" }))',
  'Array.from({ length: 24 }, () => ({ cat: new String("sleep") }))',
  ...['', 'unknown', 'toString', 'constructor', '__proto__'].map(cat =>
    `Array.from({ length: 24 }, () => ({ cat: ${JSON.stringify(cat)} }))`)
];
invalidDays.forEach(day => {
  assert.equal(run(`hasCompleteDay(${day})`), false, `Érvénytelen nap: ${day}`);
});
assert.equal(run('CATEGORIES.every(c => hasCompleteDay(Array.from({ length: 24 }, () => ({ cat: c.id }))))'), true);

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

// Exhaust every real/ideal allocation total through all four guarded entry points.
let guardedRoutes = 0;
for (let realHours = 0; realHours <= 24; realHours++) {
  for (let idealHours = 0; idealHours <= 24; idealHours++) {
    const complete = realHours === 24 && idealHours === 24;
    const expectedPage = complete ? 3 : realHours < 24 ? 1 : 2;
    run(`
      state.real = Array.from({ length: 24 }, (_, id) => ({ id, cat: id < ${realHours} ? 'school' : null }));
      state.ideal = Array.from({ length: 24 }, (_, id) => ({ id, cat: id < ${idealHours} ? 'sleep' : null, source: 'green', origin: 'sleep' }));
      state.reached = 3;
      state.page = 2;
      render();
    `);
    assert.equal(/\bdisabled\b/.test(resultsStepButton()), !complete);

    run('setPage(3)');
    assert.equal(run('state.page'), expectedPage, `setPage: ${realHours}/${idealHours}`);
    guardedRoutes++;

    run('state.page = 2; state.reached = 2; advance(3)');
    assert.equal(run('state.page'), expectedPage, `advance: ${realHours}/${idealHours}`);
    assert.equal(run('state.reached'), complete ? 3 : 2);
    guardedRoutes++;

    run('state.page = 3; render()');
    assert.equal(run('state.page'), expectedPage, `render: ${realHours}/${idealHours}`);
    assert.equal(nodes.app.innerHTML.includes('Mit mutat a két napod'), complete);
    guardedRoutes++;

    const previousDownloads = downloads.length;
    run('downloadText()');
    assert.equal(downloads.length - previousDownloads, complete ? 1 : 0, `download: ${realHours}/${idealHours}`);
    guardedRoutes++;
  }
}

// No ideal plan exists yet: stale navigation/export must return to preparation.
run('state.ideal = null; state.reached = 3; state.page = 3; render()');
assert.equal(run('state.page'), 1);
const previousDownloads = downloads.length;
run('downloadText()');
assert.equal(downloads.length, previousDownloads);

console.log(`✓ Időzseton: érvénytelen napok és ${guardedRoutes} navigációs/export ellenőrzés sikeres.`);
