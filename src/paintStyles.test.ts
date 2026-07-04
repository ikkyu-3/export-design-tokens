import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertPaintStylesToTokens } from "./paintStyles";
import { createWarningCollector } from "./warnings";
import { createVariableNameMap } from "./resolve/createVariableNameMap";
import { FigmaColorStyle } from "./types/figma";
import { ColorToken } from "./types/token";

describe("convertPaintStylesToTokens", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("複数の PaintStyle をまとめて color/gradient トークンへ変換する", () => {
    const paintStyles: FigmaColorStyle[] = [
      {
        id: "style-1",
        name: "solid",
        description: "",
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
      },
      {
        id: "style-2",
        name: "gradient",
        description: "",
        type: "PAINT",
        paints: [
          {
            type: "GRADIENT_LINEAR",
            visible: true,
            opacity: 1,
            blendMode: "NORMAL",
            gradientStops: [
              { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
              { color: { r: 0, g: 0, b: 1, a: 1 }, position: 1 },
            ],
            gradientTransform: [
              [1, 0, 0],
              [0, 1, 0],
            ],
          },
        ],
      },
    ];

    const emptyMap = createVariableNameMap([]);
    const warnings = createWarningCollector();
    const tokens = convertPaintStylesToTokens(paintStyles, emptyMap, warnings);

    expect(Object.keys(tokens).sort()).toEqual(["gradient", "solid"]);
    expect((tokens["solid"] as ColorToken).$type).toBe("color");
    expect(warnings.items).toEqual([]);
  });

  it("variableNameMap にエイリアスが見つからない場合、フォールバックしつつ warnings に記録する", () => {
    const paintStyles: FigmaColorStyle[] = [
      {
        id: "style-3",
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
                id: "VariableID:not-found",
              },
            },
          },
        ],
      },
    ];

    const emptyMap = createVariableNameMap([]);
    const warnings = createWarningCollector();
    const tokens = convertPaintStylesToTokens(paintStyles, emptyMap, warnings);

    expect(Object.keys(tokens)).toEqual(["missing"]);
    expect((tokens["missing"] as ColorToken).$type).toBe("color");

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "alias-resolve",
      source: "PaintStyle: missing",
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("同名の PaintStyle が複数ある場合、結果は1件（後勝ち）に集約され duplicate warning が記録される", () => {
    const paintStyles: FigmaColorStyle[] = [
      {
        id: "style-4",
        name: "duplicated",
        description: "",
        type: "PAINT",
        paints: [
          {
            type: "SOLID",
            visible: true,
            opacity: 1,
            blendMode: "NORMAL",
            color: { r: 1, g: 0, b: 0 },
            boundVariables: {},
          },
        ],
      },
      {
        id: "style-5",
        name: "duplicated",
        description: "",
        type: "PAINT",
        paints: [
          {
            type: "SOLID",
            visible: true,
            opacity: 1,
            blendMode: "NORMAL",
            color: { r: 0, g: 0, b: 1 },
            boundVariables: {},
          },
        ],
      },
    ];

    const emptyMap = createVariableNameMap([]);
    const warnings = createWarningCollector();
    const tokens = convertPaintStylesToTokens(paintStyles, emptyMap, warnings);

    expect(Object.keys(tokens)).toEqual(["duplicated"]);
    expect((tokens["duplicated"] as ColorToken).$value).toEqual({
      colorSpace: "srgb",
      components: [0, 0, 1],
      alpha: 1,
    });

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "PaintStyle: duplicated",
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});
