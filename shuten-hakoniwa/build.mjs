// src/ を esbuild で束ね、Three.js ごと index.html 1 枚に埋め込む（ダブルクリックで開ける）
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const result = await build({
  entryPoints: [join(root, 'src/main.js')],
  bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync(join(root, 'src/template.html'), 'utf8');
const [head, tail] = html.split('/*__BUNDLE__*/');
writeFileSync(join(root, 'index.html'), head + js + tail);
console.log(`index.html を出力しました (${((head.length + js.length + tail.length) / 1024).toFixed(0)} KB)`);
