# Memegen

Node.js module untuk membuat meme dari gambar background. Ukuran output otomatis mengikuti ukuran asli background, teks atas dan bawah otomatis wrap, dan font akan mengecil sendiri supaya tidak keluar dari gambar.

Module ini memakai `sharp` untuk render image dan font `Anton` dari Google Fonts untuk gaya meme klasik yang tebal.

English summary: **A JavaScript module for creating memes with Sharp, bundled Anton font, automatic text wrapping, and shrink-to-fit captions.**

## Fitur

- Output mengikuti resolusi background.
- Teks atas dan bawah.
- Auto wrap untuk kalimat panjang.
- Auto shrink agar teks tetap masuk area gambar.
- Auto warna teks berdasarkan background (`textColor: 'auto'`).
- Outline dan shadow gaya meme klasik.
- Font `Anton` sudah dibundel, jadi tidak perlu install font di server.
- Bisa output `png`, `jpg/jpeg`, atau `webp`.
- Bisa dipakai sebagai module ESM atau CLI.

## Install

Jika sudah dipublish ke npm:

```bash
npm install memegen
```

Jika masih dari repository lokal:

```bash
git clone <repo-url>
cd memegen
npm install
```

Untuk folder project ini:

```bash
cd meme
npm install
```

## Quick Start

```js
import { generateMemeFile } from 'memegen';

await generateMemeFile({
  input: 'background.jpg',
  output: 'output/meme.png',
  topText: 'wowowo',
  bottomText: 'bising bodo aku nak tido'
});
```

Output akan memakai ukuran asli `background.jpg`.

## Pakai Buffer

```js
import { readFile } from 'node:fs/promises';
import { generateMeme } from 'memegen';

const background = await readFile('background.jpg');

const buffer = await generateMeme({
  background,
  topText: 'teks atas',
  bottomText: 'teks bawah',
  format: 'png'
});
```

`buffer` bisa langsung dikirim ke API, bot WhatsApp/Telegram/Discord, atau disimpan sendiri.

## CLI

```bash
npx memegen \
  --image background.jpg \
  --top "wowowo" \
  --bottom "bising bodo aku nak tido" \
  --out output/meme.png
```

Jika menjalankan dari repo lokal:

```bash
node cli.js \
  --image background.jpg \
  --top "wowowo" \
  --bottom "bising bodo aku nak tido" \
  --out output/meme.png
```

## API

### `generateMemeFile(options)`

Render meme lalu simpan ke file.

```js
const result = await generateMemeFile({
  input: 'background.jpg',
  output: 'output/meme.png',
  topText: 'TOP TEXT',
  bottomText: 'BOTTOM TEXT'
});
```

Return:

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

Render meme dan return `Buffer`.

```js
const buffer = await generateMeme({
  input: 'background.jpg',
  topText: 'TOP',
  bottomText: 'BOTTOM'
});
```

### `renderMeme(options)`

Render meme dan return metadata lengkap tanpa harus menyimpan file.

```js
const result = await renderMeme({
  input: 'background.jpg',
  topText: 'TOP',
  bottomText: 'BOTTOM'
});

console.log(result.width, result.height, result.top.lines);
```

### `layoutMemeText(options)`

Cek layout teks tanpa render image. Ini berguna untuk testing.

```js
const layout = layoutMemeText({
  width: 600,
  height: 600,
  topText: 'wowowo',
  bottomText: 'kalimat panjang yang akan di-wrap otomatis'
});

console.log(layout.bottom.lines);
```

## Options

| Option | Type | Default | Keterangan |
| --- | --- | --- | --- |
| `input` / `image` / `background` | `string | Buffer | Uint8Array` | wajib | Background image. |
| `output` / `out` | `string` | wajib untuk `generateMemeFile` | Path output. |
| `topText` / `top` | `string` | `''` | Teks atas. |
| `bottomText` / `bottom` | `string` | `''` | Teks bawah. |
| `uppercase` | `boolean` | `true` | Ubah teks menjadi huruf besar. |
| `format` | `png | jpg | jpeg | webp` | `png` | Format output. |
| `quality` | `number` | `92` | Quality untuk JPG/WebP. |
| `textColor` | `auto | string` | `auto` | Warna teks. |
| `strokeColor` | `auto | string` | `auto` | Warna outline. |
| `strokeWidthRatio` | `number` | `0.075` | Ketebalan outline relatif terhadap font. |
| `shadow` | `boolean` | `true` | Aktifkan drop shadow. |
| `paddingRatio` | `number` | `0.045` | Padding area teks. |
| `captionHeightRatio` | `number` | `0.25` | Tinggi area teks atas/bawah. |
| `fontSizeRatio` | `number` | `0.145` | Ukuran font awal. |
| `minFontSizeRatio` | `number` | `0.018` | Ukuran font minimum. |
| `lineHeight` | `number` | `0.92` | Jarak antar baris. |
| `fontPath` | `string | Buffer | Uint8Array | false` | bundled Anton | Font TTF/OTF custom. |

## Font

Font default:

- `assets/Anton-Regular.ttf`
- Sumber: Google Fonts `Anton`
- Lisensi: SIL Open Font License 1.1
- File lisensi: `assets/OFL-Anton.txt`

Font dirender sebagai SVG path memakai `opentype.js`, jadi hasilnya konsisten di server yang tidak punya font tersebut.

Pakai font custom:

```js
await generateMemeFile({
  input: 'background.jpg',
  output: 'output/custom-font.png',
  topText: 'custom',
  bottomText: 'font',
  fontPath: './fonts/MyFont.ttf'
});
```

Matikan embedded font dan pakai font-family SVG biasa:

```js
await generateMemeFile({
  input: 'background.jpg',
  output: 'output/system-font.png',
  topText: 'system',
  bottomText: 'font',
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

Script:

- `npm run check`: cek syntax file utama.
- `npm test`: smoke test render, ukuran output, dan text bounds.
- `npm run demo`: buat contoh output di `output/demo-meme.png`.

Folder `node_modules/` dan `output/` sengaja di-ignore agar repository tetap bersih.

## Publish Checklist

Sebelum upload ke GitHub:

```bash
rm -rf node_modules output
npm install
npm run check
npm test
npm pack --dry-run
```

Pastikan yang masuk package hanya file penting: source, assets font, license, types, examples, dan README.

## License

Code: MIT. Lihat `LICENSE`.

Bundled font: Anton, SIL Open Font License 1.1. Lihat `assets/OFL-Anton.txt`.
