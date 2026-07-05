import {
  FigmaDropShadowEffect,
  FigmaEffectStyle,
  FigmaRGBA,
} from "../types/figma";
import { ColorValue, ShadowObjectValue, ShadowToken } from "../types/token";
import { VariableNameMap } from "../resolve/createVariableNameMap";
import { WarningCollector } from "../warnings";
import { resolveVariableAliasReference } from "./resolveVariableAliasReference";
import { makeColorValue } from "./util";

function toColorValue(color: FigmaRGBA): ColorValue {
  return makeColorValue(color.r, color.g, color.b, color.a);
}

interface ToShadowObjectProps {
  effect: FigmaDropShadowEffect;
  variableNameMap: VariableNameMap;
  source: string;
  warnings?: WarningCollector;
}

function toShadowObject({
  effect,
  variableNameMap,
  source,
  warnings,
}: ToShadowObjectProps): ShadowObjectValue {
  const bound = effect.boundVariables;
  const resolve = (alias: VariableAlias | undefined, field: string) =>
    resolveVariableAliasReference({
      alias,
      variableNameMap,
      source,
      prefix: "effectStyle",
      field,
      warnings,
    });

  const base: ShadowObjectValue = {
    color: resolve(bound?.color, "color") ?? toColorValue(effect.color),
    offsetX: resolve(bound?.offsetX, "offsetX") ?? {
      value: effect.offset.x,
      unit: "px",
    },
    offsetY: resolve(bound?.offsetY, "offsetY") ?? {
      value: effect.offset.y,
      unit: "px",
    },
    // 名前ズレ: Figma 側のフィールド名は "radius"、トークン側は "blur"
    blur: resolve(bound?.radius, "radius") ?? {
      value: effect.radius,
      unit: "px",
    },
    spread: resolve(bound?.spread, "spread") ?? {
      value: effect.spread || 0,
      unit: "px",
    },
  };
  if (effect.type === "INNER_SHADOW") {
    return { ...base, inset: true };
  }
  return base;
}

/**
 * visible かつ effectはDropShadowEffect, InnerShadowEffectのみ変換対象としたい
 * @param effectStyle
 */
export function convertEffectStyleToShadow(
  effectStyle: FigmaEffectStyle,
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
): Record<string, ShadowToken> | null {
  const shadowEffects = effectStyle.effects.filter(
    (effect) =>
      effect.visible &&
      (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW"),
  ) as FigmaDropShadowEffect[];

  if (shadowEffects.length === 0) {
    return null;
  }

  const source = `EffectStyle: ${effectStyle.name}`;
  const shadowObjects = shadowEffects.map((effect) =>
    toShadowObject({ effect, variableNameMap, source, warnings }),
  );

  const shadowValue =
    shadowObjects.length === 1 ? shadowObjects[0] : shadowObjects;

  return {
    [effectStyle.name]: {
      $type: "shadow",
      $value: shadowValue,
      $description: effectStyle.description,
    },
  };
}
