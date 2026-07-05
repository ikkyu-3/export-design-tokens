import { FigmaValueTypeMap, TypedFigmaVariable } from "../collections";

declare const resolvedAliasBrand: unique symbol;

/**
 * resolveAliasesForAllCollections（src/resolve/index.ts）によって
 * alias.id が VariableID（例: "VariableID:1234"）から名前パス
 * （例: "GroupName.tokenName"）へ書き換え済みであることを型で表す branded type。
 *
 * - 実行時表現は VariableAlias と完全に同一（brand プロパティは実在しない）
 * - resolvedAliasBrand は module-private（非 export）のため、明示キャスト無しに
 *   この型を生成できるのはこのファイル内（＝ getResolvedValue 内の唯一の cast）だけ。
 *   getResolvedValue 自体は export され convert 層から呼ばれるが、呼び出し側は
 *   resolve 済みの variable を渡す責務を負う。他所でこの型を得るには明示的な
 *   `as ResolvedVariableAlias` が必要で、grep で監査できる
 * - toTokenReference（src/converts/util.ts）はこの型のみを受け付け、
 *   未 resolve の VariableAlias を渡すとコンパイルエラーになる（issue #26）
 */
export type ResolvedVariableAlias = VariableAlias & {
  readonly [resolvedAliasBrand]: true;
};

/** FigmaVariableValue<T>（src/collections.ts）の resolve 済み版ミラー */
export type ResolvedFigmaVariableValue<T extends VariableResolvedDataType> =
  | FigmaValueTypeMap[T]
  | ResolvedVariableAlias;

/**
 * resolve 済み変数の valuesByMode から mode の値を読み出す。
 *
 * 信頼境界（このリポジトリで唯一の trusted cast）:
 * ここに渡す variable は resolveAliasesForAllCollections を通過済みであることが
 * 前提。main フロー（src/code.ts）では resolve 後の collection だけが
 * convertCollectionToModeNamedGroups → convertVariableToTokenBySpec →
 * convertToXxx に流れるため、この前提は常に成立する。
 * resolve を通していない variable を渡すと、コンパイルは通っても
 * `{VariableID:xxx}` 形式の壊れた参照が出力されうる点は従来と同じ（issue #26 は
 * その前提を型として明示するもので、実行時検証は追加しない）。
 */
export function getResolvedValue<T extends VariableResolvedDataType>(
  variable: TypedFigmaVariable<T>,
  modeId: string,
): ResolvedFigmaVariableValue<T> {
  return variable.valuesByMode[modeId] as ResolvedFigmaVariableValue<T>;
}
