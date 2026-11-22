import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fonts');
const FONT_DIR = join(OUT_DIR, 'thmanyah');
const CDN = 'https://cdn.jsdelivr.net/gh/engdawood/thmanyah-font-web@4266a9d/fonts';

const FAMILIES = [
  { slug: 'serif-display', name: 'Thmanyah Serif Display' },
  { slug: 'serif-text', name: 'Thmanyah Serif Text' },
  { slug: 'sans', name: 'Thmanyah Sans' },
];

const WEIGHTS = [
  { name: 'Light', value: 300 },
  { name: 'Regular', value: 400 },
  { name: 'Medium', value: 500 },
  { name: 'Bold', value: 700 },
  { name: 'Black', value: 900 },
];

const HEADER = `/* Thmanyah type family — © Thmanyah Publishing and Distribution.
   Used under the Thmanyah font licence (personal + commercial use; no
   redistribution of the font files). Do not commit the woff2 files.
   Source: https://font.thmanyah.com · web package: @dawod/thmanyah-font-web */`;

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(FONT_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;

  for (const family of FAMILIES) {
    for (const weight of WEIGHTS) {
      const file = `thmanyah-${family.slug}-${weight.name}.woff2`;
      const destination = join(FONT_DIR, file);
      if (await exists(destination)) {
        skipped += 1;
        continue;
      }
      const url = `${CDN}/thmanyah-${family.slug}/woff2/${file}`;
      let response;
      let bytes;
      try {
        response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (response.ok) {
          bytes = Buffer.from(await response.arrayBuffer());
        }
      } catch {
        console.warn(
          'Thmanyah fonts were skipped because the CDN could not be reached; the UI will fall back to system fonts.',
        );
        return;
      }
      if (!response.ok) {
        console.warn(
          `Thmanyah fonts were skipped because the CDN could not be reached (${response.status} ${response.statusText}); the UI will fall back to system fonts.`,
        );
        return;
      }
      await writeFile(destination, bytes);
      downloaded += 1;
    }
  }

  const blocks = FAMILIES.flatMap((family) =>
    WEIGHTS.map(
      (weight) => `@font-face {
  font-family: '${family.name}';
  src: url(/fonts/thmanyah/thmanyah-${family.slug}-${weight.name}.woff2) format('woff2');
  font-weight: ${weight.value};
  font-style: normal;
  font-display: swap;
}`,
    ),
  );
  await writeFile(join(OUT_DIR, 'thmanyah.css'), `${HEADER}\n\n${blocks.join('\n\n')}\n`);
  console.log(`Thmanyah fonts: ${downloaded} downloaded, ${skipped} already present; wrote thmanyah.css`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
