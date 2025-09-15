import { FigmaCollectionData } from "../collections";
import { Group } from "../types/group";
import { convertVariableToTokenBySpec } from "./convertVariableToTokenBySpec";
import type { TokenOfType } from "../types/token";
import type { AllTokenTypes } from "../types/common";
import { makeGroupName } from "./util";

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
): Group {
  const meta: GroupMeta = { $description: description };
  const entries: GroupEntries = {};

  for (const variable of collection.variables) {
    const token = convertVariableToTokenBySpec(variable, modeId);
    if (token) {
      entries[variable.name] = token;
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
): Record<string, Group> {
  const modes = collection.modes;
  if (modes.length === 0) {
    return {};
  }

  const result: Record<string, Group> = {};
  const multiple = modes.length > 1;

  for (const mode of modes) {
    const groupName = makeGroupName(collection.name, mode.name, multiple);
    const description = multiple
      ? `Collection: ${collection.name} | Mode: ${mode.name}`
      : `Collection: ${collection.name}`;

    result[groupName] = buildGroupForMode(collection, mode.modeId, description);
  }

  return result;
}
