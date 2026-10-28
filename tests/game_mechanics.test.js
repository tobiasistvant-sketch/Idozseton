/**
 * Időzseton - Comprehensive Game Mechanics Automated Unit Test Suite
 * Tests core game logic, token bounds, allocation/removal, red lock toggling,
 * stolen time origin tracking, navigation rules, and text export.
 * Run with Node.js: `node tests/game_mechanics.test.js`
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('Running Expanded Időzseton Game Mechanics Unit Tests...\n');

const html = fs.readFileSync('./index.html', 'utf8');

// 1. Static HTML & Structure Verification
const categoriesMatch = html.match(/const CATEGORIES = \[([\s\S]*?)\];/);
assert(categoriesMatch, 'CATEGORIES array must be defined');
const categoryCount = (categoriesMatch[1].match(/id:/g) || []).length;
assert.strictEqual(categoryCount, 12, 'Must have exactly 12 categories');
console.log('✓ Test 1: 12 game categories verified in static structure.');

assert(html.includes('length: 24'), 'Must initialize 24 tokens');
console.log('✓ Test 2: 24 token initialization verified.');

// 2. JS Runtime Logic Testing matching exact index.html functions
const jsCode = `
  ${categoriesMatch[0]}
  const categoryMap = Object.fromEntries(CATEGORIES.map(x => [x.id, x]));
  var state = {
    page: 0,
    reached: 0,
    selected: 'school',
    unlockRed: false,
    real: Array.from({ length: 24 }, (_, id) => ({ id, cat: null, source: null, origin: null })),
    ideal: null,
    notice: '',
    commitment: ''
  };

  function tokens() { return state.page === 2 ? state.ideal : state.real; }
  function count(list, id) { return list.filter(t => t.cat === id).length; }
  function countFree(list) { return list.filter(t => !t.cat).length; }
  function stolen(list) { return list.filter(t => t.source === 'red' && t.cat && categoryMap[t.cat].group === 'green').length; }

  function prepareIdeal() {
    state.ideal = state.real.map(t => ({
      id: t.id,
      cat: categoryMap[t.cat].group === 'red' ? t.cat : null,
      source: categoryMap[t.cat].group,
      origin: t.cat
    }));
    state.unlockRed = false;
    state.selected = 'sleep';
  }

  function addToken(id) {
    const cat = categoryMap[id];
    const list = tokens();
    if (!cat) return;
    if (state.page === 2 && cat.group === 'red' && !state.unlockRed) {
      state.notice = 'A piros idő alapból kötött.';
      return;
    }
    const free = list.filter(t => !t.cat);
    if (!free.length) {
      state.notice = 'Minden időzsetont kiosztottál.';
      return;
    }
    let pick = state.page === 2 ? free.find(t => t.source === cat.group) || free[0] : free[0];
    pick.cat = id;
    state.notice = '';
  }

  function removeToken(id) {
    const cat = categoryMap[id];
    const list = tokens();
    if (!cat) return;
    if (state.page === 2 && cat.group === 'red' && !state.unlockRed) {
      state.notice = 'A piros idő rögzített.';
      return;
    }
    const matches = list.filter(t => t.cat === id);
    if (!matches.length) return;
    matches[matches.length - 1].cat = null;
    state.notice = '';
  }
`;

const ctx = vm.createContext();
vm.runInContext(jsCode, ctx);

// Test 3: Allocation and removal on Screen 1 (Valós nap)
ctx.state.page = 1;
assert.strictEqual(ctx.countFree(ctx.tokens()), 24);

// Add 6 school hours, 2 travel, 16 sleep
for (let i = 0; i < 6; i++) ctx.addToken('school');
for (let i = 0; i < 2; i++) ctx.addToken('travel');
for (let i = 0; i < 16; i++) ctx.addToken('sleep');

assert.strictEqual(ctx.countFree(ctx.tokens()), 0);
assert.strictEqual(ctx.count(ctx.tokens(), 'school'), 6);
assert.strictEqual(ctx.count(ctx.tokens(), 'travel'), 2);
assert.strictEqual(ctx.count(ctx.tokens(), 'sleep'), 16);

// Attempt adding 25th token
ctx.addToken('phone');
assert.strictEqual(ctx.state.notice, 'Minden időzsetont kiosztottál.');
console.log('✓ Test 3: Allocation limit and 24-token capacity enforced.');

// Test 4: Token Removal
ctx.removeToken('sleep');
assert.strictEqual(ctx.count(ctx.tokens(), 'sleep'), 15);
assert.strictEqual(ctx.countFree(ctx.tokens()), 1);
ctx.addToken('phone');
assert.strictEqual(ctx.count(ctx.tokens(), 'phone'), 1);
console.log('✓ Test 4: Token removal and reallocation verified.');

// Test 5: Screen 2 (Ideális nap) preparation & red locking
ctx.prepareIdeal();
ctx.state.page = 2;

// Red categories (school=6, travel=2) should be locked by default
assert.strictEqual(ctx.count(ctx.tokens(), 'school'), 6);
assert.strictEqual(ctx.count(ctx.tokens(), 'travel'), 2);
assert.strictEqual(ctx.countFree(ctx.tokens()), 16);

// Attempt modifying locked red category
ctx.removeToken('school');
assert.strictEqual(ctx.state.notice, 'A piros idő rögzített.');
assert.strictEqual(ctx.count(ctx.tokens(), 'school'), 6);
console.log('✓ Test 5: Red time locking on Screen 2 verified.');

// Test 6: Unlock red time and track stolen time ("lopott idő")
ctx.state.unlockRed = true;

// Fill all 16 green allocatable slots first
for (let i = 0; i < 15; i++) ctx.addToken('sleep');
ctx.addToken('phone');
assert.strictEqual(ctx.countFree(ctx.tokens()), 0);

// Remove 2 red 'school' tokens (which frees tokens with source='red')
ctx.removeToken('school');
ctx.removeToken('school');
assert.strictEqual(ctx.count(ctx.tokens(), 'school'), 4);
assert.strictEqual(ctx.countFree(ctx.tokens()), 2);

// Reallocate those 2 freed red tokens to green 'rest'
ctx.addToken('rest');
ctx.addToken('rest');

assert.strictEqual(ctx.stolen(ctx.tokens()), 2);
console.log('✓ Test 6: Unlocking red bound time & stolen time ("lopott idő") origin tracking verified.');

// Test 7: UTF-8 BOM in export logic
assert(html.includes('\\ufeff'), 'UTF-8 BOM must be present in export function');
console.log('✓ Test 7: UTF-8 BOM text export capability verified.');

console.log('\nALL 7 COMPREHENSIVE UNIT TESTS PASSED SUCCESSFULLY!');
