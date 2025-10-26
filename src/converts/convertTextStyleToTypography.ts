import { FigmaTextStyle } from "../types/figma";
import {
  DimensionValue,
  FontFamilyValue,
  FontWeightValue,
  NumberValue,
  TypographyToken,
  TypographyValue,
} from "../types/token";
import { roundTo2ndDecimal } from "./util";

type FigmaFontSize = Pick<DimensionValue, "value"> & { unit: "px" };

const styleToWeight: Record<string, FontWeightValue> = {
  thin: 100,
  "extra light": 200,
  "ultra light": 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  "semi bold": 600,
  demibold: 600,
  bold: 700,
  "extra bold": 800,
  "ultra bold": 800,
  black: 900,
  heavy: 900,
};

function toFontWeight(style: string): FontWeightValue {
  const key = style.toLowerCase();
  return styleToWeight[key] ?? 400;
}

function toLetterSpacing(
  size: FigmaFontSize,
  letterSpacing: FigmaTextStyle["letterSpacing"],
): DimensionValue {
  if (letterSpacing.unit === "PIXELS") {
    return { value: letterSpacing.value, unit: "px" };
  }

  const letterSpacingPx = size.value * (letterSpacing.value / 100);
  return {
    value: roundTo2ndDecimal(letterSpacingPx),
    unit: "px",
  };
}

function toLineHeight(
  size: FigmaFontSize,
  lineHeight: FigmaTextStyle["lineHeight"],
): NumberValue {
  switch (lineHeight.unit) {
    case "AUTO":
      return 1.5;
    case "PERCENT":
      return roundTo2ndDecimal(lineHeight.value / 100);
    case "PIXELS": {
      const v = lineHeight.value;
      if (!Number.isFinite(v)) {
        throw new TypeError("lineHeight.value が不正です。");
      }

      if (v >= 0.5 && v <= 3) {
        return roundTo2ndDecimal(v);
      }

      const fontSizePx = size.value;
      if (!Number.isFinite(fontSizePx) || fontSizePx === 0) {
        throw new TypeError("fontSize が不正または 0 です。");
      }

      const ratio = v / fontSizePx;
      return roundTo2ndDecimal(ratio);
    }
  }
}

export function convertTextStyleToTypography(
  textStyle: FigmaTextStyle,
): Record<string, TypographyToken> {
  const fontFamily: FontFamilyValue = textStyle.fontName.family;
  const fontWeight: FontWeightValue = toFontWeight(textStyle.fontName.style);
  const fontSize: FigmaFontSize = {
    value: textStyle.fontSize,
    unit: "px",
  };
  const letterSpacing: DimensionValue = toLetterSpacing(
    fontSize,
    textStyle.letterSpacing,
  );
  const lineHeight: NumberValue = toLineHeight(fontSize, textStyle.lineHeight);

  const value: TypographyValue = {
    fontFamily,
    fontWeight,
    fontSize,
    letterSpacing: letterSpacing,
    lineHeight: lineHeight,
  };

  return {
    [textStyle.name]: {
      $type: "typography",
      $value: value,
      $description: textStyle.description,
    },
  };
}
