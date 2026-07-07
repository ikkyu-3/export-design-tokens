import { TypedFigmaVariable } from "../collections";
import { ColorToken } from "../types/token";
import { getResolvedValue } from "../resolve/resolvedAlias";
import { isAliasValue, isRGBA, makeColorValue, toTokenReference } from "./util";

export const convertToColorToken = (
  variable: TypedFigmaVariable<"COLOR">,
  modeId: string,
): ColorToken => {
  const raw = getResolvedValue(variable, modeId);
  if (raw === undefined) {
    throw new Error(
      `Color variable "${variable.name}" has no value for mode "${modeId}".`,
    );
  }

  const base = { $description: variable.description } as const;

  if (isAliasValue(raw)) {
    return {
      ...base,
      $type: "color",
      $value: toTokenReference(raw),
    };
  }

  const { r, g, b } = raw;
  return {
    ...base,
    $type: "color",
    $value: makeColorValue(r, g, b, isRGBA(raw) ? raw.a : 1),
  };
};
