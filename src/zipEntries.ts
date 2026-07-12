/** トークンファイルではないため .tokens.json にしない */
export const WARNINGS_FILENAME = "_export-warnings.json";

/** トークンファイルの出力ファイル名（DTCG推奨拡張子 .tokens.json）を組み立てる単一情報源 */
export function tokenFileName(key: string): string {
  return `${key}.tokens.json`;
}

export interface ZipEntry {
  filename: string;
  content: string;
}

/**
 * ZIP に格納するエントリ（ファイル名とJSON文字列）を組み立てる純粋関数。
 * DOM/JSZip に依存しないため、UI層と分離してユニットテストできる。
 */
export function buildZipEntries(
  collections: ReadonlyArray<Record<string, unknown>>,
  warnings: ReadonlyArray<unknown>,
): ZipEntry[] {
  const entries: ZipEntry[] = [];

  if (Array.isArray(warnings) && warnings.length > 0) {
    entries.push({
      filename: WARNINGS_FILENAME,
      content: JSON.stringify({ warnings }, null, 2),
    });
  }

  for (const group of collections) {
    const groupKeys = Object.keys(group);
    if (groupKeys.length === 0) {
      console.warn("No valid keys found in group:", group);
      continue;
    }
    for (const key of groupKeys) {
      entries.push({
        filename: tokenFileName(key),
        content: JSON.stringify({ [key]: group[key] }, null, 2),
      });
    }
  }

  return entries;
}
