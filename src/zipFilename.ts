/** ZIP ファイル名に含める Figma ドキュメント名セグメントの最大文字数（code point 単位） */
export const ZIP_NAME_MAX_LENGTH = 50;

/**
 * ZIP ファイル名に含める Figma ドキュメント名セグメントのサニタイズ。
 * OS のファイル名禁止文字を除去する。DTCG トークン名用の sanitize.ts とは
 * 目的・規則が異なるため独立実装。
 */
export function sanitizeZipNameSegment(name: string): string {
  const replaced = name
    // 禁止文字と制御文字を "-" に置換する（削除ではなく置換で "a/b" と "ab" の区別を保つ。
    // 区切りに使う "_" と紛れないよう "-" を採用）
    // eslint-disable-next-line no-control-regex -- OS ファイル名として不正な制御文字（U+0000-U+001F, U+007F）を除去するため
    .replace(/[/\\:*?"<>|\x00-\x1f\x7f]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[\s.-]+|[\s.-]+$/g, "");

  const truncated = Array.from(replaced)
    .slice(0, ZIP_NAME_MAX_LENGTH)
    .join("")
    .replace(/[\s.-]+$/, "");

  return truncated;
}

/** YYYYMMDDHHmm 形式。現 ui.html の timestamp 生成ロジックを移植 */
export function formatTimestamp(now: Date): string {
  return (
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0")
  );
}

/** ZIP ファイル名を組み立てる。名前セグメントが空なら従来形式（区切り _ を二重化しない） */
export function buildZipFilename(rawName: string, now: Date): string {
  const segment = sanitizeZipNameSegment(rawName);
  const ts = formatTimestamp(now);
  return segment === ""
    ? `export-design-tokens_${ts}.zip`
    : `export-design-tokens_${segment}_${ts}.zip`;
}
