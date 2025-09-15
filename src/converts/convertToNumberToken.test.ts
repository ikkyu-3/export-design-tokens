import { describe, it, expect } from "vitest";
import {
  mockFloatVariableWidthHeightAliasVariable,
  mockFloatVariableWidthHeightVariable,
} from "../../mocks/variables";
import { convertToNumberToken } from "./convertToNumberToken";

describe("convertToNumberToken", () => {
  it("数値のFLOAT変数をNumberTokenに変換できる", () => {
    const modeId = Object.keys(
      mockFloatVariableWidthHeightVariable.valuesByMode,
    )[0];
    const token = convertToNumberToken(
      mockFloatVariableWidthHeightVariable,
      modeId,
    );

    expect(token.$type).toBe("number");
    expect(token.$value).toBe(
      mockFloatVariableWidthHeightVariable.valuesByMode[modeId],
    );
  });

  it("VARIABLE_ALIASは参照文字列として変換される", () => {
    const modeId = Object.keys(
      mockFloatVariableWidthHeightAliasVariable.valuesByMode,
    )[0];
    const ref = mockFloatVariableWidthHeightAliasVariable.valuesByMode[
      modeId
    ] as VariableAlias;

    const token = convertToNumberToken(
      mockFloatVariableWidthHeightAliasVariable,
      modeId,
    );

    expect(token.$type).toBe("number");
    expect(token.$value).toBe(`{${ref.id}}`);
  });

  it("指定したmodeIdが存在しない場合は例外を投げる", () => {
    const invalidModeId = "does-not-exist";
    expect(() =>
      convertToNumberToken(mockFloatVariableWidthHeightVariable, invalidModeId),
    ).toThrow();
  });
});
