import { TypedFigmaVariable } from "../collections";
import { DimensionToken } from "../types/token";
import { isAliasValue, toTokenReference } from "./util";

export function convertToDimensionToken(
  variable: TypedFigmaVariable<"FLOAT">,
  modeId: string,
): DimensionToken {
  const scopes = variable.scopes ?? [];
  if (scopes.includes("ALL_SCOPES") || scopes.includes("OPACITY")) {
    const blocked = scopes.filter((s) => s === "ALL_SCOPES" || s === "OPACITY");
    throw new Error(
      `FLOAT variable "${variable.name}" has unsupported scopes for dimension: [${blocked.join(
        ", ",
      )}]`,
    );
  }

  const raw = variable.valuesByMode[modeId];
  if (raw === undefined) {
    throw new Error(
      `FLOAT variable "${variable.name}" has undefined value for mode "${modeId}".`,
    );
  }

  const base = { $description: variable.description } as const;

  if (isAliasValue(raw)) {
    return {
      ...base,
      $type: "dimension",
      $value: toTokenReference(raw),
    };
  }

  return {
    ...base,
    $type: "dimension",
    $value: {
      value: raw,
      unit: "px",
    },
  };
}
