import { TypedFigmaVariable } from "../collections";
import { NumberToken } from "../types/token";
import { isAliasValue, toTokenReference } from "./util";

export function convertToNumberToken(
  variable: TypedFigmaVariable<"FLOAT">,
  modeId: string,
): NumberToken {
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
      $type: "number",
      $value: toTokenReference(raw),
    };
  }

  return {
    ...base,
    $type: "number",
    $value: raw,
  };
}
