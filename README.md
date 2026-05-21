# Memegen

A JavaScript module for creating memes with [Sharp](https://sharp.pixelplumbing.com/), automatic text wrapping, shrink-to-fit captions, and a bundled meme-style font.

Memegen takes a background image, keeps the original image size, and draws top and bottom captions that stay inside the image bounds. It works as an ESM module and as a command-line tool.

## Features

- Keeps the output size equal to the background image size.
- Supports top and bottom caption text.
- Automatically wraps long text.
- Automatically shrinks text until it fits the caption area.
- Can choose readable text color from the background (`textColor: 'auto'`).
- Classic meme outline and subtle shadow.
- Bundled Anton font from Google Fonts, so servers do not need system fonts installed.
- Outputs `png`, `jpg/jpeg`, or `webp`.
- Usable from code or from the CLI.

## Installation

From npm:

```bash
npm install memegen
```

From a local clone:

```bash
git clone <repo-url>
cd memegen
npm install
```

## Quick Start

```js
import { generateMemeFile } from 'memegen';

await generateMemeFile({
  input: 'background.jpg',
  output: 'output/meme.png',
  topText: 'WHEN THE CODE WORKS',
  bottomText: 'BUT YOU DO NOT KNOW WHY'
});
```

The output image will use the original dimensions of `background.jpg`.

## Return a Buffer

```js
import { readFile } from 'node:fs/promises';
import { generateMeme } from 'memegen';

const background = await readFile('background.jpg');

const memeBuffer = await generateMeme({
  background,
  topText: 'TOP TEXT',
  bottomText: 'BOTTOM TEXT',
  format: 'png'
});
```

You can send the returned `Buffer` directly from an API route, bot, or serverless function.

## CLI

```bash
npx memegen \
  --image background.jpg \
  --top "WHEN THE BUILD PASSES" \
  --bottom "ON THE FIRST TRY" \
  --out output/meme.png
```

From a local checkout:

```bash
node cli.js \
  --image background.jpg \
  --top "WHEN THE BUILD PASSES" \
  --bottom "ON THE FIRST TRY" \
  --out output/meme.png
```

## API

### `generateMemeFile(options)`

Renders a meme and writes it to disk.

```js
const result = await generateMemeFile({
  input: 'background.jpg',
  output: 'output/meme.png',
  topText: 'TOP TEXT',
  bottomText: 'BOTTOM TEXT'
});
```

Returns:

```js
{
  output: 'output/meme.png',
  buffer: Buffer,
  width: 600,
  height: 600,
  format: 'png',
  top: { lines: ['TOP TEXT'], fontSize: 82, ... },
  bottom: { lines: ['BOTTOM TEXT'], fontSize: 76, ... }
}
```

### `generateMeme(options)`

Renders a meme and returns a `Buffer`.

```js
const memeBuffer = await generateMeme({
  input: 'background.jpg',
  topText: 'TOP',
  bottomText: 'BOTTOM'
});
```

### `renderMeme(options)`

Renders a meme and returns the image buffer plus layout metadata.

```js
const result = await renderMeme({
  input: 'background.jpg',
  topText: 'TOP',
  bottomText: 'BOTTOM'
});

console.log(result.width, result.height, result.top.lines);
```

### `layoutMemeText(options)`

Calculates the text layout without rendering an image. This is useful for tests and previews.

```js
const layout = layoutMemeText({
  width: 600,
  height: 600,
  topText: 'THIS IS A LONG TOP CAPTION',
  bottomText: 'THIS LONG BOTTOM CAPTION WILL WRAP AUTOMATICALLY'
});

console.log(layout.bottom.lines);
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `input` / `image` / `background` | `string | Buffer | Uint8Array` | required | Background image source. |
| `output` / `out` | `string` | required for `generateMemeFile` | Output path. |
| `topText` / `top` | `string` | `''` | Top caption. |
| `bottomText` / `bottom` | `string` | `''` | Bottom caption. |
| `uppercase` | `boolean` | `true` | Convert captions to uppercase. |
| `format` | `png | jpg | jpeg | webp` | `png` | Output format. |
| `quality` | `number` | `92` | JPEG/WebP quality. |
| `textColor` | `auto | string` | `auto` | Caption fill color. |
| `strokeColor` | `auto | string` | `auto` | Caption outline color. |
| `strokeWidthRatio` | `number` | `0.075` | Outline width relative to font size. |
| `shadow` | `boolean` | `true` | Enables drop shadow. |
| `paddingRatio` | `number` | `0.045` | Caption padding relative to image size. |
| `captionHeightRatio` | `number` | `0.25` | Height of the top and bottom caption areas. |
| `fontSizeRatio` | `number` | `0.145` | Starting font size ratio. |
| `minFontSizeRatio` | `number` | `0.018` | Minimum font size ratio. |
| `lineHeight` | `number` | `0.92` | Caption line height. |
| `fontPath` | `string | Buffer | Uint8Array | false` | bundled Anton | Custom TTF/OTF font source. |

## Fonts

Default font:

- `assets/Anton-Regular.ttf`
- Source: Google Fonts, Anton family
- License: SIL Open Font License 1.1
- License file: `assets/OFL-Anton.txt`

Memegen converts text into SVG paths with `opentype.js`, so the rendered result stays consistent even when the host machine has no matching system font.

Use a custom font:

```js
await generateMemeFile({
  input: 'background.jpg',
  output: 'output/custom-font.png',
  topText: 'CUSTOM',
  bottomText: 'FONT',
  fontPath: './fonts/MyFont.ttf'
});
```

Disable embedded font paths and let SVG use a system font family:

```js
await generateMemeFile({
  input: 'background.jpg',
  output: 'output/system-font.png',
  topText: 'SYSTEM',
  bottomText: 'FONT',
  fontPath: false,
  fontFamily: 'Impact, Arial Black, sans-serif'
});
```

## Development

```bash
npm install
npm run check
npm test
npm run demo
```

Scripts:

- `npm run check`: syntax-checks the main files.
- `npm test`: runs a render smoke test and checks text bounds.
- `npm run demo`: creates `output/demo-meme.png`.

`node_modules/` and `output/` are ignored so the repository stays clean.

## Publish Checklist

Before publishing or pushing a release:

```bash
rm -rf node_modules output
npm install
npm run check
npm test
npm pack --dry-run
```

The package should contain only source files, font assets, license files, type definitions, examples, tests, and documentation.

## License

Code: MIT. See `LICENSE`.

Bundled font: Anton, SIL Open Font License 1.1. See `assets/OFL-Anton.txt`.
