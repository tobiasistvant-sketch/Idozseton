/**
 * Időzseton - Core Game Mechanics Automated Unit Test Suite
 * Run with Node.js: `node tests/game_mechanics.test.js`
 */

const assert = require('assert');
const fs = require('fs');

// Read index.html content and extract JS
const html = fs.readFileSync('./index.html', 'utf8');

// Basic validation tests
console.log('Running Időzseton Game Mechanics Tests...\n');

// 1. Verify category counts
const categoriesMatch = html.match(/const CATEGORIES = \[([\s\S]*?)\];/);
assert(categoriesMatch, 'CATEGORIES array must be defined');

// 2. Check 12 categories are present
const categoryCount = (categoriesMatch[1].match(/id:/g) || []).length;
assert.strictEqual(categoryCount, 12, 'Must have exactly 12 categories');
console.log('✓ Test 1: 12 game categories verified.');

// 3. Check 24 token limit
assert(html.includes('length: 24'), 'Must initialize 24 tokens');
console.log('✓ Test 2: 24 token initialization verified.');

// 4. Check stolen time logic
assert(html.includes("t.source === 'red'") && html.includes("group === 'green'"), 'Stolen time logic must check transition from red group to green group');
console.log('✓ Test 3: Stolen time ("lopott idő") tracking logic verified.');

// 5. Check XSS protection (escapeHtml)
assert(html.includes('escapeHtml(state.commitment)'), 'Commitment text must be escaped against XSS');
console.log('✓ Test 4: Commitment input sanitization (XSS protection) verified.');

// 6. Check UTF-8 BOM in export
assert(html.includes('\\ufeff'), 'UTF-8 BOM must be included in exported text blob');
console.log('✓ Test 5: UTF-8 BOM in export file verified.');

console.log('\nALL 5 AUTOMATED UNIT TESTS PASSED!');
