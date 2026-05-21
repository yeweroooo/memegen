#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { generateMemeFile } from './index.js';

function printHelp() {
  console.log(`
Meme Generator Sharp Module

Usage:
  node cli.js --image background.jpg --top "WOWOWO" --bottom "BISING BODO AKU" --out output/meme.png

Options:
  --image <file>       Background image. Alias: --input.
  --top <text>         Top text.
  --bottom <text>      Bottom text.
  --out <file>         Output file. Default: output/meme.png.
  --format <format>    png, jpg, jpeg, or webp. Default: inferred from --out or png.
  --text-color <hex>   Text color, or auto. Default: auto.
  --stroke-color <hex> Stroke color, or auto. Default: auto.
  --font <file>        TTF/OTF font path. Default: bundled Anton.
  --font-ratio <num>   Text size ratio. Default: 0.145.
  --caption-ratio <n>  Top/bottom text box height ratio. Default: 0.25.
  --no-caps            Keep original letter casing.
  --no-shadow          Disable subtle shadow.
  --help               Show this help.
`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      image: { type: 'string' },
      input: { type: 'string' },
      top: { type: 'string', default: '' },
      bottom: { type: 'string', default: '' },
      out: { type: 'string', default: 'output/meme.png' },
      format: { type: 'string' },
      'text-color': { type: 'string', default: 'auto' },
      'stroke-color': { type: 'string', default: 'auto' },
      font: { type: 'string' },
      'font-ratio': { type: 'string' },
      'caption-ratio': { type: 'string' },
      'no-caps': { type: 'boolean', default: false },
      'no-shadow': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false }
    }
  });

  if (values.help) {
    printHelp();
    return;
  }

  const input = values.image ?? values.input;
  if (!input) {
    printHelp();
    throw new Error('Missing --image or --input.');
  }

  const output = values.out;
  const inferredFormat = output.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase();

  const result = await generateMemeFile({
    input,
    output,
    topText: values.top,
    bottomText: values.bottom,
    format: values.format ?? inferredFormat ?? 'png',
    textColor: values['text-color'],
    strokeColor: values['stroke-color'],
    fontPath: values.font,
    fontSizeRatio: values['font-ratio'] === undefined ? undefined : Number(values['font-ratio']),
    captionHeightRatio: values['caption-ratio'] === undefined ? undefined : Number(values['caption-ratio']),
    uppercase: !values['no-caps'],
    shadow: !values['no-shadow']
  });

  console.log(`OK: ${result.output}`);
  console.log(`Size: ${result.width}x${result.height}`);
  console.log(`Top lines: ${result.top.lines.length} | Bottom lines: ${result.bottom.lines.length}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
