import { getFontDataUris, type FaceId, type FontFaceSource } from './fonts';

function facesInSvg(svg: string): FaceId[] {
  const match = svg.match(/data-fonts="([^"]*)"/);
  if (!match) return ['thmanyah-display', 'thmanyah-text'];
  return match[1].split(/\s+/).filter(Boolean) as FaceId[];
}

function fontStyle(sources: FontFaceSource[]): string {
  const seen = new Set<string>();
  const rules = sources
    .filter((source) => {
      const key = `${source.family}|${source.unicodeRange ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((source) => {
      const range = source.unicodeRange ? `unicode-range:${source.unicodeRange};` : '';
      return `@font-face{font-family:"${source.family}";src:url("${source.dataUri}") format("woff2");font-style:normal;font-weight:400;${range}}`;
    });
  return `<style>${rules.join('')}</style>`;
}

/** Rasterises a standalone SVG to a real-pixel PNG and downloads it. */
export async function exportPng(
  svg: string,
  width: number,
  height: number,
  filename: string,
): Promise<void> {
  if (typeof document === 'undefined') throw new Error('exportPng needs a browser document.');
  await document.fonts.ready;

  const faces = await Promise.all(facesInSvg(svg).map((face) => getFontDataUris(face)));
  const styled = svg.replace(/<svg[^>]*>/, (opening) => `${opening}${fontStyle(faces.flat())}`);
  const svgUrl = URL.createObjectURL(new Blob([styled], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = new Image();
    image.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('تعذّر تحويل التصميم إلى صورة.'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذّر إنشاء لوحة التصدير.');
    context.drawImage(image, 0, 0, width, height);

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('تعذّر حفظ ملف PNG.');

    const downloadUrl = URL.createObjectURL(png);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
