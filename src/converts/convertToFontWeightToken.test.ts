import { describe, it, expect } from "vitest";
import {
  convertToFontWeightTokenFromString,
  convertToFontWeightTokenFromNumber,
} from "./convertToFontWeightToken";
import {
  mockFontWeightVariable,
  mockFontWeightAliasVariable,
  mockFloatFontWeightVariable,
  mockFloatFontWeightAliasVariable,
} from "../../mocks/variables";

describe("convertToFontWeightTokenFromString", () => {
  it("STRING の生値を fontWeight トークンに変換できる", () => {
    const modeId = Object.keys(mockFontWeightVariable.valuesByMode)[0];
    const token = convertToFontWeightTokenFromString(
      mockFontWeightVariable,
      modeId,
    );

    expect(token.$type).toBe("fontWeight");
    expect(token.$value).toBe(mockFontWeightVariable.valuesByMode[modeId]);
  });

  it("STRING の VARIABLE_ALIAS は参照文字列として変換される", () => {
    const modeId = Object.keys(mockFontWeightAliasVariable.valuesByMode)[0];
    const ref = mockFontWeightAliasVariable.valuesByMode[
      modeId
    ] as VariableAlias;

    const token = convertToFontWeightTokenFromString(
      mockFontWeightAliasVariable,
      modeId,
    );

    expect(token.$type).toBe("fontWeight");
    expect(token.$value).toBe(`{${ref.id}}`);
  });

  it("指定したmodeIdが存在しない場合は例外を投げる（STRING）", () => {
    const invalidModeId = "does-not-exist";
    expect(() =>
      convertToFontWeightTokenFromString(mockFontWeightVariable, invalidModeId),
    ).toThrow();
  });
});

describe("convertToFontWeightTokenFromNumber", () => {
  it("FLOAT の数値を fontWeight トークンに変換できる", () => {
    const modeId = Object.keys(mockFloatFontWeightVariable.valuesByMode)[0];
    const token = convertToFontWeightTokenFromNumber(
      mockFloatFontWeightVariable,
      modeId,
    );

    expect(token.$type).toBe("fontWeight");
    expect(token.$value).toBe(mockFloatFontWeightVariable.valuesByMode[modeId]);
  });

  it("FLOAT の VARIABLE_ALIAS は参照文字列として変換される", () => {
    const modeId = Object.keys(
      mockFloatFontWeightAliasVariable.valuesByMode,
    )[0];
    const ref = mockFloatFontWeightAliasVariable.valuesByMode[
      modeId
    ] as VariableAlias;

    const token = convertToFontWeightTokenFromNumber(
      mockFloatFontWeightAliasVariable,
      modeId,
    );

    expect(token.$type).toBe("fontWeight");
    expect(token.$value).toBe(`{${ref.id}}`);
  });

  it("指定したmodeIdが存在しない場合は例外を投げる（FLOAT）", () => {
    const invalidModeId = "does-not-exist";
    expect(() =>
      convertToFontWeightTokenFromNumber(
        mockFloatFontWeightVariable,
        invalidModeId,
      ),
    ).toThrow();
  });
});
