import { TypedFigmaVariable } from "../collections";
import { ColorToken } from "../types/token";
import { isAliasValue, isRGBA, toTokenReference } from "./util";

export const convertToColorToken = (
  variable: TypedFigmaVariable<"COLOR">,
  modeId: string,
): ColorToken => {
  const raw = variable.valuesByMode[modeId];
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
    $value: {
      colorSpace: "srgb",
      components: [r, g, b],
      alpha: isRGBA(raw) ? raw.a : 1,
    },
  };
};
