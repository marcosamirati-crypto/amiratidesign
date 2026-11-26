import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
const url = process.env.ARTIFACT_URL || '';
const min = process.env.MIN === '1';
// 1) página no Claude
mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/app.js'], bundle: true, format: 'iife', target: ['es2020', 'safari15'], minify: min, outfile: 'dist/app.js', define: { ARTIFACT_URL: JSON.stringify(url) }, legalComments: 'none' });
copyFileSync('src/app.css', 'dist/app.css');
copyFileSync('src/index.html', 'dist/index.html');
// 2) site aberto (marcosamirati.com/zito)
mkdirSync('dist-site', { recursive: true });
await build({ entryPoints: ['src/site.js'], bundle: true, format: 'iife', target: ['es2020', 'safari15'], minify: true, outfile: 'dist-site/app.js', define: { ARTIFACT_URL: '""' }, legalComments: 'none' });
copyFileSync('src/app.css', 'dist-site/app.css');
const v = createHash('sha1').update(readFileSync('dist-site/app.js')).update(readFileSync('dist-site/app.css')).digest('hex').slice(0, 10);
writeFileSync('dist-site/index.html', readFileSync('src/site.html', 'utf8').replaceAll('__V__', v));
console.log('built artifact + site', v);
