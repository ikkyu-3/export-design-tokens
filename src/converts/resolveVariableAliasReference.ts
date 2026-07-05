import { TokenReference } from "../types/common";
import { VariableNameMap } from "../resolve/createVariableNameMap";
import { WarningCollector } from "../warnings";
import { isAliasValue } from "./util";

interface ResolveVariableAliasReferenceProps {
  alias: VariableAlias | undefined;
  variableNameMap: VariableNameMap;
  source: string;
  prefix: "textStyle" | "effectStyle";
  field: string;
  warnings?: WarningCollector;
}

/**
 * TextStyle/EffectStyle の boundVariables に含まれる VariableAlias を
 * `{GroupName.tokenName}` 参照へ解決する。
 *
 * - alias が未設定、または VARIABLE_ALIAS 型でない場合は null（警告なし）
 * - variableNameMap にヒットすれば参照文字列を返す
 * - ヒットしない場合は console.warn + warnings.add の上で null を返す（呼び出し側で値フォールバック）
 */
export function resolveVariableAliasReference({
  alias,
  variableNameMap,
  source,
  prefix,
  field,
  warnings,
}: ResolveVariableAliasReferenceProps): TokenReference | null {
  if (!alias) return null;
  if (!isAliasValue(alias)) return null;

  const variableName = variableNameMap.get(alias.id);
  if (variableName) {
    return `{${variableName.defaultName}}`;
  }

  const message = `[${prefix}] Variable ID not found: ${alias.id} (field: ${field}), using fallback value`;
  console.warn(message);
  warnings?.add({
    severity: "warning",
    kind: "alias-resolve",
    source,
    message,
  });
  return null;
}
