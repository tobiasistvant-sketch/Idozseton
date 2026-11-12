/*
 * Local, dependency-free A4 PDF output for the rendered result-sheet pages.
 * Text is already rasterized by Canvas, so Hungarian accents need no embedded
 * font or external service. The resulting PDF is image based, not searchable.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PDFExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  function dimensions(width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) ||
        width < 1 || height < 1 || width > 65535 || height > 65535) {
      throw new Error('A PDF-oldal képmérete érvénytelen.');
    }
  }

  // Check the JPEG frame before declaring an RGB DCT image in the PDF.
  function checkJPEG(bytes, width, height) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 4 ||
        bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
        bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
      throw new Error('A PDF-hez érvényes JPEG-oldalkép szükséges.');
    }

    let offset = 2;
    let frameFound = false;
    while (offset < bytes.length - 2) {
      if (bytes[offset++] !== 0xff) break;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = bytes[offset] * 256 + bytes[offset + 1];
      const end = offset + length;
      if (length < 2 || end > bytes.length - 2) break;

      if (marker === 0xda) {
        if (frameFound && end < bytes.length - 2) return;
        break;
      }

      // Baseline, extended sequential and progressive 8-bit DCT frames.
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        if (length !== 17 || bytes[offset + 2] !== 8 || bytes[offset + 7] !== 3) {
          throw new Error('A PDF RGB, 8 bites JPEG-oldalképet igényel.');
        }
        const actualHeight = bytes[offset + 3] * 256 + bytes[offset + 4];
        const actualWidth = bytes[offset + 5] * 256 + bytes[offset + 6];
        if (actualWidth !== width || actualHeight !== height) {
          throw new Error('A JPEG-oldalkép mérete nem egyezik a megadott mérettel.');
        }
        frameFound = true;
      }
      offset = end;
    }
    throw new Error('A JPEG-oldalkép sérült vagy nem támogatott.');
  }

  function ascii(text) {
    const result = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) result[i] = text.charCodeAt(i);
    return result;
  }

  function buildPDF(jpegPages) {
    if (!Array.isArray(jpegPages) || jpegPages.length === 0) {
      throw new Error('A PDF elkészítéséhez legalább egy eredményoldal szükséges.');
    }
    const pages = Array.from(jpegPages, page => {
      if (!page) throw new Error('Hiányzó PDF-oldal.');
      dimensions(page.width, page.height);
      checkJPEG(page.bytes, page.width, page.height);
      return page;
    });

    const chunks = [];
    const offsets = [0];
    let size = 0;
    const add = data => {
      const bytes = typeof data === 'string' ? ascii(data) : data;
      chunks.push(bytes);
      size += bytes.length;
    };
    const object = (id, contents) => {
      offsets[id] = size;
      add(`${id} 0 obj\n`);
      add(contents);
      add('\nendobj\n');
    };

    add('%PDF-1.4\n');
    add(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    object(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);

    pages.forEach((page, i) => {
      const pageId = 3 + i * 3;
      const imageId = pageId + 1;
      const contentId = pageId + 2;
      object(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH} ${A4_HEIGHT}] /Resources << /XObject << /Im1 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);

      offsets[imageId] = size;
      add(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);
      add(page.bytes);
      add('\nendstream\nendobj\n');

      const commands = `q\n${A4_WIDTH} 0 0 ${A4_HEIGHT} 0 0 cm\n/Im1 Do\nQ\n`;
      object(contentId, `<< /Length ${commands.length} >>\nstream\n${commands}endstream`);
    });

    const xref = size;
    const count = 3 + pages.length * 3;
    add(`xref\n0 ${count}\n0000000000 65535 f \n`);
    for (let id = 1; id < count; id++) {
      add(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    }
    add(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

    const result = new Uint8Array(size);
    let cursor = 0;
    for (const chunk of chunks) {
      result.set(chunk, cursor);
      cursor += chunk.length;
    }
    return result;
  }

  function canvasJPEG(canvas) {
    return new Promise((resolve, reject) => {
      if (!canvas || typeof canvas.toBlob !== 'function') {
        reject(new Error('A böngésző nem tudja elkészíteni a PDF-oldalképet.'));
        return;
      }
      dimensions(canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      canvas.toBlob(async blob => {
        try {
          if (!blob || blob.type !== 'image/jpeg') {
            throw new Error('Nem sikerült a PDF-oldalkép elkészítése.');
          }
          resolve({ bytes: new Uint8Array(await blob.arrayBuffer()), width, height });
        } catch (error) {
          reject(error);
        }
      }, 'image/jpeg', 0.95);
    });
  }

  async function fromCanvases(canvases) {
    if (!Array.isArray(canvases) || canvases.length === 0) {
      throw new Error('A PDF elkészítéséhez legalább egy eredményoldal szükséges.');
    }
    // Sequential encoding bounds temporary memory for longer answers.
    const pages = [];
    for (const canvas of canvases) pages.push(await canvasJPEG(canvas));
    return new Blob([buildPDF(pages)], { type: 'application/pdf' });
  }

  return { buildPDF, fromCanvases };
});
