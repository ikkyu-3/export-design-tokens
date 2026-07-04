import { FigmaCollectionData } from "../collections";
import { Group } from "../types/group";
import { convertVariableToTokenBySpec } from "./convertVariableToTokenBySpec";
import type { TokenOfType } from "../types/token";
import type { AllTokenTypes } from "../types/common";
import { makeGroupName } from "./util";
import { WarningCollector } from "../warnings";
import { setTokenWithDuplicateWarning } from "../duplicates";
import { sanitizeTokenName } from "../sanitize";

type GroupMeta = Pick<
  Group,
  "$description" | "$extensions" | "$deprecated" | "$type"
>;

type GroupEntries = Record<string, TokenOfType<AllTokenTypes> | Group>;

function composeGroup(meta: GroupMeta, entries: GroupEntries): Group {
  return { ...meta, ...entries } as Group;
}

function buildGroupForMode(
  collection: FigmaCollectionData,
  modeId: string,
  description: string,
  warnings?: WarningCollector,
): Group {
  const meta: GroupMeta = { $description: description };
  const entries: GroupEntries = {};

  for (const variable of collection.variables) {
    const token = convertVariableToTokenBySpec(variable, modeId, warnings);
    if (token) {
      // sanitize 警告は createVariableNameMap 側で記録済みのため、ここでは無警告で適用する
      setTokenWithDuplicateWarning<GroupEntries[string]>(
        entries,
        sanitizeTokenName(variable.name),
        token,
        `Variable: ${variable.name} (collection: ${collection.name}, mode: ${modeId})`,
        warnings,
      );
    }
  }

  return composeGroup(meta, entries);
}

/**
 * mode ごとに 1 Group を作成し、Group 名（キー名）を以下のルールで返します:
 * - mode が 1 つだけ: Group 名は collection 名
 * - mode が複数: Group 名は "collection名_mode名"
 *
 * 戻り値は { [groupName]: Group } のマップ。
 * modes が 0 件の場合は空オブジェクトを返す。
 */
export function convertCollectionToModeNamedGroups(
  collection: FigmaCollectionData,
  warnings?: WarningCollector,
): Record<string, Group> {
  const modes = collection.modes;
  if (modes.length === 0) {
    return {};
  }

  const result: Record<string, Group> = {};
  const multiple = modes.length > 1;

  for (const mode of modes) {
    // sanitize 警告は createVariableNameMap 側で記録済みのため、ここでは無警告で適用する
    const groupName = sanitizeTokenName(
      makeGroupName(collection.name, mode.name, multiple),
    );
    const description = multiple
      ? `Collection: ${collection.name} | Mode: ${mode.name}`
      : `Collection: ${collection.name}`;

    setTokenWithDuplicateWarning(
      result,
      groupName,
      buildGroupForMode(collection, mode.modeId, description, warnings),
      `Collection: ${collection.name} (mode: ${mode.name})`,
      warnings,
    );
  }

  return result;
}
