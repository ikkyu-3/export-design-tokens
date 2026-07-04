import { FigmaCollectionData } from "../collections";
import { makeGroupName } from "../converts/util";
import { WarningCollector } from "../warnings";
import { createNameSanitizer } from "../sanitize";

type VariableId = string;
type ModeId = string;
type VariableName = `${string}.${string}`;
interface VariableNameValue {
  defaultName: VariableName;
  modes: {
    [modeId: ModeId]: VariableName;
  };
}

export type VariableNameMap = ReturnType<typeof createVariableNameMap>;

export function createVariableNameMap(
  collections: FigmaCollectionData[],
  warnings?: WarningCollector,
) {
  const variableNameMap = new Map<VariableId, VariableNameValue>();
  const sanitizer = createNameSanitizer(warnings);

  collections.forEach((col) => {
    const modes = col.modes ?? [];
    if (modes.length === 0) {
      const message = `Collection ${col.name} has no modes. collection.id: ${col.id}`;
      console.warn(message);
      warnings?.add({
        severity: "warning",
        kind: "name-map",
        source: `Collection: ${col.name}`,
        message,
      });
      return;
    }

    const multiple = modes.length > 1;

    col.variables.forEach((v) => {
      const entry: Record<ModeId, VariableName> = {};

      modes.forEach((mode) => {
        const rawGroupName = makeGroupName(col.name, mode.name, multiple);
        const groupName = sanitizer.sanitize(
          rawGroupName,
          `Group: ${rawGroupName} (collection: ${col.name})`,
        );
        const tokenName = sanitizer.sanitize(
          v.name,
          `Variable: ${v.name} (collection: ${col.name})`,
        );
        entry[mode.modeId] = `${groupName}.${tokenName}`;
      });

      const defaultName = entry[col.defaultModeId];
      if (!defaultName) {
        const message = `Default mode not found for variable ${v.name}. collection.id: ${col.id}`;
        console.warn(message);
        warnings?.add({
          severity: "warning",
          kind: "name-map",
          source: `Variable: ${v.name} (collection: ${col.name})`,
          message,
        });
        return;
      }

      variableNameMap.set(v.id, {
        defaultName: defaultName,
        modes: entry,
      });
    });
  });

  return variableNameMap;
}
