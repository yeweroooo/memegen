import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { generateMemeFile } from '../index.js';

await mkdir('output', { recursive: true });

const backgroundSvg = `
<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="600" fill="#ffffff"/>
  <rect y="370" width="600" height="230" fill="#f0f2f4"/>
  <circle cx="135" cy="170" r="78" fill="#31343a"/>
  <circle cx="455" cy="310" r="104" fill="#d8a334"/>
  <path d="M0 430 C120 365 210 475 325 408 C440 340 492 410 600 372 L600 600 L0 600 Z" fill="#2f645f"/>
</svg>`;

const background = await sharp(Buffer.from(backgroundSvg)).png().toBuffer();

await generateMemeFile({
  background,
  output: 'output/demo-meme.png',
  topText: 'wowowo',
  bottomText: 'bising bodo aku nak tido',
  textColor: '#ffffff',
  strokeColor: '#000000'
});

console.log('OK: output/demo-meme.png');
