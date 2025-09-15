import { FigmaCollectionData } from "../collections";
import { createVariableNameMap } from "./createVariableNameMap";
import { cloneObject, isAliasValue } from "../converts/util";

/**
 * 全コレクションを対象に VARIABLE_ALIAS を ID 参照から名前（パス）参照へ解決する。
 */
export function resolveAliasesForAllCollections(
  collections: FigmaCollectionData[],
): FigmaCollectionData[] {
  const variableNameMap = createVariableNameMap(collections);

  const clonedCollections = cloneObject(collections);
  if (!clonedCollections) {
    console.warn("Failed to clone collections");
    return [];
  }

  clonedCollections.forEach((col) => {
    col.variables.forEach((variable) => {
      Object.entries(variable.valuesByMode).forEach(([modeId, value]) => {
        if (!isAliasValue(value)) return;

        const variableName = variableNameMap.get(value.id);
        if (!variableName) {
          console.warn(
            `[alias-resolve] nameByMode not found variable id="${value.id}" at mode="${modeId}" (source="${variable.name}")`,
          );
          return;
        }

        value.id = variableName.defaultName;
        variable.valuesByMode[modeId] = value;
      });
    });
  });

  return clonedCollections;
}
