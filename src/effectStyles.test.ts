import { describe, it, expect } from "vitest";
import { convertEffectStylesToShadows } from "./effectStyles";
import { createWarningCollector } from "./warnings";
import { effectStyles as mockEffectStyles } from "../mocks/effectStyles";
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
});
