import { WarningCollector } from "./warnings";
import { setTokenAtPath } from "./duplicates";
import type { TokenTree } from "./types/group";

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

/**
 * Variable/Style 名を `/` で分割し、各 segment を DTCG 名にサニタイズしたパス配列を返す純粋関数。
 * - split → 各 segment を sanitizeTokenName（この順序が必須。`a/$b` の `$b` は split 後に初めて「先頭 $」になる）
 * - 空 segment（`a//b`・先頭/末尾 `/`・空文字）は sanitizeTokenName("") → "unnamed" になる
 * - 戻り値は必ず length >= 1（`"".split("/")` は `[""]` を返すため）
 */
export function toTokenPath(name: string): string[] {
  return name.split("/").map(sanitizeTokenName);
}

/** 警告記録付きサニタイザ。同一 (source, name) の警告は 1 回だけ記録する。 */
export function createNameSanitizer(warnings?: WarningCollector) {
  const warned = new Set<string>();

  const sanitize = (name: string, source: string): string => {
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
  };

  return {
    sanitize,
    /** 警告記録付きの path 導出。値は toTokenPath(name) と常に一致する */
    sanitizePath(name: string, source: string): string[] {
      return name.split("/").map((segment) => sanitize(segment, source));
    },
  };
}

export type NameSanitizer = ReturnType<typeof createNameSanitizer>;

/**
 * Record の各キーを `/` 区切りでネストした TokenTree に変換しながら target へ挿入する。
 * サニタイズ（sanitizePath）と衝突解決（setTokenAtPath）を1回で行う。
 */
export function nestRecordTokens<T extends { $value: unknown }>(
  target: TokenTree<T>,
  record: Record<string, T>,
  sanitizer: NameSanitizer,
  source: string,
  warnings?: WarningCollector,
): void {
  for (const [key, token] of Object.entries(record)) {
    setTokenAtPath(
      target,
      sanitizer.sanitizePath(key, source),
      token,
      source,
      warnings,
    );
  }
}
