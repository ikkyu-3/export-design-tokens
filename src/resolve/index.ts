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
    // modeId → modeName の逆引き。valuesByMode ごとの線形探索を避けるため
    // コレクション単位で一度だけ構築する。
    const modeNameById = new Map(
      col.modes.map((m) => [m.modeId, m.name] as const),
    );

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

        const sourceModeName = modeNameById.get(modeId);
        const matched =
          sourceModeName !== undefined
            ? variableName.modesByName.get(sourceModeName)
            : undefined;

        // 参照先が「複数モード」かどうかは mode 名のユニーク数（modesByName.size）
        // ではなく modeId 件数で判定する。同名モードが重複しても曖昧な参照として
        // 警告を出すため。
        if (
          matched === undefined &&
          Object.keys(variableName.modes).length > 1
        ) {
          const targetModeNames = [...variableName.modesByName.keys()].join(
            ", ",
          );
          const message =
            sourceModeName === undefined
              ? `[alias-resolve] 参照元モード ID "${modeId}" がコレクション "${col.name}" に見つからないため、デフォルトモードの "${variableName.defaultName}" にフォールバックします（参照先のモード: ${targetModeNames}）`
              : `[alias-resolve] 参照元モード "${sourceModeName}" に一致するモードが参照先にないため、デフォルトモードの "${variableName.defaultName}" にフォールバックします（参照先のモード: ${targetModeNames}）`;
          console.warn(message);
          warnings?.add({
            severity: "warning",
            kind: "alias-resolve",
            source: `Variable: ${variable.name} (mode: ${sourceModeName ?? modeId})`,
            message,
          });
        }

        value.id = matched ?? variableName.defaultName;
        variable.valuesByMode[modeId] = value;
      });
    });
  });

  return clonedCollections;
}
