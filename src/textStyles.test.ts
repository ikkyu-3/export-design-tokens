import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertTextStylesToTypography } from "./textStyles";
import { createWarningCollector } from "./warnings";
import { FigmaTextStyle } from "./types/figma";
import {
  DimensionValue,
  TypographyToken,
  TypographyValue,
} from "./types/token";
import { textStyles as mockTextStyles } from "../mocks/textStyles";

describe("convertTextStylesToTypography", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("正常なスタイルのみを渡した場合は全て変換される", () => {
    const warnings = createWarningCollector();
    const result = convertTextStylesToTypography(mockTextStyles, warnings);

    expect(Object.keys(result).sort()).toEqual(
      mockTextStyles.map((s) => s.name).sort(),
    );
    expect(warnings.items).toEqual([]);
  });

  it("変換に失敗するスタイルはスキップされ、正常なスタイルのみ変換される。失敗分は warnings に記録される", () => {
    const brokenStyle: FigmaTextStyle = {
      ...mockTextStyles[0],
      name: "broken",
      fontSize: 0,
      lineHeight: {
        unit: "PIXELS",
        value: 16,
      },
    };

    const warnings = createWarningCollector();
    const result = convertTextStylesToTypography(
      [mockTextStyles[0], brokenStyle],
      warnings,
    );

    expect(Object.keys(result)).toEqual([mockTextStyles[0].name]);
    expect(result["broken"]).toBeUndefined();

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "error",
      kind: "style-convert",
      source: "TextStyle: broken",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("同名の TextStyle が複数ある場合、結果は1件（後勝ち）に集約され duplicate warning が記録される", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const duplicatedStyle: FigmaTextStyle = {
      ...mockTextStyles[0],
      name: "duplicated",
      fontSize: 20,
    };
    const duplicatedStyleOverride: FigmaTextStyle = {
      ...mockTextStyles[0],
      name: "duplicated",
      fontSize: 24,
    };

    const warnings = createWarningCollector();
    const result = convertTextStylesToTypography(
      [duplicatedStyle, duplicatedStyleOverride],
      warnings,
    );

    expect(Object.keys(result)).toEqual(["duplicated"]);
    const value = (result["duplicated"] as TypographyToken)
      .$value as TypographyValue;
    expect((value.fontSize as DimensionValue).value).toBe(24);

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "TextStyle: duplicated",
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("命名制約に違反する TextStyle 名はサニタイズされ、name-sanitize warning が1件記録される", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const dottedStyle: FigmaTextStyle = {
      ...mockTextStyles[0],
      name: "heading.large",
    };

    const warnings = createWarningCollector();
    const result = convertTextStylesToTypography([dottedStyle], warnings);

    expect(Object.keys(result)).toEqual(["heading-large"]);

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("`/` 区切りの TextStyle 名はネスト Group になる（`Heading/H1` → `result.Heading.H1`）", () => {
    const nestedStyle: FigmaTextStyle = {
      ...mockTextStyles[0],
      name: "Heading/H1",
    };

    const warnings = createWarningCollector();
    const result = convertTextStylesToTypography([nestedStyle], warnings);

    const heading = result["Heading"] as unknown as Record<
      string,
      TypographyToken
    >;
    expect(heading.H1.$value).toBeDefined();
  });
});
