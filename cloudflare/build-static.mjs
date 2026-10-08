import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(projectRoot, 'dist');
const expectedOutputDir = resolve(projectRoot, 'dist');

if (outputDir !== expectedOutputDir || !outputDir.startsWith(`${projectRoot}${sep}`)) {
  throw new Error('Refuz curățarea unui director de build din afara proiectului.');
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const rootFiles = (await readdir(projectRoot, { withFileTypes: true }))
  .filter(entry => entry.isFile() && (/\.html$/i.test(entry.name) || ['robots.txt', 'sitemap.xml'].includes(entry.name)))
  .map(entry => entry.name);

for (const file of rootFiles) {
  await cp(join(projectRoot, file), join(outputDir, file));
}

for (const directory of ['assets', 'css', 'js']) {
  await cp(join(projectRoot, directory), join(outputDir, directory), { recursive: true });
}

console.log(`Build static pregătit în ${outputDir} (${rootFiles.length} pagini și fișiere root).`);
