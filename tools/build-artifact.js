#!/usr/bin/env node
/* Bundles index.html + styles.css + app.js into one self-contained file for
   publishing as a Claude Artifact (which supplies its own <html>/<head>/<body>).
   Usage: node tools/build-artifact.js  ->  dist/artifact.html */

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const html = read('index.html');
const css = read('styles.css');
const js = read('app.js');

const body = html.split('<body>')[1].split('</body>')[0]
  .replace(/\s*<script src="app\.js"><\/script>/, '');

const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/)[0];
const title = html.match(/<title>([^<]*)<\/title>/)[1].split('—')[0].trim();

const out = [
  '<title>' + title + '</title>',
  fonts,
  '<style>',
  css.trim(),
  '</style>',
  body.trim(),
  '<script>',
  js.trim(),
  '</script>',
  ''
].join('\n');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), out);
console.log('dist/artifact.html  ' + (out.length / 1024).toFixed(1) + ' KB');
