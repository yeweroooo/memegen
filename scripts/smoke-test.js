import { strict as assert } from 'node:assert';
import sharp from 'sharp';
import { layoutMemeText, renderMeme } from '../index.js';

const background = await sharp({
  create: {
    width: 640,
    height: 360,
    channels: 3,
    background: '#f8f8f8'
  }
}).png().toBuffer();

const rendered = await renderMeme({
  background,
  topText: 'wowowo',
  bottomText: 'bising bodo aku nak tido text wrapping aman',
  format: 'png'
});

assert.equal(rendered.width, 640);
assert.equal(rendered.height, 360);
assert.equal(rendered.format, 'png');
assert.ok(rendered.buffer.length > 0);
assert.ok(rendered.top.lines.length >= 1);
assert.ok(rendered.bottom.lines.length >= 1);
assert.ok(rendered.top.maxLineWidth <= rendered.top.zone.width);
assert.ok(rendered.bottom.maxLineWidth <= rendered.bottom.zone.width);

const metadata = await sharp(rendered.buffer).metadata();
assert.equal(metadata.width, 640);
assert.equal(metadata.height, 360);

const layout = layoutMemeText({
  width: 640,
  height: 360,
  topText: 'a very long top sentence that must fit',
  bottomText: 'a very long bottom sentence that must wrap without crossing image bounds'
});

assert.ok(layout.top.maxLineWidth <= layout.top.zone.width);
assert.ok(layout.bottom.maxLineWidth <= layout.bottom.zone.width);

console.log('OK: smoke test passed');
