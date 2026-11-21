/** Counts stay Latin-digit with grouping, even in an Arabic UI. */
const COUNT_FORMAT = new Intl.NumberFormat('ar-SA-u-nu-latn');

export function formatCount(value: number): string {
  return COUNT_FORMAT.format(value);
}
