import {
  FigmaDropShadowEffect,
  FigmaEffectStyle,
  FigmaRGBA,
} from "../types/figma";
import { ColorValue, ShadowObjectValue, ShadowToken } from "../types/token";

function toColorValue(color: FigmaRGBA): ColorValue {
  return {
    colorSpace: "srgb",
    components: [color.r, color.g, color.b],
    alpha: color.a,
  };
}

function toShadowObject(effect: FigmaDropShadowEffect): ShadowObjectValue {
  const base = {
    color: toColorValue(effect.color),
    offsetX: { value: effect.offset.x, unit: "px" },
    offsetY: { value: effect.offset.y, unit: "px" },
    blur: { value: effect.radius, unit: "px" },
    spread: { value: effect.spread || 0, unit: "px" },
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
): Record<string, ShadowToken> | null {
  const shadowEffects = effectStyle.effects.filter(
    (effect) =>
      effect.visible &&
      (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW"),
  ) as FigmaDropShadowEffect[];

  if (shadowEffects.length === 0) {
    return null;
  }

  const shadowObjects = shadowEffects.map(toShadowObject);

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
