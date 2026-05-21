import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FONT_PATH = path.join(MODULE_DIR, 'assets', 'Anton-Regular.ttf');
const DEFAULT_FONT_NAME = 'Anton';

const DEFAULTS = {
  topText: '',
  bottomText: '',
  uppercase: true,
  fontPath: DEFAULT_FONT_PATH,
  fontFamily: DEFAULT_FONT_NAME,
  textColor: 'auto',
  strokeColor: 'auto',
  strokeWidthRatio: 0.075,
  shadow: true,
  paddingRatio: 0.045,
  captionHeightRatio: 0.25,
  fontSizeRatio: 0.145,
  minFontSizeRatio: 0.018,
  lineHeight: 0.92,
  format: 'png',
  quality: 92,
  autoColorThreshold: 150
};

const SUPPORTED_FORMATS = new Set(['png', 'jpeg', 'jpg', 'webp']);

export async function generateMeme(options) {
  const result = await renderMeme(options);
  return result.buffer;
}

export async function generateMemeFile(options) {
  const output = options?.output ?? options?.out;
  if (!output) {
    throw new Error('generateMemeFile requires output or out path.');
  }

  const result = await renderMeme(options);
  await mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await writeFile(output, result.buffer);

  return {
    ...result,
    output
  };
}

export async function renderMeme(options = {}) {
  const settings = normalizeOptions(options);
  settings.font = await loadFont(settings.fontPath);
  const background = await loadBackground(settings.background);
  const normalizedImage = await sharp(background).rotate().toBuffer();
  const metadata = await sharp(normalizedImage).metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error('Background image has no readable width/height.');
  }

  const raw = await sharp(normalizedImage)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const overlay = createMemeSvg({
    width,
    height,
    raw,
    settings
  });

  const pipeline = sharp(normalizedImage).composite([
    {
      input: Buffer.from(overlay),
      top: 0,
      left: 0
    }
  ]);

  const format = settings.format === 'jpg' ? 'jpeg' : settings.format;
  const buffer = await encodeImage(pipeline, format, settings.quality);

  return {
    buffer,
    width,
    height,
    format,
    top: layoutCaption({
      text: settings.topText,
      zone: getCaptionZones(width, height, settings).top,
      settings
    }),
    bottom: layoutCaption({
      text: settings.bottomText,
      zone: getCaptionZones(width, height, settings).bottom,
      settings
    })
  };
}

export function layoutMemeText(options = {}) {
  const settings = normalizeOptions({
    ...options,
    background: options.background ?? Buffer.from([0])
  }, { skipBackground: true });
  const width = positiveNumber(options.width, 'width');
  const height = positiveNumber(options.height, 'height');
  const zones = getCaptionZones(width, height, settings);

  return {
    width,
    height,
    top: layoutCaption({ text: settings.topText, zone: zones.top, settings }),
    bottom: layoutCaption({ text: settings.bottomText, zone: zones.bottom, settings })
  };
}

function normalizeOptions(options, flags = {}) {
  const settings = {
    ...DEFAULTS,
    ...options,
    topText: options.topText ?? options.top ?? DEFAULTS.topText,
    bottomText: options.bottomText ?? options.bottom ?? DEFAULTS.bottomText,
    background: options.background ?? options.image ?? options.input
  };

  if (!flags.skipBackground && !settings.background) {
    throw new Error('Background image is required. Use background, image, or input.');
  }

  settings.format = String(settings.format ?? DEFAULTS.format).toLowerCase();
  if (!SUPPORTED_FORMATS.has(settings.format)) {
    throw new Error(`Unsupported format "${settings.format}". Use png, jpeg, jpg, or webp.`);
  }

  settings.quality = clampNumber(settings.quality, 1, 100, DEFAULTS.quality);
  settings.fontPath = settings.fontPath ?? DEFAULTS.fontPath;
  settings.fontFamily = settings.fontFamily || DEFAULTS.fontFamily;
  settings.paddingRatio = clampNumber(settings.paddingRatio, 0, 0.2, DEFAULTS.paddingRatio);
  settings.captionHeightRatio = clampNumber(settings.captionHeightRatio, 0.08, 0.48, DEFAULTS.captionHeightRatio);
  settings.fontSizeRatio = clampNumber(settings.fontSizeRatio, 0.03, 0.3, DEFAULTS.fontSizeRatio);
  settings.minFontSizeRatio = clampNumber(settings.minFontSizeRatio, 0.004, 0.08, DEFAULTS.minFontSizeRatio);
  settings.strokeWidthRatio = clampNumber(settings.strokeWidthRatio, 0, 0.2, DEFAULTS.strokeWidthRatio);
  settings.lineHeight = clampNumber(settings.lineHeight, 0.75, 1.5, DEFAULTS.lineHeight);
  settings.autoColorThreshold = clampNumber(settings.autoColorThreshold, 1, 254, DEFAULTS.autoColorThreshold);

  return settings;
}

