import { describe, it, expect } from "vitest";
import { convertToFontFamilyToken } from "./convertToFontFamilyToken";
import {
  mockFontFamilyVariable,
  mockFontFamilyAliasVariable,
} from "../../mocks/variables";

describe("convertToFontFamilyToken", () => {
  it("STRING の生値を fontFamily トークンに変換できる", () => {
    const modeId = Object.keys(mockFontFamilyVariable.valuesByMode)[0];
    const token = convertToFontFamilyToken(mockFontFamilyVariable, modeId);

    expect(token.$type).toBe("fontFamily");
    expect(token.$value).toBe(mockFontFamilyVariable.valuesByMode[modeId]);
  });

  it("VARIABLE_ALIAS は参照文字列として変換される", () => {
    const modeId = Object.keys(mockFontFamilyAliasVariable.valuesByMode)[0];
    const ref = mockFontFamilyAliasVariable.valuesByMode[
      modeId
    ] as VariableAlias;

    const token = convertToFontFamilyToken(mockFontFamilyAliasVariable, modeId);

    expect(token.$type).toBe("fontFamily");
    expect(token.$value).toBe(`{${ref.id}}`);
  });

  it("指定したmodeIdが存在しない場合は例外を投げる", () => {
    const invalidModeId = "does-not-exist";
    expect(() =>
      convertToFontFamilyToken(mockFontFamilyVariable, invalidModeId),
    ).toThrow();
  });
});
