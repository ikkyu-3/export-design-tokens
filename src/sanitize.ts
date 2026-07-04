import { WarningCollector } from "./warnings";
import { setTokenWithDuplicateWarning } from "./duplicates";

/** サニタイズで空になった名前のフォールバック */
export const FALLBACK_TOKEN_NAME = "unnamed";

/**
 * DTCG (Format 2025.10) のトークン/グループ名制約に合わせて名前をサニタイズする純粋関数。
 * - `.` `{` `}` → `-` に置換
 * - 先頭の `$`（連続分すべて）を除去（`$` は先頭以外では合法なので中間は保持）
 * - 結果が空文字なら FALLBACK_TOKEN_NAME を返す
 * ※ `/` は DTCG 上合法なので置換しない（#16 が別途ネスト化を担当）
 */
export function sanitizeTokenName(name: string): string {
  const replaced = name.replace(/[.{}]/g, "-").replace(/^\$+/, "");
  return replaced === "" ? FALLBACK_TOKEN_NAME : replaced;
}

/** 警告記録付きサニタイザ。同一 (source, name) の警告は 1 回だけ記録する。 */
export function createNameSanitizer(warnings?: WarningCollector) {
  const warned = new Set<string>();
  return {
    sanitize(name: string, source: string): string {
      const sanitized = sanitizeTokenName(name);
      if (sanitized !== name) {
        const key = `${source} ${name}`;
        if (!warned.has(key)) {
          warned.add(key);
          const message = `名前 "${name}" は Design Tokens の命名制約（先頭 $ 禁止 / . { } 禁止 / 空文字禁止）に違反するため "${sanitized}" にサニタイズしました。`;
          console.warn(message);
          warnings?.add({
            severity: "warning",
            kind: "name-sanitize",
            source,
            message,
          });
        }
      }
      return sanitized;
    },
  };
}

export type NameSanitizer = ReturnType<typeof createNameSanitizer>;

/**
 * Record のキーをまとめてサニタイズする（スタイル系の出力キー用）。値は保持。
 * サニタイズ後にキーが衝突した場合は setTokenWithDuplicateWarning 経由で
 * duplicate 警告を記録し後勝ちで上書きする（サイレントな値欠落を防ぐ）。
 */
export function sanitizeRecordKeys<T>(
  record: Record<string, T>,
  sanitizer: NameSanitizer,
  source: string,
  warnings?: WarningCollector,
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    setTokenWithDuplicateWarning(
      result,
      sanitizer.sanitize(key, source),
      value,
      source,
      warnings,
    );
  }
  return result;
}
