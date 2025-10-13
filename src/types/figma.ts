import { TextStyle } from "@figma/plugin-typings/plugin-api-standalone";

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
