#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { generateMemeFile } from './index.js';

function printHelp() {
  console.log(`
Meme Generator Sharp Module

Usage:
  node cli.js --image background.jpg --top "WHEN THE BUILD PASSES" --bottom "ON THE FIRST TRY" --out output/meme.png

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
  const { values: cliOptions } = parseArgs({
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

  if (cliOptions.help) {
    printHelp();
    return;
  }

  const input = cliOptions.image ?? cliOptions.input;
  if (!input) {
    printHelp();
    throw new Error('Missing --image or --input.');
  }

  const output = cliOptions.out;
  const inferredFormat = output.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase();

  const result = await generateMemeFile({
    input,
    output,
    topText: cliOptions.top,
    bottomText: cliOptions.bottom,
    format: cliOptions.format ?? inferredFormat ?? 'png',
    textColor: cliOptions['text-color'],
    strokeColor: cliOptions['stroke-color'],
    fontPath: cliOptions.font,
    fontSizeRatio: cliOptions['font-ratio'] === undefined ? undefined : Number(cliOptions['font-ratio']),
    captionHeightRatio: cliOptions['caption-ratio'] === undefined ? undefined : Number(cliOptions['caption-ratio']),
    uppercase: !cliOptions['no-caps'],
    shadow: !cliOptions['no-shadow']
  });

  console.log(`OK: ${result.output}`);
  console.log(`Size: ${result.width}x${result.height}`);
  console.log(`Top lines: ${result.top.lines.length} | Bottom lines: ${result.bottom.lines.length}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
