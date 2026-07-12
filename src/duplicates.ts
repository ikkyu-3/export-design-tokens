import { WarningCollector } from "./warnings";

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isLeafToken(node: unknown): boolean {
  return typeof node === "object" && node !== null && hasOwn(node, "$value");
}

function isGroupNode(node: unknown): node is Record<string, unknown> {
  return (
    typeof node === "object" &&
    node !== null &&
    !Array.isArray(node) &&
    !isLeafToken(node)
  );
}

/**
 * own enumerable プロパティとして値を設定する。`__proto__` のようなキーでも
 * プロトタイプ汚染を起こさず、通常のプロパティとして安全に格納できる。
 */
function defineOwnEntry(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/** 単一キーを重複チェック付きで代入する。重複時は warning を記録し、後勝ちで上書きする。 */
export function setTokenWithDuplicateWarning<T>(
  target: Record<string, T>,
  key: string,
  value: T,
  source: string,
  warnings?: WarningCollector,
): void {
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    const message = `キー "${key}" が重複しています（${source}）。後勝ちで上書きされます。`;
    console.warn(message);
    warnings?.add({ severity: "warning", kind: "duplicate", source, message });
  }
  defineOwnEntry(target as Record<string, unknown>, key, value);
}

/**
 * 事前サニタイズ済みの path segments に沿って中間 Group を作りながら葉にトークンを挿入する。
 * 衝突規則(#16): (a)中間位置に既存の葉→duplicate警告のうえ葉を破棄しGroupに置換
 *  (b)葉の位置に既存Group→duplicate警告のうえ新トークンをスキップ
 *  (b')葉の位置に既存の葉→duplicate警告のうえ後勝ち上書き（#18と同じ）
 */
export function setTokenAtPath<T extends { $value: unknown }>(
  target: Record<string, unknown>,
  path: readonly string[],
  token: T,
  source: string,
  warnings?: WarningCollector,
): void {
  if (path.length === 0) return;

  let cursor = target;
  for (const segment of path.slice(0, -1)) {
    const existing = hasOwn(cursor, segment) ? cursor[segment] : undefined;
    if (existing === undefined) {
      defineOwnEntry(cursor, segment, {});
    } else if (!isGroupNode(existing)) {
      const message = `トークンパス "${path.join(".")}" の中間キー "${segment}" に既存のトークンが存在します（${source}）。グループ構造を優先し、既存トークンを破棄して上書きしました。`;
      console.warn(message);
      warnings?.add({
        severity: "warning",
        kind: "duplicate",
        source,
        message,
      });
      defineOwnEntry(cursor, segment, {});
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }

  const leafKey = path[path.length - 1];
  const existing = hasOwn(cursor, leafKey) ? cursor[leafKey] : undefined;
  if (existing !== undefined && isGroupNode(existing)) {
    const message = `トークンパス "${path.join(".")}" には既存のグループが存在します（${source}）。グループ構造を優先し、このトークンをスキップしました。`;
    console.warn(message);
    warnings?.add({ severity: "warning", kind: "duplicate", source, message });
    return;
  }
  setTokenWithDuplicateWarning(cursor, leafKey, token, source, warnings);
}

/**
 * src/zipEntries.ts の buildZipEntries は collections 配列の各要素のトップレベルキーごとに
 * `${key}.tokens.json` を生成する。複数要素にまたがって 2 回以上出現するキー
 * （＝ZIP 内で上書きされるファイル名）を返す。
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
