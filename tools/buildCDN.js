/*eslint-disable */
const { spawnSync } = require('child_process');
const { resolve } = require('path');
const { readFileSync, writeFileSync, readdirSync } = require('fs-extra');
const { assetsDir } = require('../vue.config');

const distDir = resolve(__dirname, '../dist');

spawnSync('npm', ['run', 'build'], {
  shell: true,
  env: {
    ...process.env,
    VUE_CLI_SERVICE_CONFIG_PATH: resolve(__dirname, '../vue.cdn.config.js'),
  },
  stdio: 'inherit',
});

console.log('Processing manifest url of index.html');

const indexFile = resolve(distDir, 'index.html');
const indexContent = readFileSync(indexFile, 'utf8');
const manifestReg = /<link rel=manifest.+?>/;
if (!manifestReg.test(indexContent)) throw new Error('No manifest link');
writeFileSync(indexFile, indexContent.replace(manifestReg, '<link rel=manifest href=manifest.json>'));

console.log('Processing service worker url of app.js');

const jsFiles = readdirSync(resolve(distDir, `${assetsDir}/js`)).filter(file => /app.[^.]+.js/.test(file));
jsFiles.forEach(file => {
  const jsFile = resolve(distDir, `${assetsDir}/js`, file);
  const jsContent = readFileSync(jsFile, 'utf8');
  writeFileSync(jsFile, jsContent.replace(/concat\(.*?"service-worker\.js"\)/g, 'concat("service-worker.js")'));
});

console.log('Processing index.html url of precache-manifest.js');

const precacheFile = resolve(
  distDir,
  readdirSync(distDir).find(file => file.startsWith('precache-manifest'))
);
const precacheContent = readFileSync(precacheFile, 'utf8');
writeFileSync(precacheFile, precacheContent.replace(/[^"]+index\.html/g, 'index.html'));

console.log('Done\n');
