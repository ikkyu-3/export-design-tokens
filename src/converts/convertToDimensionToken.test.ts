import { describe, it, expect } from "vitest";
import { convertToDimensionToken } from "./convertToDimensionToken";
import {
  mockFloatVariableWidthHeightVariable,
  mockFloatVariableWidthHeightAliasVariable,
  mockFloatAllScopesVariable,
} from "../../mocks/variables";

describe("convertToDimensionToken", () => {
  it("数値のFLOAT変数をDimensionToken(px)に変換できる", () => {
    const modeId = Object.keys(
      mockFloatVariableWidthHeightVariable.valuesByMode,
    )[0];
    const raw = mockFloatVariableWidthHeightVariable.valuesByMode[modeId];

    const token = convertToDimensionToken(
      mockFloatVariableWidthHeightVariable,
      modeId,
    );

    expect(token.$type).toBe("dimension");
    expect(token.$value).toEqual({ value: raw, unit: "px" });
  });

  it("VARIABLE_ALIASは参照文字列として変換される", () => {
    const modeId = Object.keys(
      mockFloatVariableWidthHeightAliasVariable.valuesByMode,
    )[0];
    const ref = mockFloatVariableWidthHeightAliasVariable.valuesByMode[
      modeId
    ] as VariableAlias;

    const token = convertToDimensionToken(
      mockFloatVariableWidthHeightAliasVariable,
      modeId,
    );

    expect(token.$type).toBe("dimension");
    expect(token.$value).toBe(`{${ref.id}}`);
  });

  it("ALL_SCOPES を含むFLOAT変数はエラーになる（仕様による制約）", () => {
    const modeId = Object.keys(mockFloatAllScopesVariable.valuesByMode)[0];
    expect(() =>
      convertToDimensionToken(mockFloatAllScopesVariable, modeId),
    ).toThrow();
  });

  it("指定したmodeIdが存在しない場合は例外を投げる", () => {
    const invalidModeId = "does-not-exist";
    expect(() =>
      convertToDimensionToken(
        mockFloatVariableWidthHeightVariable,
        invalidModeId,
      ),
    ).toThrow();
  });
});
