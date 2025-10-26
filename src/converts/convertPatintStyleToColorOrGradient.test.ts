import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertPaintStyleToTokens } from "./convertPatintStyleToColorOrGradient";
import { FigmaColorStyle } from "../types/figma";
import { createVariableNameMap } from "../resolve/createVariableNameMap";
import type { FigmaCollectionData } from "../collections";
import {
  ColorToken,
  ColorValue,
  GradientToken,
  GradientValue,
} from "../types/token";

describe("convertPaintStyleToTokens", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("単一の SOLID paint を color トークンに変換する", () => {
    const paintStyle: FigmaColorStyle = {
      id: "style-1",
      name: "solid",
      description: "test solid",
      type: "PAINT",
      paints: [
        {
          type: "SOLID",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          color: { r: 0.5, g: 0.5, b: 0.5 },
          boundVariables: {},
        },
      ],
    };

    const emptyMap = new Map();
    const tokens = convertPaintStyleToTokens(paintStyle, emptyMap);

    expect(Object.keys(tokens)).toEqual(["solid"]);
    const token = tokens["solid"] as ColorToken;
    expect(token.$type).toBe("color");
    expect(token.$description).toBe("test solid");
    expect(token.$value).toEqual({
      colorSpace: "srgb",
      components: [0.5, 0.5, 0.5],
      alpha: 1,
    });
  });

  it("複数の SOLID paint を color-{index + 1} で命名する", () => {
    const paintStyle: FigmaColorStyle = {
      id: "style-2",
      name: "solids",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "SOLID",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          color: { r: 0.8, g: 0.8, b: 0.8 },
          boundVariables: {},
        },
        {
          type: "SOLID",
          visible: true,
          opacity: 0.5,
          blendMode: "NORMAL",
          color: { r: 0, g: 0, b: 0 },
          boundVariables: {},
        },
      ],
    };

    const emptyMap = new Map();
    const tokens = convertPaintStyleToTokens(paintStyle, emptyMap);

    expect(Object.keys(tokens).sort()).toEqual([
      "solids-color-0",
      "solids-color-1",
    ]);
    expect((tokens["solids-color-0"] as ColorToken).$type).toBe("color");
    expect((tokens["solids-color-1"] as ColorToken).$type).toBe("color");
  });

  it("単一の GRADIENT_LINEAR を gradient トークンに変換する", () => {
    const paintStyle: FigmaColorStyle = {
      id: "style-3",
      name: "gradient",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "GRADIENT_LINEAR",
          visible: true,
          opacity: 0.5,
          blendMode: "NORMAL",
          gradientStops: [
            {
              color: { r: 1, g: 0, b: 0, a: 1 },
              position: 0,
              boundVariables: {},
            },
            {
              color: { r: 0, g: 0, b: 1, a: 1 },
              position: 1,
              boundVariables: {},
            },
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        },
      ],
    };

    const emptyMap = new Map();
    const tokens = convertPaintStyleToTokens(paintStyle, emptyMap);

    expect(Object.keys(tokens)).toEqual(["gradient"]);
    const token = tokens["gradient"] as GradientToken;
    expect(token.$type).toBe("gradient");
    const value = token.$value as GradientValue;
    expect(value).toHaveLength(2);
    expect(value[0].position).toBe(0);
    expect((value[0].color as ColorValue).alpha).toBe(0.5);
    expect(value[1].position).toBe(1);
    expect((value[1].color as ColorValue).alpha).toBe(0.5);
  });

  it("複数の GRADIENT_LINEAR を gradient-{index} で命名する", () => {
    const paintStyle: FigmaColorStyle = {
      id: "style-4",
      name: "gradients",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "GRADIENT_LINEAR",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          gradientStops: [
            {
              color: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
              position: 0,
              boundVariables: {},
            },
            {
              color: { r: 0.4, g: 0.4, b: 0.4, a: 1 },
              position: 1,
              boundVariables: {},
            },
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        },
        {
          type: "GRADIENT_LINEAR",
          visible: true,
          opacity: 0.2,
          blendMode: "NORMAL",
          gradientStops: [
            {
              color: { r: 0, g: 0, b: 0, a: 0 },
              position: 0.6,
              boundVariables: {},
            },
            {
              color: { r: 0, g: 0, b: 0, a: 1 },
              position: 1,
              boundVariables: {},
            },
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        },
      ],
    };

    const emptyMap = new Map();
    const tokens = convertPaintStyleToTokens(paintStyle, emptyMap);

    expect(Object.keys(tokens).sort()).toEqual([
      "gradients-gradient-0",
      "gradients-gradient-1",
    ]);
  });

  it("IMAGE/VIDEO は変換対象外", () => {
    const paintStyle: FigmaColorStyle = {
      id: "style-5",
      name: "image",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "IMAGE",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          scaleMode: "FILL",
          imageTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
          scalingFactor: 0.5,
          rotation: 0,
          filters: {
            exposure: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            tint: 0,
            highlights: 0,
            shadows: 0,
          },
          imageHash: "test-hash",
        },
      ],
    };

    const emptyMap = new Map();
    const tokens = convertPaintStyleToTokens(paintStyle, emptyMap);

    expect(Object.keys(tokens)).toEqual([]);
  });

  it("boundVariables がある場合はエイリアスとして解決する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "VariableCollectionId:1:2",
        name: "Colors",
        defaultModeId: "1:0",
        modes: [{ modeId: "1:0", name: "Mode 1" }],
        variables: [
          {
            id: "VariableID:133:3",
            name: "primary",
            resolvedType: "COLOR",
            valuesByMode: { "1:0": { r: 1, g: 0, b: 0, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const variableNameMap = createVariableNameMap(collections);

    const paintStyle: FigmaColorStyle = {
      id: "S:46b7d0d6d2af8aa6540cb3e5cf7cf8d8b6b84ff4,",
      name: "variable",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "SOLID",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          color: {
            r: 0.740403413772583,
            g: 0.740403413772583,
            b: 0.740403413772583,
          },
          boundVariables: {
            color: {
              type: "VARIABLE_ALIAS",
              id: "VariableID:133:3",
            },
          },
        },
      ],
    };

    const tokens = convertPaintStyleToTokens(paintStyle, variableNameMap);

    expect(Object.keys(tokens)).toEqual(["variable"]);
    const token = tokens["variable"] as ColorToken;
    expect(token.$type).toBe("color");
    expect(token.$value).toBe("{Colors.primary}");
  });

  it("エイリアスが見つからない場合は color 値をフォールバックとして使用する", () => {
    const paintStyle: FigmaColorStyle = {
      id: "style-7",
      name: "missing",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "SOLID",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          color: { r: 0.5, g: 0.5, b: 0.5 },
          boundVariables: {
            color: {
              type: "VARIABLE_ALIAS",
              id: "VariableID:999:999",
            },
          },
        },
      ],
    };

    const emptyMap = new Map();
    const tokens = convertPaintStyleToTokens(paintStyle, emptyMap);

    expect(Object.keys(tokens)).toEqual(["missing"]);
    const token = tokens["missing"] as ColorToken;
    expect(token.$type).toBe("color");
    expect(token.$value).toEqual({
      colorSpace: "srgb",
      components: [0.5, 0.5, 0.5],
      alpha: 1,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Variable ID not found"),
    );
  });

  it("gradient stop にエイリアスがある場合も解決する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "VariableCollectionId:1:2",
        name: "Colors",
        defaultModeId: "1:0",
        modes: [{ modeId: "1:0", name: "Mode 1" }],
        variables: [
          {
            id: "VariableID:88:2",
            name: "start",
            resolvedType: "COLOR",
            valuesByMode: { "1:0": { r: 1, g: 0, b: 0, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:88:3",
            name: "end",
            resolvedType: "COLOR",
            valuesByMode: { "1:0": { r: 0, g: 0, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const variableNameMap = createVariableNameMap(collections);

    const paintStyle: FigmaColorStyle = {
      id: "style-8",
      name: "gradientWithAlias",
      description: "",
      type: "PAINT",
      paints: [
        {
          type: "GRADIENT_LINEAR",
          visible: true,
          opacity: 1,
          blendMode: "NORMAL",
          gradientStops: [
            {
              color: { r: 1, g: 0, b: 0, a: 1 },
              position: 0,
              boundVariables: {
                color: {
                  type: "VARIABLE_ALIAS",
                  id: "VariableID:88:2",
                },
              },
            },
            {
              color: { r: 0, g: 0, b: 1, a: 1 },
              position: 1,
              boundVariables: {
                color: {
                  type: "VARIABLE_ALIAS",
                  id: "VariableID:88:3",
                },
              },
            },
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        },
      ],
    };

    const tokens = convertPaintStyleToTokens(paintStyle, variableNameMap);

    expect(Object.keys(tokens)).toEqual(["gradientWithAlias"]);
    const token = tokens["gradientWithAlias"] as GradientToken;
    expect(token.$type).toBe("gradient");
    const value = token.$value as GradientValue;
    expect(value[0].color).toBe("{Colors.start}");
    expect(value[1].color).toBe("{Colors.end}");
  });
});
