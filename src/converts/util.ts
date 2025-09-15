import { TypedFigmaVariable } from "../collections";
import { FontWeightValue } from "../types/token";

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

export function toTokenReference(alias: VariableAlias): `{${string}}` {
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
