/**
 * Időzseton – local, viewport-independent personal result sheet.
 * Canvas drawings use the same immutable snapshot for PNG and A4 PDF output.
 * No student text is inserted into HTML or sent to a service.
 */
(function (root) {
  'use strict';

  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT = 1123;
  const MARGIN = 44;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const BOTTOM = PAGE_HEIGHT - 65;
  const COLORS = Object.freeze({
    slate: '#344D68', copper: '#A45D32', olive: '#526334', plum: '#795878',
    paper: '#F4F1E9', ink: '#263644', muted: '#5E686F', line: '#D8D4CB',
    lightCopper: '#F1D3B9', bound: '#964A36', white: '#FFFFFF'
  });
  const BODY_FONT = 'Arial, "Liberation Sans", sans-serif';

  function font(context, size, weight) {
    context.font = `${weight || 400} ${size}px ${BODY_FONT}`;
  }

  function graphemes(text) {
    return typeof Intl !== 'undefined' && Intl.Segmenter
      ? Array.from(new Intl.Segmenter('hu', { granularity: 'grapheme' }).segment(text), item => item.segment)
      : Array.from(text);
  }

  /** Wrap arbitrary Unicode text, including a single word wider than the page. */
  function wrapText(context, text, width) {
    if (!(width > 0)) throw new Error('Az eredménylap szövegének szélessége érvénytelen.');
    const lines = [];
    for (const paragraph of String(text).split(/\r\n|\r|\n/)) {
      const words = paragraph.trim().split(/\s+/u).filter(Boolean);
      if (!words.length) {
        lines.push('');
        continue;
      }
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width <= width) {
          line = candidate;
          continue;
        }
        if (line) {
          lines.push(line);
          line = '';
        }
        if (context.measureText(word).width <= width) {
          line = word;
          continue;
        }
        for (const character of graphemes(word)) {
          if (line && context.measureText(line + character).width > width) {
            lines.push(line);
            line = '';
          }
          line += character;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  function validateSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.categories) || snapshot.categories.length !== 12) {
      throw new Error('Az eredménylaphoz mind a 12 időfelhasználási kategória szükséges.');
    }
    const ids = new Set(snapshot.categories.map(category => category.id));
    if (ids.size !== 12 || snapshot.categories.some(category => !/^#[\da-f]{6}$/i.test(category.color))) {
      throw new Error('Az eredménylap kategóriaadatai nem megfelelőek.');
    }
    const complete = list => Array.isArray(list) && list.length === 24 &&
      Array.from(list).every(token => token && ids.has(token.cat));
    if (!complete(snapshot.realTokens) || !complete(snapshot.idealTokens)) {
      throw new Error('Az eredménylaphoz mindkét nap mind a 24 óráját ki kell osztanod.');
    }
  }

  function roundedRect(context, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius || 0, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = 1; context.stroke(); }
  }

  function drawText(context, text, x, y, size, weight, color, align) {
    font(context, size, weight);
    context.fillStyle = color || COLORS.ink;
    context.textAlign = align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(String(text), x, y);
  }

  function drawSwatch(context, category, x, y, size) {
    if (category.group === 'red') {
      roundedRect(context, x, y, size, size, 3, category.color);
    } else {
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      context.fillStyle = category.color;
      context.fill();
    }
    drawText(context, category.symbol, x + size / 2, y + size * 0.73, size * 0.64, 700, COLORS.white, 'center');
  }

  function donutSegment(context, cx, cy, inner, outer, start, end, fill, stroke, dashed) {
    context.beginPath();
    context.arc(cx, cy, outer, start, end);
    context.arc(cx, cy, inner, end, start, true);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke || COLORS.paper;
    context.lineWidth = 1.5;
    if (dashed) context.setLineDash([3, 2]);
    context.stroke();
    context.setLineDash([]);
  }

  function drawWheel(context, categories, tokens, cx, cy) {
    const byId = new Map(categories.map(category => [category.id, category]));
    const ordered = categories.flatMap(category => tokens.filter(token => token.cat === category.id));
    ordered.forEach((token, index) => {
      const category = byId.get(token.cat);
      const start = (index * 15 - 90) * Math.PI / 180;
      const end = start + Math.PI / 12;
      const mid = (start + end) / 2;
      donutSegment(context, cx, cy, 53, 112, start, end, category.color);
      if (category.group === 'red' || (token.source === 'red' && category.group === 'green')) {
        const transferred = token.source === 'red' && category.group === 'green';
        donutSegment(context, cx, cy, transferred ? 101 : 104, 110,
          start + 0.018, end - 0.018, COLORS.bound, COLORS.white, transferred);
      }
      drawText(context, category.symbol, cx + Math.cos(mid) * 88, cy + Math.sin(mid) * 88 + 4,
        12, 700, COLORS.white, 'center');
      drawText(context, index + 1, cx + Math.cos(mid) * 66, cy + Math.sin(mid) * 66 + 3,
        8, 400, COLORS.white, 'center');
    });
    context.beginPath();
    context.arc(cx, cy, 50, 0, Math.PI * 2);
    context.fillStyle = COLORS.slate;
    context.fill();
    context.strokeStyle = COLORS.lightCopper;
    context.lineWidth = 1.5;
    context.stroke();
    drawText(context, '24', cx, cy + 4, 35, 700, COLORS.lightCopper, 'center');
    drawText(context, 'ÓRA', cx, cy + 23, 10, 700, COLORS.white, 'center');
  }

  function newCanvas(scale) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(PAGE_WIDTH * scale);
    canvas.height = Math.round(PAGE_HEIGHT * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('A böngésző nem tudta elkészíteni az eredménylap képét.');
    context.scale(scale, scale);
    context.fillStyle = COLORS.white;
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    return { canvas, context };
  }

  async function renderPages(snapshot, options) {
    validateSnapshot(snapshot);
    const scale = options && options.scale !== undefined ? options.scale : 2;
    if (!Number.isFinite(scale) || scale < 1 || scale > 4) throw new Error('Az export felbontása érvénytelen.');
    // System fonts keep the sheet independent of font CDNs and offline-ready.
    const pages = [];
    let context;
    let y;

    function addPage(first) {
      const page = newCanvas(scale);
      pages.push(page.canvas);
      context = page.context;
      if (first) {
        roundedRect(context, MARGIN, 38, CONTENT_WIDTH, 106, 10, COLORS.slate);
        drawText(context, 'IDŐZSETON', MARGIN + 22, 75, 27, 700, COLORS.white);
        drawText(context, 'Mire költöd az életedet?', MARGIN + 22, 101, 15, 400, COLORS.lightCopper);
        drawText(context, 'Személyes időmérleg – 24 óra', MARGIN + 22, 126, 16, 700, COLORS.white);
        y = 164;
      } else {
        drawText(context, 'IDŐZSETON', MARGIN, 55, 17, 700, COLORS.slate);
        drawText(context, 'Személyes időmérleg – 24 óra', PAGE_WIDTH - MARGIN, 55, 12, 400, COLORS.muted, 'right');
        context.strokeStyle = COLORS.line;
        context.beginPath(); context.moveTo(MARGIN, 69); context.lineTo(PAGE_WIDTH - MARGIN, 69); context.stroke();
        y = 91;
      }
    }

    function ensureSpace(height) {
      if (y + height > BOTTOM) addPage(false);
    }

    function sectionTitle(text, minimumFollowing) {
      ensureSpace(29 + (minimumFollowing || 0));
      drawText(context, text, MARGIN, y + 17, 17, 700, COLORS.slate);
      y += 29;
    }

    function writeLines(lines, size, lineHeight, color, inset) {
      for (const line of lines) {
        ensureSpace(lineHeight);
        drawText(context, line, MARGIN + (inset || 0), y + size, size, 400, color);
        y += lineHeight;
      }
    }

    addPage(true);
    const columnWidth = (CONTENT_WIDTH - 18) / 2;
    const centers = [MARGIN + columnWidth / 2, MARGIN + columnWidth + 18 + columnWidth / 2];
    [
      { heading: 'A valós iskolai napom', tokens: snapshot.realTokens },
      { heading: 'Az én ideális iskolai napom', tokens: snapshot.idealTokens }
    ].forEach((day, index) => {
      roundedRect(context, MARGIN + index * (columnWidth + 18), y, columnWidth, 268, 9, COLORS.paper);
      drawText(context, day.heading, centers[index], y + 24, 14, 700, COLORS.slate, 'center');
      drawWheel(context, snapshot.categories, day.tokens, centers[index], y + 150);
    });
    y += 287;
    sectionTitle('Jelmagyarázat és összehasonlítás', 49);
    roundedRect(context, MARGIN, y, CONTENT_WIDTH, 25, 4, COLORS.slate);
    drawText(context, 'Időfelhasználás', MARGIN + 12, y + 17, 12, 700, COLORS.white);
    const columns = [MARGIN + 450, MARGIN + 557, MARGIN + CONTENT_WIDTH - 15];
    ['Valós nap', 'Ideális nap', 'Eltérés'].forEach((label, index) => {
      drawText(context, label, columns[index], y + 17, 12, 700, COLORS.white, 'right');
    });
    y += 25;
    snapshot.categories.forEach((category, index) => {
      const real = snapshot.realTokens.filter(token => token.cat === category.id).length;
      const ideal = snapshot.idealTokens.filter(token => token.cat === category.id).length;
      const delta = ideal - real;
      if (index % 2 === 0) {
        context.fillStyle = COLORS.paper;
        context.fillRect(MARGIN, y, CONTENT_WIDTH, 23);
      }
      drawSwatch(context, category, MARGIN + 10, y + 3, 17);
      drawText(context, category.name, MARGIN + 37, y + 16, 12.5, 400);
      drawText(context, `${real} ó`, columns[0], y + 16, 12.5, 400, COLORS.ink, 'right');
      drawText(context, `${ideal} ó`, columns[1], y + 16, 12.5, 400, COLORS.ink, 'right');
      drawText(context, `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta)} ó`,
        columns[2], y + 16, 12.5, 700, delta > 0 ? COLORS.olive : delta < 0 ? COLORS.bound : COLORS.muted, 'right');
      y += 23;
    });
    y += 11;
    writeLines(['Szögletes jel: kötött idő · Kör: beosztható idő · Szaggatott szegély: átcsoportosított kötött idő'],
      10, 15, COLORS.muted);
    y += 14;

    sectionTitle('Személyes vállalás', 50);
    drawText(context, 'Mit próbálsz ki a következő iskolai napon?', MARGIN, y + 13, 13, 700, COLORS.ink);
    y += 23;
    font(context, 13);
    const commitment = String(snapshot.commitment || '').trim() || '(nincs megadva)';
    writeLines(wrapText(context, commitment, CONTENT_WIDTH), 13, 19, COLORS.ink);
    y += 19;

    const insights = Array.isArray(snapshot.insights) ? snapshot.insights : [];
    let firstInsightHeight = 24;
    if (insights.length) {
      font(context, 14, 700);
      const firstTitle = wrapText(context, insights[0].title || '', CONTENT_WIDTH - 32);
      font(context, 12, 700);
      const firstVerse = wrapText(context, insights[0].verse || '', CONTENT_WIDTH - 32);
      font(context, 12.5);
      const firstBody = wrapText(context, insights[0].body || '', CONTENT_WIDTH - 32);
      const firstHeading = firstTitle.length * 19 + firstVerse.length * 17 + 29;
      const firstCard = firstHeading + firstBody.length * 18 + 13 + 12;
      // Keep ordinary cards whole and avoid an orphaned section title.
      firstInsightHeight = firstCard + (insights.length === 1 ? 42 : 0);
      if (firstInsightHeight > BOTTOM - 91 - 29) firstInsightHeight = firstHeading + 49;
    }
    sectionTitle('Bibliai iránytű', firstInsightHeight);
    for (const [insightIndex, insight] of insights.entries()) {
      font(context, 14, 700);
      const titleLines = wrapText(context, insight.title || '', CONTENT_WIDTH - 32);
      font(context, 12, 700);
      const verseLines = wrapText(context, insight.verse || '', CONTENT_WIDTH - 32);
      font(context, 12.5);
      const bodyLines = wrapText(context, insight.body || '', CONTENT_WIDTH - 32);
      const wholeCard = titleLines.length * 19 + verseLines.length * 17 + 29 + bodyLines.length * 18 + 13 + 12;
      if (insightIndex === insights.length - 1 && wholeCard + 42 <= BOTTOM - 91) {
        ensureSpace(wholeCard + 42);
      }
      let cursor = 0;
      do {
        const headingHeight = titleLines.length * 19 + verseLines.length * 17 + 29;
        ensureSpace(headingHeight + 36);
        const available = Math.floor((BOTTOM - y - headingHeight - 13) / 18);
        const chunk = bodyLines.slice(cursor, cursor + Math.max(1, available));
        const height = headingHeight + chunk.length * 18 + 13;
        roundedRect(context, MARGIN, y, CONTENT_WIDTH, height, 7, COLORS.paper, COLORS.line);
        let rowY = y + 20;
        titleLines.forEach(line => { drawText(context, line, MARGIN + 16, rowY, 14, 700, COLORS.slate); rowY += 19; });
        rowY += 3;
        verseLines.forEach(line => { drawText(context, line, MARGIN + 16, rowY, 12, 700, COLORS.olive); rowY += 17; });
        rowY += 6;
        chunk.forEach(line => { drawText(context, line, MARGIN + 16, rowY, 12.5, 400, COLORS.ink); rowY += 18; });
        cursor += chunk.length;
        y += height + 12;
        if (cursor < bodyLines.length) addPage(false);
      } while (cursor < bodyLines.length);
    }
    ensureSpace(42);
    y += 11;
    drawText(context, 'A két időkerék nem erkölcsi osztályzat.', MARGIN, y + 15, 14, 700, COLORS.slate);

    // Add the final page count only after pagination is complete.
    pages.forEach((canvas, index) => {
      const pageContext = canvas.getContext('2d');
      pageContext.save();
      pageContext.strokeStyle = COLORS.line;
      pageContext.beginPath(); pageContext.moveTo(MARGIN, PAGE_HEIGHT - 43); pageContext.lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 43); pageContext.stroke();
      drawText(pageContext, 'IDŐZSETON · Személyes eredménylap', MARGIN, PAGE_HEIGHT - 25, 10, 400, COLORS.muted);
      drawText(pageContext, `${index + 1} / ${pages.length}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 25, 10, 400, COLORS.muted, 'right');
      pageContext.restore();
    });
    return pages;
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('A böngésző nem tudta PNG-képként menteni az eredménylapot.')), 'image/png');
    });
  }

  async function toPNG(pages) {
    if (!Array.isArray(pages) || !pages.length) throw new Error('Nincs menthető eredménylap.');
    const width = pages[0].width;
    const height = pages.reduce((sum, page) => sum + page.height, 0);
    if (!width || !height || pages.some(page => page.width !== width)) throw new Error('Az eredménylap lapméretei nem megfelelőek.');
    // Keep long sheets within common mobile canvas limits; never silently cut text.
    const factor = Math.min(1, 16384 / height, Math.sqrt(16000000 / (width * height)));
    const outputWidth = Math.floor(width * factor);
    if (outputWidth < PAGE_WIDTH) {
      throw new Error('Ez a hosszú eredménylap már nem fér el egy jól olvasható PNG-képen. Válaszd a többoldalas PDF-et vagy a részletes TXT-t.');
    }
    const canvas = document.createElement('canvas');
    try {
      canvas.width = outputWidth;
      canvas.height = Math.round(height * factor);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Nincs elegendő memória a PNG-kép elkészítéséhez. Próbáld a PDF-letöltést.');
      context.fillStyle = COLORS.white;
      context.fillRect(0, 0, canvas.width, canvas.height);
      let offset = 0;
      for (const page of pages) {
        const top = Math.round(offset * factor);
        const next = Math.round((offset + page.height) * factor);
        context.drawImage(page, 0, top, canvas.width, next - top);
        offset += page.height;
      }
      return await canvasBlob(canvas);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  const api = Object.freeze({ renderPages, toPNG, wrapText, PAGE_WIDTH, PAGE_HEIGHT });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ResultSheet = api;
})(typeof window !== 'undefined' ? window : globalThis);
