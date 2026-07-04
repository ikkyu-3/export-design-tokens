import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertTextStylesToTypography } from "./textStyles";
import { createWarningCollector } from "./warnings";
import { FigmaTextStyle } from "./types/figma";
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
});
