import { describe, it, expect } from "vitest";
import { convertToColorToken } from "./convertToColorToken";
import {
  mockColorVariable,
  mockColorAliasVariable,
} from "../../mocks/variables";
import { FigmaRGBA } from "../types/figma";

describe("convertToColorToken", () => {
  it("RGB値をColorTokenに変換できる", () => {
    const modeId = Object.keys(mockColorVariable.valuesByMode)[0];
    const v = mockColorVariable.valuesByMode[modeId] as FigmaRGBA;
    const token = convertToColorToken(mockColorVariable, modeId);

    expect(token.$type).toBe("color");
    expect(token.$value).toEqual({
      colorSpace: "srgb",
      components: [v.r, v.g, v.b],
      alpha: v.a,
    });
  });

  it("VARIABLE_ALIASを参照として変換する", () => {
    const modeId = Object.keys(mockColorAliasVariable.valuesByMode)[0];
    const ref = mockColorAliasVariable.valuesByMode[modeId] as VariableAlias;

    const token = convertToColorToken(mockColorAliasVariable, modeId);

    expect(token.$type).toBe("color");
    expect(token.$value).toBe(`{${ref.id}}`);
  });

  it("指定したmodeIdに値が存在しない場合は例外を投げる", () => {
    const invalidModeId = "does-not-exist";
    expect(() =>
      convertToColorToken(mockColorVariable, invalidModeId),
    ).toThrow();
  });

  it("alphaが未指定の場合は1として扱われる", () => {
    const modeId = Object.keys(mockColorVariable.valuesByMode)[0];
    const original = mockColorVariable.valuesByMode[modeId] as FigmaRGBA;
    const variableWithoutAlpha = {
      ...mockColorVariable,
      valuesByMode: {
        [modeId]: { r: original.r, g: original.g, b: original.b },
      },
    };

    const token = convertToColorToken(variableWithoutAlpha, modeId);

    expect(token.$type).toBe("color");
    expect(token.$value).toEqual({
      colorSpace: "srgb",
      components: [original.r, original.g, original.b],
      alpha: 1,
    });
  });
});
