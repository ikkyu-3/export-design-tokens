import { FigmaCollectionData } from "../collections";
import { VariableNameMap } from "./createVariableNameMap";
import { cloneObject, isAliasValue } from "../converts/util";
import { WarningCollector } from "../warnings";

/**
 * 全コレクションを対象に VARIABLE_ALIAS を ID 参照から名前（パス）参照へ解決する。
 */
export function resolveAliasesForAllCollections(
  collections: FigmaCollectionData[],
  nameMap: VariableNameMap,
  warnings?: WarningCollector,
): FigmaCollectionData[] {
  const clonedCollections = cloneObject(collections);
  if (!clonedCollections) {
    console.warn("Failed to clone collections");
    return [];
  }

  clonedCollections.forEach((col) => {
    col.variables.forEach((variable) => {
      Object.entries(variable.valuesByMode).forEach(([modeId, value]) => {
        if (!isAliasValue(value)) return;

        const variableName = nameMap.get(value.id);
        if (!variableName) {
          const message = `[alias-resolve] variable name not found for id="${value.id}" at mode="${modeId}" (source="${variable.name}")`;
          console.warn(message);
          warnings?.add({
            severity: "warning",
            kind: "alias-resolve",
            source: `Variable: ${variable.name} (mode: ${modeId})`,
            message,
          });
          return;
        }

        value.id = variableName.defaultName;
        variable.valuesByMode[modeId] = value;
      });
    });
  });

  return clonedCollections;
}
