import { WarningCollector } from "./warnings";

/** 単一キーを重複チェック付きで代入する。重複時は warning を記録し、後勝ちで上書きする。 */
export function setTokenWithDuplicateWarning<T>(
  target: Record<string, T>,
  key: string,
  value: T,
  source: string,
  warnings?: WarningCollector,
): void {
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    const message = `トークン名 "${key}" が重複しています。後から変換された定義で上書きされます。`;
    console.warn(message);
    warnings?.add({ severity: "warning", kind: "duplicate", source, message });
  }
  target[key] = value;
}

/** Object.assign 相当を重複チェック付きで行う（複数キー対応）。 */
export function assignTokensWithDuplicateWarning<T>(
  target: Record<string, T>,
  entries: Record<string, T>,
  source: string,
  warnings?: WarningCollector,
): void {
  for (const [key, value] of Object.entries(entries)) {
    setTokenWithDuplicateWarning(target, key, value, source, warnings);
  }
}

/**
 * ui.html は collections 配列の各要素のトップレベルキーごとに `${key}.json` を生成する。
 * 複数要素にまたがって 2 回以上出現するキー（＝ZIP 内で上書きされるファイル名）を返す。
 */
export function findDuplicateFileNames(
  collections: ReadonlyArray<Record<string, unknown> | null | undefined>,
): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const collection of collections) {
    if (!collection) continue;
    for (const key of Object.keys(collection)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }));
}
