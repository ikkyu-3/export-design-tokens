import { describe, it, expect } from "vitest";
import { convertEffectStyleToShadow } from "./convertEffectStyleToShadow";
import { effectStyles } from "../../mocks/effectStyles";
import { ColorValue, ShadowObjectValue } from "../types/token";
import { FigmaDropShadowEffect, FigmaEffectStyle } from "../types/figma";
import { Effect } from "@figma/plugin-typings/plugin-api-standalone";

describe("convertEffectStyleToShadow", () => {
  it("DROP_SHADOWを ShadowToken に変換できる", () => {
    const dropShadow = effectStyles[0];
    const result = convertEffectStyleToShadow(dropShadow);

    expect(result).not.toBeNull();
    expect(result?.[dropShadow.name]).toBeDefined();

    const token = result?.[dropShadow.name];
    expect(token?.$type).toBe("shadow");
    expect(token?.$description).toBe(dropShadow.description);

    const shadowValue = token?.$value;
    expect(shadowValue).toHaveProperty("color");
    expect(shadowValue).toHaveProperty("offsetX");
    expect(shadowValue).toHaveProperty("offsetY");
    expect(shadowValue).toHaveProperty("blur");
    expect(shadowValue).toHaveProperty("spread");
    expect((shadowValue as ShadowObjectValue).inset).toBe(false);
  });

  it("複数の DROP_SHADOW を配列で変換できる", () => {
    const doubleShadow = effectStyles[1];
    const result = convertEffectStyleToShadow(doubleShadow);

    expect(result).not.toBeNull();

    const token = result?.[doubleShadow.name];
    expect(token?.$type).toBe("shadow");

    const shadowValue = token?.$value;
    expect(Array.isArray(shadowValue)).toBe(true);
    expect((shadowValue as ShadowObjectValue[]).length).toBe(2);

    (shadowValue as ShadowObjectValue[]).forEach((shadow) => {
      expect(shadow).toHaveProperty("color");
      expect(shadow).toHaveProperty("offsetX");
      expect(shadow).toHaveProperty("offsetY");
      expect(shadow).toHaveProperty("blur");
      expect(shadow).toHaveProperty("spread");
    });
  });

  it("INNER_SHADOW を inset=true で変換できる", () => {
    const innerShadow = effectStyles[2];
    const result = convertEffectStyleToShadow(innerShadow);

    expect(result).not.toBeNull();

    const token = result?.[innerShadow.name];
    const shadowValue = token?.$value;
    expect((shadowValue as ShadowObjectValue).inset).toBe(true);
  });

  it("visible=false のエフェクトは除外される", () => {
    const effectStyleWithHidden = {
      ...effectStyles[0],
      effects: [
        {
          ...effectStyles[0].effects[0],
          visible: false,
        },
      ],
    };

    const result = convertEffectStyleToShadow(effectStyleWithHidden);

    expect(result).toBeNull();
  });

  it("対象外のエフェクトタイプは除外される", () => {
    const effectStyleWithBlur: FigmaEffectStyle = {
      ...effectStyles[0],
      effects: [
        {
          ...effectStyles[0].effects[0],
          type: "LAYER_BLUR",
        } as Effect,
      ],
    };

    const result = convertEffectStyleToShadow(effectStyleWithBlur);

    expect(result).toBeNull();
  });

  it("color 値が正しく変換される", () => {
    const dropShadow = effectStyles[0];
    const effect = dropShadow.effects[0] as FigmaDropShadowEffect;
    const result = convertEffectStyleToShadow(dropShadow);

    const token = result?.[dropShadow.name];
    const shadowValue = token?.$value as ShadowObjectValue;
    const color = shadowValue.color as ColorValue;

    expect(color.colorSpace).toBe("srgb");
    expect(color.components).toEqual([
      effect.color.r,
      effect.color.g,
      effect.color.b,
    ]);
    expect(color.alpha).toBe(effect.color.a);
  });

  it("offset と blur が px 単位で変換される", () => {
    const dropShadow = effectStyles[0];
    const effect = dropShadow.effects[0] as FigmaDropShadowEffect;
    const result = convertEffectStyleToShadow(dropShadow);

    const token = result?.[dropShadow.name];
    const shadowValue = token?.$value as ShadowObjectValue;

    expect(shadowValue.offsetX).toEqual({
      value: effect.offset.x,
      unit: "px",
    });
    expect(shadowValue.offsetY).toEqual({
      value: effect.offset.y,
      unit: "px",
    });
    expect(shadowValue.blur).toEqual({
      value: effect.radius,
      unit: "px",
    });
    expect(shadowValue.spread).toEqual({
      value: effect.spread,
      unit: "px",
    });
  });
});
