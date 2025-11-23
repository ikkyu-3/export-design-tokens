import {
  TextStyle,
  PaintStyle,
  EffectStyle,
  Effect,
} from "@figma/plugin-typings/plugin-api-standalone";

export type FigmaTextStyle = Pick<
  TextStyle,
  | "id"
  | "name"
  | "description"
  | "type"
  | "fontSize"
  | "fontName"
  | "textCase"
  | "textDecoration"
  | "letterSpacing"
  | "lineHeight"
  | "leadingTrim"
  | "paragraphIndent"
  | "paragraphSpacing"
  | "listSpacing"
  | "hangingPunctuation"
  | "hangingList"
>;

export type FigmaColorStyle = Pick<
  PaintStyle,
  "id" | "name" | "description" | "type" | "paints"
>;

export type FigmaEffectStyle = Pick<
  EffectStyle,
  "id" | "name" | "description" | "type" | "effects"
>;

export interface FigmaRGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export type FigmaDropShadowEffect = Extract<
  Effect,
  { type: "DROP_SHADOW" | "INNER_SHADOW" }
>;
