import type { TypedFigmaVariable } from "../collections";
import type { ColorValue, ColorSpace, FontWeightValue } from "../types/token";
import type { ResolvedVariableAlias } from "../resolve/resolvedAlias";

/**
 * 本エクスポータが実際に出力しうる colorSpace（issue #8）。
 * ColorSpace（DTCG 全14種）から、Figma の documentColorProfile に対応する2種に絞る。
 * lab 等の値を RGB components のまま出力する誤用を型で防ぐ。
 */
export type DocumentColorSpace = Extract<ColorSpace, "srgb" | "display-p3">;

let documentColorSpace: DocumentColorSpace = "srgb";

/** main() 冒頭で一度だけ呼び出し、ドキュメントの色空間を注入する（issue #8） */
export function setDocumentColorSpace(space: DocumentColorSpace): void {
  documentColorSpace = space;
}

/**
 * figma.root.documentColorProfile から出力用の DocumentColorSpace へ変換する（issue #8）。
 * "DISPLAY_P3" のみ display-p3、それ以外（"SRGB" / "LEGACY"、将来 typings が増えた場合も含む）は srgb にフォールバックする。
 */
export function documentColorSpaceFromProfile(
  profile: DocumentNode["documentColorProfile"],
): DocumentColorSpace {
  return profile === "DISPLAY_P3" ? "display-p3" : "srgb";
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Group 名の決定ルール:
 * - mode が 1 つ: collection 名
 * - mode が 2 つ以上: `${collection.name}${mode名}`
 */
export function makeGroupName(
  collectionName: string,
  modeLabel: string,
  multiple: boolean,
): string {
  return multiple
    ? `${collectionName}${capitalize(modeLabel)}`
    : collectionName;
}

/**
 * resolve 済み alias 専用。alias.id が VariableID から名前パスへ
 * 書き換え済みであることを前提に参照文字列 `{name}` を生成する。
 * 未 resolve の VariableAlias を渡すと型エラーになる（issue #26）。
 */
export function toTokenReference(alias: ResolvedVariableAlias): `{${string}}` {
  return `{${alias.id}}`;
}

function isFiniteNumberIn01(n: unknown): n is number {
  return typeof n === "number" && n >= 0 && n <= 1;
}

export function isColorValue(value: unknown): value is RGB | RGBA {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const v = value as Record<string, unknown>;

  const hasRGB =
    isFiniteNumberIn01(v.r) &&
    isFiniteNumberIn01(v.g) &&
    isFiniteNumberIn01(v.b);

  const hasOptionalA = v.a === undefined || isFiniteNumberIn01(v.a);

  return hasRGB && hasOptionalA;
}

export function isRGBA(value: RGB | RGBA): value is RGBA {
  return (value as RGBA).a !== undefined;
}

/**
 * TypeValidation
 */
export function isAliasValue(value: unknown): value is VariableAlias {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "VARIABLE_ALIAS" &&
    "id" in value &&
    typeof value.id === "string"
  );
}

const fontWeightStringValues = [
  "thin",
  "hairline",
  "extra-light",
  "ultra-light",
  "light",
  "normal",
  "regular",
  "book",
  "medium",
  "semi-bold",
  "demi-bold",
  "bold",
  "extra-bold",
  "ultra-bold",
  "black",
  "heavy",
  "extra-black",
  "ultra-black",
];
export function isFontWeightValue(value: unknown): value is FontWeightValue {
  if (typeof value === "number" && value > 0) {
    return true;
  }

  return typeof value === "string" && fontWeightStringValues.includes(value);
}

/**
 * VariableValidation
 */
export function isColorFigmaVariable(
  value: TypedFigmaVariable,
): value is TypedFigmaVariable<"COLOR"> {
  return value.resolvedType === "COLOR";
}

export function isTextFigmaVariable(
  value: TypedFigmaVariable,
): value is TypedFigmaVariable<"STRING"> {
  return value.resolvedType === "STRING";
}

export function isFloatFigmaVariable(
  value: TypedFigmaVariable,
): value is TypedFigmaVariable<"FLOAT"> {
  return value.resolvedType === "FLOAT";
}

export function cloneObject<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error("Clone failed:", error);
    return null;
  }
}

export function roundTo2ndDecimal(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(
      "roundTo2ndDecimal: 有効な有限数値を指定してください。",
    );
  }

  const scaled = Math.fround(value * 100);
  const rounded = Math.round(scaled);
  return rounded / 100;
}

/**
 * ColorValue を構築する共有ヘルパー（issue #21）。
 * DTCG の Color モジュールでは alpha の既定値が 1 のため、
 * a === 1（厳密比較）のときは alpha キー自体を省略する。
 * a ≠ 1 の値は丸めず、そのまま alpha として出力する（0 も出力される）。
 * Figma はドキュメントのカラープロファイルが変わっても r/g/b/a に同じ数値を返し、
 * その解釈のみが変わるため、数値変換は行わず colorSpace ラベルのみ出し分ける（issue #8）。
 */
export function makeColorValue(
  r: number,
  g: number,
  b: number,
  a: number,
): ColorValue {
  const value: ColorValue = {
    colorSpace: documentColorSpace,
    components: [r, g, b],
  };
  if (a !== 1) {
    value.alpha = a;
  }
  return value;
}
