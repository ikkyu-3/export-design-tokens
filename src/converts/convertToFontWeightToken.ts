import { TypedFigmaVariable } from "../collections";
import { FontWeightToken } from "../types/token";
import { isFontWeightValue, isAliasValue, toTokenReference } from "./util";

export const convertToFontWeightTokenFromString = (
  variable: TypedFigmaVariable<"STRING">,
  modeId: string,
): FontWeightToken => {
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
      $type: "fontWeight",
      $value: toTokenReference(raw),
    };
  }

  if (isFontWeightValue(raw)) {
    return {
      ...base,
      $type: "fontWeight",
      $value: raw,
    };
  }

  throw new Error(
    `Invalid value type for fontWeight variable "${variable.name}" in mode "${modeId}".`,
  );
};

export const convertToFontWeightTokenFromNumber = (
  variable: TypedFigmaVariable<"FLOAT">,
  modeId: string,
): FontWeightToken => {
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
      $type: "fontWeight",
      $value: toTokenReference(raw),
    };
  }

  return {
    ...base,
    $type: "fontWeight",
    $value: raw,
  };
};
