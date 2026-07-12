import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertEffectStyleToShadow } from "./convertEffectStyleToShadow";
import { effectStyles } from "../../mocks/effectStyles";
import { ColorValue, ShadowObjectValue, ShadowValue } from "../types/token";
import type { FigmaShadowEffect, FigmaEffectStyle } from "../types/figma";
import { Effect } from "@figma/plugin-typings/plugin-api-standalone";
import { createVariableNameMap } from "../resolve/createVariableNameMap";
import { createWarningCollector } from "../warnings";
import type { FigmaCollectionData } from "../collections";

describe("convertEffectStyleToShadow", () => {
  it("DROP_SHADOWを ShadowToken に変換できる", () => {
    const dropShadow = effectStyles[0];
    const result = convertEffectStyleToShadow(dropShadow, new Map());

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
    expect((shadowValue as ShadowObjectValue).inset).toBeUndefined();
  });

  it("複数の DROP_SHADOW を配列で変換できる", () => {
    const doubleShadow = effectStyles[1];
    const result = convertEffectStyleToShadow(doubleShadow, new Map());

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
    const result = convertEffectStyleToShadow(innerShadow, new Map());

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

    const result = convertEffectStyleToShadow(effectStyleWithHidden, new Map());

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

    const result = convertEffectStyleToShadow(effectStyleWithBlur, new Map());

    expect(result).toBeNull();
  });

  it("color 値が正しく変換される", () => {
    const dropShadow = effectStyles[0];
    const effect = dropShadow.effects[0] as FigmaShadowEffect;
    const result = convertEffectStyleToShadow(dropShadow, new Map());

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

  it("color の a が 1 の場合は alpha キーが省略される", () => {
    const dropShadow = effectStyles[0];
    const effectStyleWithOpaqueColor: FigmaEffectStyle = {
      ...dropShadow,
      effects: [
        {
          ...(dropShadow.effects[0] as FigmaShadowEffect),
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };
    const result = convertEffectStyleToShadow(
      effectStyleWithOpaqueColor,
      new Map(),
    );

    const token = result?.[effectStyleWithOpaqueColor.name];
    const shadowValue = token?.$value as ShadowObjectValue;
    const color = shadowValue.color as ColorValue;

    expect(color).toEqual({
      colorSpace: "srgb",
      components: [0, 0, 0],
    });
    expect("alpha" in (color as object)).toBe(false);
  });

  it("offset と blur が px 単位で変換される", () => {
    const dropShadow = effectStyles[0];
    const effect = dropShadow.effects[0] as FigmaShadowEffect;
    const result = convertEffectStyleToShadow(dropShadow, new Map());

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

  it('spread が undefined のエフェクトでは spread トークンが { value: 0, unit: "px" } になる', () => {
    const dropShadow = effectStyles[0];
    const { spread: _spread, ...effectWithoutSpread } = dropShadow
      .effects[0] as FigmaShadowEffect;
    const effectStyleWithUndefinedSpread: FigmaEffectStyle = {
      ...dropShadow,
      effects: [effectWithoutSpread as unknown as FigmaShadowEffect],
    };

    const result = convertEffectStyleToShadow(
      effectStyleWithUndefinedSpread,
      new Map(),
    );

    const token = result?.[effectStyleWithUndefinedSpread.name];
    const shadowValue = token?.$value as ShadowObjectValue;

    expect(shadowValue.spread).toEqual({ value: 0, unit: "px" });
  });

  describe("boundVariables の参照化", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    const elevationCollection: FigmaCollectionData[] = [
      {
        id: "VariableCollectionId:2:1",
        name: "Elevation",
        defaultModeId: "1:0",
        modes: [{ modeId: "1:0", name: "Mode 1" }],
        variables: [
          {
            id: "VariableID:2:1",
            name: "shadowColor",
            resolvedType: "COLOR",
            valuesByMode: { "1:0": { r: 0, g: 0, b: 0, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:2:2",
            name: "x",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 0 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:2:3",
            name: "y",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 4 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:2:4",
            name: "blur",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 8 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:2:5",
            name: "spread",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 2 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    function makeEffectStyle(
      overrides: Partial<FigmaShadowEffect> = {},
    ): FigmaEffectStyle {
      return {
        id: "style-bound-1",
        name: "Bound",
        description: "",
        type: "EFFECT",
        effects: [
          {
            type: "DROP_SHADOW",
            visible: true,
            radius: 4,
            boundVariables: {},
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            spread: 0,
            blendMode: "NORMAL",
            showShadowBehindNode: false,
            ...overrides,
          } as FigmaShadowEffect,
        ],
      };
    }

    it("color が bound の場合、参照になり alpha は出力に現れない", () => {
      const variableNameMap = createVariableNameMap(elevationCollection);
      const effectStyle = makeEffectStyle({
        boundVariables: {
          color: { type: "VARIABLE_ALIAS", id: "VariableID:2:1" },
        },
      });

      const result = convertEffectStyleToShadow(effectStyle, variableNameMap);
      const shadowValue = result?.[effectStyle.name]
        .$value as ShadowObjectValue;

      expect(shadowValue.color).toBe("{Elevation.shadowColor}");
      expect(shadowValue.offsetX).toEqual({ value: 0, unit: "px" });
      expect(shadowValue.offsetY).toEqual({ value: 4, unit: "px" });
      expect(shadowValue.blur).toEqual({ value: 4, unit: "px" });
      expect(shadowValue.spread).toEqual({ value: 0, unit: "px" });
      expect(JSON.stringify(shadowValue)).not.toContain("0.25");
    });

    it("offsetX/offsetY が bound の場合、それぞれ参照になる", () => {
      const variableNameMap = createVariableNameMap(elevationCollection);
      const effectStyle = makeEffectStyle({
        boundVariables: {
          offsetX: { type: "VARIABLE_ALIAS", id: "VariableID:2:2" },
          offsetY: { type: "VARIABLE_ALIAS", id: "VariableID:2:3" },
        },
      });

      const result = convertEffectStyleToShadow(effectStyle, variableNameMap);
      const shadowValue = result?.[effectStyle.name]
        .$value as ShadowObjectValue;

      expect(shadowValue.offsetX).toBe("{Elevation.x}");
      expect(shadowValue.offsetY).toBe("{Elevation.y}");
    });

    it("radius が bound の場合、blur が参照になる（radius→blur 名前ズレ）。出力に radius キーは無い", () => {
      const variableNameMap = createVariableNameMap(elevationCollection);
      const effectStyle = makeEffectStyle({
        boundVariables: {
          radius: { type: "VARIABLE_ALIAS", id: "VariableID:2:4" },
        },
      });

      const result = convertEffectStyleToShadow(effectStyle, variableNameMap);
      const shadowValue = result?.[effectStyle.name]
        .$value as ShadowObjectValue;

      expect(shadowValue.blur).toBe("{Elevation.blur}");
      expect(shadowValue).not.toHaveProperty("radius");
    });

    it("spread が bound の場合、参照になる", () => {
      const variableNameMap = createVariableNameMap(elevationCollection);
      const effectStyle = makeEffectStyle({
        boundVariables: {
          spread: { type: "VARIABLE_ALIAS", id: "VariableID:2:5" },
        },
      });

      const result = convertEffectStyleToShadow(effectStyle, variableNameMap);
      const shadowValue = result?.[effectStyle.name]
        .$value as ShadowObjectValue;

      expect(shadowValue.spread).toBe("{Elevation.spread}");
    });

    it("2つの effect のうち1つ目だけ color が bound の場合、effect ごとに独立して判定される", () => {
      const variableNameMap = createVariableNameMap(elevationCollection);
      const effectStyle: FigmaEffectStyle = {
        id: "style-bound-2",
        name: "TwoEffects",
        description: "",
        type: "EFFECT",
        effects: [
          {
            type: "DROP_SHADOW",
            visible: true,
            radius: 4,
            boundVariables: {
              color: { type: "VARIABLE_ALIAS", id: "VariableID:2:1" },
            },
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            spread: 0,
            blendMode: "NORMAL",
            showShadowBehindNode: false,
          },
          {
            type: "DROP_SHADOW",
            visible: true,
            radius: 4,
            boundVariables: {},
            color: { r: 1, g: 1, b: 1, a: 0.5 },
            offset: { x: 0, y: 2 },
            spread: 0,
            blendMode: "NORMAL",
            showShadowBehindNode: false,
          },
        ],
      };

      const result = convertEffectStyleToShadow(effectStyle, variableNameMap);
      const shadowValues = result?.[effectStyle.name]
        .$value as ShadowObjectValue[];

      expect(shadowValues[0].color).toBe("{Elevation.shadowColor}");
      expect(shadowValues[1].color).toEqual({
        colorSpace: "srgb",
        components: [1, 1, 1],
        alpha: 0.5,
      });
    });

    it("color の bound が map miss の場合、値フォールバック（alpha込み）＋ alias-resolve 警告が1件記録される", () => {
      const warnings = createWarningCollector();
      const effectStyle = makeEffectStyle({
        boundVariables: {
          color: { type: "VARIABLE_ALIAS", id: "VariableID:999:999" },
        },
      });

      const result = convertEffectStyleToShadow(
        effectStyle,
        new Map(),
        warnings,
      );
      const shadowValue = result?.[effectStyle.name]
        .$value as ShadowObjectValue;

      expect(shadowValue.color).toEqual({
        colorSpace: "srgb",
        components: [0, 0, 0],
        alpha: 0.25,
      });
      expect(warnings.items).toHaveLength(1);
      expect(warnings.items[0]).toMatchObject({
        severity: "warning",
        kind: "alias-resolve",
        source: "EffectStyle: Bound",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Variable ID not found"),
      );
    });

    it("INNER_SHADOW かつ bound がある場合、inset:true と参照が共存する", () => {
      const variableNameMap = createVariableNameMap(elevationCollection);
      const effectStyle: FigmaEffectStyle = {
        id: "style-bound-3",
        name: "InnerBound",
        description: "",
        type: "EFFECT",
        effects: [
          {
            type: "INNER_SHADOW",
            visible: true,
            radius: 4,
            boundVariables: {
              color: { type: "VARIABLE_ALIAS", id: "VariableID:2:1" },
            },
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            spread: 0,
            blendMode: "NORMAL",
          },
        ],
      };

      const result = convertEffectStyleToShadow(effectStyle, variableNameMap);
      const shadowValue = result?.[effectStyle.name]
        .$value as ShadowObjectValue;

      expect(shadowValue.inset).toBe(true);
      expect(shadowValue.color).toBe("{Elevation.shadowColor}");
    });
  });
});

describe("ShadowValue 型", () => {
  it("配列要素に ShadowObjectValue と TokenReference が混在していても代入できる（型レベルチェック）", () => {
    const mixedShadowValue: ShadowValue = [
      {
        color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.25 },
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 4, unit: "px" },
        blur: { value: 4, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
      "{Elevation.shadow}",
    ];

    expect(mixedShadowValue).toHaveLength(2);
  });
});
