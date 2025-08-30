import type { TokenValue, CommonProperties, AllTokenTypes } from "./common";

// ============================================================================
// Type
// ============================================================================
export interface ColorValue {
  colorSpace: "srgb"; // TODO: 他のパターンもある
  components: [number, number, number];
  alpha?: number;
  hex?: string;
}

export interface ColorToken extends CommonProperties {
  $type: "color";
  $value: TokenValue<ColorValue>;
}

export interface DimensionValue {
  value: number;
  unit: "px" | "rem";
}

export interface DimensionToken extends CommonProperties {
  $type: "dimension";
  $value: TokenValue<DimensionValue>;
}

export type FontFamilyValue = string | string[];

export interface FontFamilyToken extends CommonProperties {
  $type: "fontFamily";
  $value: TokenValue<FontFamilyValue>;
}

export type FontWeightValue =
  | number
  | "thin"
  | "hairline"
  | "extra-light"
  | "ultra-light"
  | "light"
  | "normal"
  | "regular"
  | "book"
  | "medium"
  | "semi-bold"
  | "demi-bold"
  | "bold"
  | "extra-bold"
  | "ultra-bold"
  | "black"
  | "heavy"
  | "extra-black"
  | "ultra-black";

export interface FontWeightToken extends CommonProperties {
  $type: "fontWeight";
  $value: TokenValue<FontWeightValue>;
}

export interface DurationValue {
  value: number;
  unit: "ms" | "s";
}

export interface DurationToken extends CommonProperties {
  $type: "duration";
  $value: TokenValue<DurationValue>;
}

export type CubicBezierValue = [number, number, number, number];

export interface CubicBezierToken extends CommonProperties {
  $type: "cubicBezier";
  $value: TokenValue<CubicBezierValue>;
}

export type NumberValue = number;

export interface NumberToken extends CommonProperties {
  $type: "number";
  $value: TokenValue<NumberValue>;
}

// ============================================================================
// Composite Type
// ============================================================================
export type StrokeStyleValue =
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "outset"
  | "inset"
  | {
      dashArray: TokenValue<DimensionValue>[];
      lineCap: "round" | "butt" | "square";
    };

export interface StrokeStyleToken extends CommonProperties {
  $type: "strokeStyle";
  $value: TokenValue<StrokeStyleValue>;
}

export interface BorderValue {
  color: TokenValue<ColorValue>;
  width: TokenValue<DimensionValue>;
  style: TokenValue<StrokeStyleValue>;
}

export interface BorderToken extends CommonProperties {
  $type: "border";
  $value: TokenValue<BorderValue>;
}

export interface TransitionValue {
  duration: TokenValue<DurationValue>;
  delay: TokenValue<DurationValue>;
  timingFunction: TokenValue<CubicBezierValue>;
}

export interface TransitionToken extends CommonProperties {
  $type: "transition";
  $value: TokenValue<TransitionValue>;
}

interface ShadowObjectValue {
  color: TokenValue<ColorValue>;
  offsetX: TokenValue<DimensionValue>;
  offsetY: TokenValue<DimensionValue>;
  blur: TokenValue<DimensionValue>;
  spread: TokenValue<DimensionValue>;
  inset?: boolean;
}

export type ShadowValue = ShadowObjectValue | ShadowObjectValue[];

export interface ShadowToken extends CommonProperties {
  $type: "shadow";
  $value: TokenValue<ShadowValue>;
}

interface GradientStop {
  color: TokenValue<ColorValue>;
  position: TokenValue<NumberValue>;
}

export type GradientValue = GradientStop[];

export interface GradientToken extends CommonProperties {
  $type: "gradient";
  $value: TokenValue<GradientValue>;
}

export interface TypographyValue {
  fontFamily: TokenValue<FontFamilyValue>;
  fontSize: TokenValue<DimensionValue>;
  fontWeight: TokenValue<FontWeightValue>;
  letterSpacing: TokenValue<DimensionValue>;
  lineHeight: TokenValue<NumberValue>;
}

export interface TypographyToken extends CommonProperties {
  $type: "typography";
  $value: TokenValue<TypographyValue>;
}

export interface TokenInterfaceMap {
  color: ColorToken;
  dimension: DimensionToken;
  fontFamily: FontFamilyToken;
  fontWeight: FontWeightToken;
  duration: DurationToken;
  cubicBezier: CubicBezierToken;
  number: NumberToken;
  strokeStyle: StrokeStyleToken;
  border: BorderToken;
  transition: TransitionToken;
  shadow: ShadowToken;
  gradient: GradientToken;
  typography: TypographyToken;
}

export type TokenOfType<T extends AllTokenTypes> = TokenInterfaceMap[T];
