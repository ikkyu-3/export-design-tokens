import { TypedFigmaVariable } from "../collections";
import { FontFamilyToken } from "../types/token";
import { isAliasValue, toTokenReference } from "./util";

export function convertToFontFamilyToken(
  variable: TypedFigmaVariable<"STRING">,
  modeId: string,
): FontFamilyToken {
  const raw = variable.valuesByMode[modeId];
  if (raw === undefined) {
    throw new Error(
      `String variable "${variable.name}" has no value for mode "${modeId}".`,
    );
  }

  const base = { $description: variable.description } as const;

  if (isAliasValue(raw)) {
    return {
      ...base,
      $type: "fontFamily",
      $value: toTokenReference(raw),
    };
  }

  return {
    ...base,
    $type: "fontFamily",
    $value: raw,
  };
}
