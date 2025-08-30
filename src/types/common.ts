export type AllTokenTypes =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "duration"
  | "cubicBezier"
  | "number"
  | "strokeStyle"
  | "border"
  | "transition"
  | "shadow"
  | "gradient"
  | "typography";

export type TokenReference = `{${string}}`;

export type TokenValue<T> = T | TokenReference;

export interface Extensions {
  [vendorKey: string]: unknown;
}

export interface CommonProperties {
  $description?: string;
  $extensions?: Extensions;
  $deprecated?: boolean | string;
}
