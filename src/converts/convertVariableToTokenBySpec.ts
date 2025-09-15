import type { TokenOfType } from "../types/token";
import type { AllTokenTypes } from "../types/common";
import { convertToColorToken } from "./convertToColorToken";
import { convertToNumberToken } from "./convertToNumberToken";
import { convertToDimensionToken } from "./convertToDimensionToken";
import {
  convertToFontWeightTokenFromNumber,
  convertToFontWeightTokenFromString,
} from "./convertToFontWeightToken";
import { convertToFontFamilyToken } from "./convertToFontFamilyToken";
import { TypedFigmaVariable } from "../collections";
import {
  isColorFigmaVariable,
  isFloatFigmaVariable,
  isTextFigmaVariable,
} from "./util";

export function convertVariableToTokenBySpec(
  variable: TypedFigmaVariable,
  modeId: string,
): TokenOfType<AllTokenTypes> | null {
  const { scopes } = variable;

  if (!scopes) {
    return null;
  }

  try {
    if (isColorFigmaVariable(variable)) {
      return convertToColorToken(variable, modeId);
    }

    if (isFloatFigmaVariable(variable)) {
      if (isConvertibleToFontWeightToken(variable)) {
        return convertToFontWeightTokenFromNumber(variable, modeId);
      }

      if (isConvertibleToNumberToken(scopes)) {
        return convertToNumberToken(variable, modeId);
      } else {
        return convertToDimensionToken(variable, modeId);
      }
    }

    if (isTextFigmaVariable(variable)) {
      if (isConvertibleToFontWeightToken(variable)) {
        return convertToFontWeightTokenFromString(variable, modeId);
      }
      if (isConvertibleToFontFamilyToken(variable)) {
        return convertToFontFamilyToken(variable, modeId);
      }
    }

    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function isConvertibleToNumberToken(scopes: string[]): boolean {
  if (!Array.isArray(scopes)) {
    return false;
  }
  return scopes.includes("ALL_SCOPES") || scopes.includes("OPACITY");
}

function isConvertibleToFontWeightToken(
  variable: TypedFigmaVariable<"FLOAT" | "STRING">,
): boolean {
  if (variable.scopes?.length !== 1) {
    return false;
  }

  if (variable.resolvedType === "FLOAT") {
    return variable.scopes[0] === "FONT_WEIGHT";
  }

  return variable.scopes[0] === "FONT_STYLE";
}

function isConvertibleToFontFamilyToken(
  variable: TypedFigmaVariable<"STRING">,
): boolean {
  return variable.scopes?.length === 1 && variable.scopes[0] === "FONT_FAMILY";
}
