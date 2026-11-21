/** API text may be displayed with attribution, but may not be exported. */
export const EXPORT_API_TEXT = false;

export type ExportRights = 'api' | 'public-domain' | 'user';

export function canExport(item: { rights: ExportRights }): { ok: boolean; reason?: string } {
  if (item.rights === 'api') {
    return {
      ok: EXPORT_API_TEXT,
      reason: 'نصوص الديوان API للعرض فقط؛ التصدير يحتاج إذنًا من مصدر النص.',
    };
  }
  return { ok: true };
}
