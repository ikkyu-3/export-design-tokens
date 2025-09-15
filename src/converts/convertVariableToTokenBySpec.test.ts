import { describe, it, expect } from "vitest";
import { convertVariableToTokenBySpec } from "./convertVariableToTokenBySpec";
import {
  mockColorVariable,
  mockFloatFontWeightVariable,
  mockFloatVariableOpacityVariable,
  mockFloatVariableWidthHeightVariable,
  mockFontFamilyVariable,
  mockTextVariable,
} from "../../mocks/variables";

describe("convertVariableToTokenBySpec", () => {
  it("COLOR はスコープに関係なく color トークンへ変換される", () => {
    const modeId = Object.keys(mockColorVariable.valuesByMode)[0];
    const token = convertVariableToTokenBySpec(mockColorVariable, modeId);

    expect(token).not.toBeNull();
    expect(token!.$type).toBe("color");
  });

  it("FLOAT + FONT_WEIGHT スコープは fontWeight トークンへ変換される", () => {
    const modeId = Object.keys(mockFloatFontWeightVariable.valuesByMode)[0];
    const token = convertVariableToTokenBySpec(
      mockFloatFontWeightVariable,
      modeId,
    );

    expect(token).not.toBeNull();
    expect(token!.$type).toBe("fontWeight");
    expect(token!.$value).toBe(
      mockFloatFontWeightVariable.valuesByMode[modeId],
    );
  });

  it("FLOAT + OPACITY/ALL_SCOPES スコープは number トークンへ変換される（ここでは OPACITY）", () => {
    const modeId = Object.keys(
      mockFloatVariableOpacityVariable.valuesByMode,
    )[0];
    const token = convertVariableToTokenBySpec(
      mockFloatVariableOpacityVariable,
      modeId,
    );

    expect(token).not.toBeNull();
    expect(token!.$type).toBe("number");
    expect(token!.$value).toBe(
      mockFloatVariableOpacityVariable.valuesByMode[modeId],
    );
  });

  it("FLOAT + WIDTH_HEIGHT などの寸法系スコープは dimension トークンへ変換される", () => {
    const modeId = Object.keys(
      mockFloatVariableWidthHeightVariable.valuesByMode,
    )[0];
    const token = convertVariableToTokenBySpec(
      mockFloatVariableWidthHeightVariable,
      modeId,
    );

    expect(token).not.toBeNull();
    expect(token!.$type).toBe("dimension");
    expect(token!.$value).toEqual({
      value: mockFloatVariableWidthHeightVariable.valuesByMode[modeId],
      unit: "px",
    });
  });

  it("STRING + FONT_FAMILY スコープは fontFamily トークンへ変換される", () => {
    const modeId = Object.keys(mockFontFamilyVariable.valuesByMode)[0];
    const token = convertVariableToTokenBySpec(mockFontFamilyVariable, modeId);

    expect(token).not.toBeNull();
    expect(token!.$type).toBe("fontFamily");
    expect(token!.$value).toBe(mockFontFamilyVariable.valuesByMode[modeId]);
  });

  it("STRING + ALL_SCOPES は対象外のため null を返す（仕様上スキップ）", () => {
    const modeId = Object.keys(mockTextVariable.valuesByMode)[0];
    const token = convertVariableToTokenBySpec(mockTextVariable, modeId);

    expect(token).toBeNull();
  });
});
