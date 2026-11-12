/** Run with Node.js: node tests/pdf_export.test.js */
'use strict';

const assert = require('node:assert/strict');
const { buildPDF, fromCanvases } = require('../js/pdf-export.js');

// A real RGB 2x3 JPEG. Binary bytes include values outside the ASCII range.
const jpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAADAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4jooor9IPgz//2Q==',
  'base64'
);
const page = () => ({ bytes: jpeg, width: 2, height: 3 });

function inspect(bytes, expectedPages) {
  assert.ok(bytes instanceof Uint8Array);
  const buffer = Buffer.from(bytes);
  const text = buffer.toString('latin1');
  assert.equal(text.slice(0, 9), '%PDF-1.4\n');
  assert.ok(text.endsWith('%%EOF\n'));
  const xrefOffset = Number(text.match(/startxref\n(\d+)\n%%EOF\n$/)[1]);
  assert.equal(text.slice(xrefOffset, xrefOffset + 5), 'xref\n');
  const lines = text.slice(xrefOffset).split('\n');
  const objectCount = 3 + expectedPages * 3;
  assert.equal(lines[1], `0 ${objectCount}`);
  assert.equal(lines[2], '0000000000 65535 f ');
  const offsets = [];
  for (let id = 1; id < objectCount; id++) {
    assert.match(lines[id + 2], /^\d{10} 00000 n $/);
    const offset = Number(lines[id + 2].slice(0, 10));
    offsets[id] = offset;
    assert.equal(text.slice(offset, offset + `${id} 0 obj\n`.length), `${id} 0 obj\n`);
    if (id > 1) assert.ok(offset > offsets[id - 1]);
  }
  const pageTree = text.slice(offsets[2], text.indexOf('endobj', offsets[2]));
  assert.match(pageTree, new RegExp(`/Count ${expectedPages}\\b`));
  assert.equal((text.match(/\/Type \/Page\b/g) || []).length, expectedPages);
  assert.equal((text.match(/\/Subtype \/Image\b/g) || []).length, expectedPages);
  assert.equal((text.match(/\/MediaBox \[0 0 595\.28 841\.89\]/g) || []).length, expectedPages);
  for (let i = 0; i < expectedPages; i++) {
    const id = 3 + i * 3;
    assert.ok(pageTree.includes(`${id} 0 R`));
    const pageObject = text.slice(offsets[id], text.indexOf('endobj', offsets[id]));
    assert.ok(pageObject.includes(`/Im1 ${id + 1} 0 R`));
    assert.ok(pageObject.includes(`/Contents ${id + 2} 0 R`));
    const imageStart = text.indexOf('stream\n', offsets[id + 1]) + 7;
    const imageHeader = text.slice(offsets[id + 1], imageStart);
    assert.match(imageHeader, /\/ColorSpace \/DeviceRGB/);
    assert.match(imageHeader, /\/Filter \/DCTDecode/);
    assert.ok(imageHeader.includes(`/Length ${jpeg.length}`));
    assert.deepEqual(buffer.subarray(imageStart, imageStart + jpeg.length), jpeg);
    assert.equal(text.slice(imageStart + jpeg.length, imageStart + jpeg.length + 11), '\nendstream\n');
    const contentStart = text.indexOf('stream\n', offsets[id + 2]) + 7;
    const contentLength = Number(text.slice(offsets[id + 2], contentStart).match(/\/Length (\d+)/)[1]);
    const content = text.slice(contentStart, contentStart + contentLength);
    assert.equal(content, 'q\n595.28 0 0 841.89 0 0 cm\n/Im1 Do\nQ\n');
    assert.equal(text.slice(contentStart + contentLength, contentStart + contentLength + 9), 'endstream');
  }
  return buffer;
}

async function main() {
  inspect(buildPDF([page()]), 1);
  console.log('✓ Egyoldalas A4 PDF: objektumok, lapméret, JPEG és tartalomfolyam helyes.');

  inspect(buildPDF([page(), page(), page()]), 3);
  console.log('✓ Többoldalas PDF: lapszám, oldalsorrend és bináris xref-eltolások helyesek.');

  const original = Buffer.from(jpeg);
  assert.deepEqual(buildPDF([page()]), buildPDF([page()]));
  assert.deepEqual(jpeg, original);
  console.log('✓ Determinisztikus kimenet; a bemeneti képadatok változatlanok.');

  for (const invalid of [null, [], {}, [null], new Array(1)]) {
    assert.throws(() => buildPDF(invalid));
  }
  for (const value of [0, -1, NaN, Infinity, 1.5, 65536, '2']) {
    assert.throws(() => buildPDF([{ ...page(), width: value }]), /képmérete/);
    assert.throws(() => buildPDF([{ ...page(), height: value }]), /képmérete/);
  }
  assert.throws(() => buildPDF([{ ...page(), bytes: 'not JPEG' }]), /JPEG/);
  assert.throws(() => buildPDF([{ ...page(), bytes: new Uint8Array([255, 216, 255, 217]) }]), /sérült/);
  assert.throws(() => buildPDF([{ ...page(), width: 3 }]), /nem egyezik/);
  const truncated = jpeg.subarray(0, jpeg.length - 2);
  assert.throws(() => buildPDF([{ ...page(), bytes: truncated }]), /JPEG/);
  const wrongPrecision = Buffer.from(jpeg);
  const frame = wrongPrecision.indexOf(Buffer.from([255, 192]));
  assert.ok(frame > 0);
  wrongPrecision[frame + 4] = 12;
  assert.throws(() => buildPDF([{ ...page(), bytes: wrongPrecision }]), /8 bites/);
  console.log('✓ Hiányos oldalak, hibás méretek és hibás/nem támogatott JPEG-ek elutasítva.');

  let active = 0;
  let maxActive = 0;
  const canvas = {
    width: 2,
    height: 3,
    toBlob(callback, type, quality) {
      assert.equal(type, 'image/jpeg');
      assert.equal(quality, 0.95);
      maxActive = Math.max(maxActive, ++active);
      queueMicrotask(() => {
        active--;
        callback(new Blob([jpeg], { type: 'image/jpeg' }));
      });
    }
  };
  const blob = await fromCanvases([canvas, canvas]);
  assert.equal(blob.type, 'application/pdf');
  inspect(new Uint8Array(await blob.arrayBuffer()), 2);
  assert.equal(maxActive, 1);
  console.log('✓ Canvas→PDF: helyes MIME-típus, JPEG-minőség és soros oldalkódolás.');

  await assert.rejects(fromCanvases([]), /legalább egy/);
  await assert.rejects(fromCanvases([{}]), /böngésző/);
  await assert.rejects(fromCanvases(new Array(1)), /böngésző/);
  await assert.rejects(fromCanvases([{ ...canvas, width: 0 }]), /képmérete/);
  await assert.rejects(fromCanvases([{ ...canvas, toBlob(callback) { callback(null); } }]), /Nem sikerült/);
  await assert.rejects(fromCanvases([{ ...canvas, toBlob(callback) { callback(new Blob(['x'], { type: 'image/png' })); } }]), /Nem sikerült/);
  await assert.rejects(fromCanvases([{ ...canvas, toBlob() { throw new Error('SecurityError'); } }]), /SecurityError/);
  console.log('✓ Canvas-hibák és sikertelen képkódolás kezelhető hibaként továbbadva.');

  console.log('ALL 6 PDF EXPORT TEST GROUPS PASSED.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
