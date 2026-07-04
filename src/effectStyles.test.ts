import { describe, it, expect, vi } from "vitest";
import { convertEffectStylesToShadows } from "./effectStyles";
import { createWarningCollector } from "./warnings";
import { effectStyles as mockEffectStyles } from "../mocks/effectStyles";
import { FigmaEffectStyle } from "./types/figma";
import { ShadowObjectValue } from "./types/token";

describe("convertEffectStylesToShadows", () => {
  it("visible な DROP_SHADOW/INNER_SHADOW を shadow トークンへ変換する", () => {
    const warnings = createWarningCollector();
    const result = convertEffectStylesToShadows(mockEffectStyles, warnings);

    expect(Object.keys(result).sort()).toEqual(
      mockEffectStyles.map((s) => s.name).sort(),
    );

    const inset = result["inner shadow"].$value as ShadowObjectValue;
    expect(inset.inset).toBe(true);

    expect(warnings.items).toEqual([]);
  });

  it("visible な shadow effect が無い場合はそのスタイルを結果に含めない", () => {
    const warnings = createWarningCollector();
    const result = convertEffectStylesToShadows(
      [
        {
          id: "S:no-visible-effects",
          name: "invisible",
          description: "",
          type: "EFFECT",
          effects: [
            {
              type: "DROP_SHADOW",
              visible: false,
              radius: 4,
              boundVariables: {},
              color: { r: 0, g: 0, b: 0, a: 0.25 },
              offset: { x: 0, y: 4 },
              spread: 0,
              blendMode: "NORMAL",
              showShadowBehindNode: false,
            },
          ],
        },
      ],
      warnings,
    );

    expect(result).toEqual({});
    expect(warnings.items).toEqual([]);
  });

  it("同名の EffectStyle が複数ある場合、1件に集約され duplicate warning が記録される", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const firstStyle: FigmaEffectStyle = {
      ...mockEffectStyles[0],
      name: "duplicated",
    };
    const secondStyle: FigmaEffectStyle = {
      id: "S:duplicated-2,",
      name: "duplicated",
      description: "",
      type: "EFFECT",
      effects: [
        {
          type: "DROP_SHADOW",
          visible: true,
          radius: 8,
          boundVariables: {},
          color: { r: 0, g: 0, b: 0, a: 0.25 },
          offset: { x: 0, y: 8 },
          spread: 0,
          blendMode: "NORMAL",
          showShadowBehindNode: false,
        },
      ],
    };

    const warnings = createWarningCollector();
    const result = convertEffectStylesToShadows(
      [firstStyle, secondStyle],
      warnings,
    );

    expect(Object.keys(result)).toEqual(["duplicated"]);
    expect((result["duplicated"].$value as ShadowObjectValue).blur).toEqual({
      value: 8,
      unit: "px",
    });

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "EffectStyle: duplicated",
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("命名制約に違反する EffectStyle 名はサニタイズされ、warning が1件記録される", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const dottedStyle: FigmaEffectStyle = {
      ...mockEffectStyles[0],
      name: "shadow.soft",
    };

    const warnings = createWarningCollector();
    const result = convertEffectStylesToShadows([dottedStyle], warnings);

    expect(Object.keys(result)).toEqual(["shadow-soft"]);

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(1);

    warnSpy.mockRestore();
  });
});