async function loadBackground(background) {
  if (Buffer.isBuffer(background)) return background;
  if (background instanceof Uint8Array) return Buffer.from(background);
  if (typeof background === 'string') return readFile(background);
  throw new Error('Background must be a file path, Buffer, or Uint8Array.');
}

async function loadFont(fontPath) {
  if (fontPath === false || fontPath === null) return null;

  const fontBuffer = Buffer.isBuffer(fontPath) || fontPath instanceof Uint8Array
    ? Buffer.from(fontPath)
    : await readFile(fontPath);
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );

  return opentype.parse(arrayBuffer);
}

async function encodeImage(pipeline, format, quality) {
  if (format === 'jpeg') return pipeline.jpeg({ quality }).toBuffer();
  if (format === 'webp') return pipeline.webp({ quality }).toBuffer();
  return pipeline.png().toBuffer();
}

function createMemeSvg({ width, height, raw, settings }) {
  const zones = getCaptionZones(width, height, settings);
  const top = buildCaptionSvg({
    text: settings.topText,
    zone: zones.top,
    position: 'top',
    raw,
    settings
  });
  const bottom = buildCaptionSvg({
    text: settings.bottomText,
    zone: zones.bottom,
    position: 'bottom',
    raw,
    settings
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="memeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${formatNumber(Math.max(1, width * 0.003))}" stdDeviation="${formatNumber(Math.max(1, width * 0.004))}" flood-color="#000000" flood-opacity="0.48"/>
    </filter>
  </defs>
  ${top}
  ${bottom}
</svg>`;
}

function buildCaptionSvg({ text, zone, position, raw, settings }) {
  const layout = layoutCaption({ text, zone, settings });
  if (!layout.text) return '';

  const colors = resolveCaptionColors({ zone, raw, settings });
  const shadow = settings.shadow ? ' filter="url(#memeShadow)"' : '';
  const strokeWidth = Math.max(0, layout.fontSize * settings.strokeWidthRatio);
  const yStart = zone.y + (zone.height - layout.blockHeight) / 2 + layout.fontSize * 0.82;

  if (!settings.font) {
    const tspans = layout.lines.map((line, index) => {
      const y = yStart + index * layout.lineHeightPx;
      return `<tspan x="${formatNumber(zone.x + zone.width / 2)}" y="${formatNumber(y)}">${escapeXml(line)}</tspan>`;
    }).join('');

    return `<text data-position="${position}"
        font-family="${escapeXml(settings.fontFamily)}"
        font-size="${formatNumber(layout.fontSize)}"
        text-anchor="middle"
        fill="${escapeXml(colors.fill)}"
        stroke="${escapeXml(colors.stroke)}"
        stroke-width="${formatNumber(strokeWidth)}"
        stroke-linejoin="round"
        paint-order="stroke fill"${shadow}>${tspans}</text>`;
  }

  const paths = layout.lines.map((line, index) => {
    const y = yStart + index * layout.lineHeightPx;
    const lineWidth = measureText(line, layout.fontSize, settings);
    const x = zone.x + (zone.width - lineWidth) / 2;
    const glyphPath = settings.font.getPath(line, x, y, layout.fontSize);
    return `<path d="${glyphPath.toPathData(2)}"/>`;
  }).join('');

  return `<g data-position="${position}"
        fill="${escapeXml(colors.fill)}"
        stroke="${escapeXml(colors.stroke)}"
        stroke-width="${formatNumber(strokeWidth)}"
        stroke-linejoin="round"
        paint-order="stroke fill"${shadow}>${paths}</g>`;
}

function getCaptionZones(width, height, settings) {
  const padding = Math.round(Math.min(width, height) * settings.paddingRatio);
  const zoneHeight = Math.round(height * settings.captionHeightRatio);
  const zoneWidth = Math.max(1, width - padding * 2);

  return {
    top: {
      x: padding,
      y: padding,
      width: zoneWidth,
      height: Math.max(1, zoneHeight)
    },
    bottom: {
      x: padding,
      y: Math.max(padding, height - padding - zoneHeight),
      width: zoneWidth,
      height: Math.max(1, zoneHeight)
    }
  };
}

function layoutCaption({ text, zone, settings }) {
  const normalized = normalizeText(text, settings.uppercase);
  if (!normalized) {
    return {
      text: '',
      lines: [],
      fontSize: 0,
      lineHeightPx: 0,
      blockHeight: 0,
      maxLineWidth: 0,
      zone
    };
  }

  const base = Math.min(zone.width, zone.height * 2.2);
  const maxFontSize = Math.max(4, Math.floor(base * settings.fontSizeRatio * 2.2));
  const minFontSize = Math.max(4, Math.floor(Math.min(zone.width, zone.height) * settings.minFontSizeRatio));
  let low = Math.min(minFontSize, maxFontSize);
  let high = Math.max(minFontSize, maxFontSize);
  let best = makeCaptionLayout(normalized, zone, low, settings);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = makeCaptionLayout(normalized, zone, mid, settings);

    if (candidate.fits) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    text: normalized,
    lines: best.lines,
    fontSize: best.fontSize,
    lineHeightPx: best.lineHeightPx,
    blockHeight: best.blockHeight,
    maxLineWidth: best.maxLineWidth,
    zone
  };
}

function makeCaptionLayout(text, zone, fontSize, settings) {
  const lines = wrapText(text, zone.width, fontSize, settings);
  const lineHeightPx = fontSize * settings.lineHeight;
  const blockHeight = lines.length * lineHeightPx;
  const maxLineWidth = lines.reduce((max, line) => {
    return Math.max(max, measureText(line, fontSize, settings));
  }, 0);

  return {
    lines,
    fontSize,
    lineHeightPx,
    blockHeight,
    maxLineWidth,
    fits: maxLineWidth <= zone.width && blockHeight <= zone.height
  };
}

function wrapText(text, maxWidth, fontSize, settings) {
  const lines = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (measureText(next, fontSize, settings) <= maxWidth) {
        current = next;
        continue;
      }

      if (current) {
        lines.push(current);
        current = '';
      }

      if (measureText(word, fontSize, settings) <= maxWidth) {
        current = word;
        continue;
      }

      const chunks = splitLongWord(word, maxWidth, fontSize, settings);
      lines.push(...chunks.slice(0, -1));
      current = chunks.at(-1) ?? '';
    }

    if (current) lines.push(current);
  }

  return lines.filter((line, index) => line || index === 0);
}

function splitLongWord(word, maxWidth, fontSize, settings) {
  const chunks = [];
  let current = '';

  for (const char of word) {
    const next = current + char;
    if (!current || measureText(next, fontSize, settings) <= maxWidth) {
      current = next;
      continue;
    }

    chunks.push(current);
    current = char;
  }

  if (current) chunks.push(current);
  return chunks;
}

function measureText(text, fontSize, settings) {
  if (settings?.font) {
    return settings.font.getAdvanceWidth(String(text), fontSize);
  }

  let units = 0;

  for (const char of String(text)) {
    units += charWidthUnit(char);
  }

  return units * fontSize * 1.08;
}

function charWidthUnit(char) {
  if (/\s/.test(char)) return 0.34;
  if (/[ilI.,'!:;|]/.test(char)) return 0.34;
  if (/[fjrt()\[\]{}]/.test(char)) return 0.46;
  if (/[mwMW@#%&]/.test(char)) return 0.92;
  if (/[A-Z0-9]/.test(char)) return 0.66;
  if (char.codePointAt(0) > 0x2e7f) return 1;
  return 0.58;
}

function resolveCaptionColors({ zone, raw, settings }) {
  if (settings.textColor !== 'auto') {
    return {
      fill: settings.textColor,
      stroke: settings.strokeColor === 'auto' ? oppositeColor(settings.textColor) : settings.strokeColor
    };
  }

  const luminance = averageLuminance(raw, zone);
  const fill = luminance < settings.autoColorThreshold ? '#ffffff' : '#000000';
  const stroke = settings.strokeColor === 'auto' ? oppositeColor(fill) : settings.strokeColor;

  return { fill, stroke };
}

function averageLuminance(raw, zone) {
  const { data, info } = raw;
  const channels = info.channels;
  const xStart = Math.max(0, Math.floor(zone.x));
  const yStart = Math.max(0, Math.floor(zone.y));
  const xEnd = Math.min(info.width, Math.ceil(zone.x + zone.width));
  const yEnd = Math.min(info.height, Math.ceil(zone.y + zone.height));
  const sampleStep = Math.max(1, Math.floor(Math.sqrt(((xEnd - xStart) * (yEnd - yStart)) / 1200)));
  let total = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y += sampleStep) {
    for (let x = xStart; x < xEnd; x += sampleStep) {
      const index = (y * info.width + x) * channels;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      total += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      count += 1;
    }
  }

  return count ? total / count : 255;
}

function oppositeColor(color) {
  if (String(color).toLowerCase() === '#000000' || String(color).toLowerCase() === 'black') {
    return '#ffffff';
  }
  return '#000000';
}

function normalizeText(text, uppercase) {
  const value = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .join('\n')
    .trim();

  return uppercase ? value.toUpperCase() : value;
}

function positiveNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return number;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatNumber(value) {
  return Number.parseFloat(Number(value).toFixed(3)).toString();
}
