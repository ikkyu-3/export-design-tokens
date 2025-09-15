import { FigmaCollectionData } from "../collections";
import { makeGroupName } from "../converts/util";

type VariableId = string;
type ModeId = string;
type VariableName = `${string}.${string}`;
interface VariableNameValue {
  defaultName: VariableName;
  modes: {
    [modeId: ModeId]: VariableName;
  };
}

export function createVariableNameMap(collections: FigmaCollectionData[]) {
  const variableNameMap = new Map<VariableId, VariableNameValue>();
  const variableNameByMode = new Map<
    VariableId,
    Record<ModeId, VariableName>
  >();

  collections.forEach((col) => {
    const modes = col.modes ?? [];
    if (modes.length === 0) {
      console.warn(
        `Collection ${col.name} has no modes. collection.id: ${col.id}`,
      );
      return;
    }

    const multiple = modes.length > 1;

    col.variables.forEach((v) => {
      const entry: Record<ModeId, VariableName> = {};

      modes.forEach((mode) => {
        const groupName = makeGroupName(col.name, mode.name, multiple);
        entry[mode.modeId] = `${groupName}.${v.name}`;
      });

      variableNameByMode.set(v.id, entry);

      const defaultName = entry[col.defaultModeId];
      if (!defaultName) {
        console.warn(
          `Default mode not found for variable ${v.name}. collection.id: ${col.id}`,
        );
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
