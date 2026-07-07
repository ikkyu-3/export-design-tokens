import { describe, it, expect } from "vitest";
import {
  isColorValue,
  isAliasValue,
  toTokenReference,
  roundTo2ndDecimal,
  makeColorValue,
} from "./util";
import { getResolvedValue } from "../resolve/resolvedAlias";
import {
  mockColorVariable,
  mockColorAliasVariable,
} from "../../mocks/variables";

describe("isVariableAlias", () => {
  it("VARIABLE_ALIAS のオブジェクトを正しく判定できる", () => {
    const modeId = Object.keys(mockColorAliasVariable.valuesByMode)[0];
    const value = mockColorAliasVariable.valuesByMode[modeId];
    expect(isAliasValue(value)).toBe(true);
  });

  it("RGB 値（エイリアスではない）を false と判定する", () => {
    const modeId = Object.keys(mockColorVariable.valuesByMode)[0];
    const value = mockColorVariable.valuesByMode[modeId];
    expect(isAliasValue(value)).toBe(false);
  });

  it("undefined / null / プリミティブ型は false と判定する", () => {
    expect(isAliasValue(undefined)).toBe(false);
    expect(isAliasValue(null)).toBe(false);
    expect(isAliasValue(123)).toBe(false);
    expect(isAliasValue("abc")).toBe(false);
    expect(isAliasValue(true)).toBe(false);
  });

  it("類似オブジェクトでも type が一致しなければ false", () => {
    const likeAlias = { type: "NOT_ALIAS", id: "x" };
    expect(isAliasValue(likeAlias)).toBe(false);
  });

  it("id が文字列でない場合は false", () => {
    const badAlias = { type: "VARIABLE_ALIAS", id: 123 };
    expect(isAliasValue(badAlias)).toBe(false);
  });
});

describe("isColorValue", () => {
  it("RGB(A) オブジェクトを color 値として true 判定する", () => {
    const modeId = Object.keys(mockColorVariable.valuesByMode)[0];
    const rgb = mockColorVariable.valuesByMode[modeId]!;
    expect(isColorValue(rgb)).toBe(true);
  });

  it("VARIABLE_ALIAS は color 値として false 判定する", () => {
    const modeId = Object.keys(mockColorAliasVariable.valuesByMode)[0];
    const alias = mockColorAliasVariable.valuesByMode[modeId]!;
    expect(isColorValue(alias)).toBe(false);
  });

  it("null/undefined/プリミティブは color 値として false 判定する", () => {
    expect(isColorValue(null)).toBe(false);
    expect(isColorValue(undefined)).toBe(false);
    expect(isColorValue(0)).toBe(false);
    expect(isColorValue("str")).toBe(false);
    expect(isColorValue(true)).toBe(false);
  });

  it("r/g/b のいずれかが欠けている場合は false 判定する", () => {
    expect(isColorValue({ r: 1, g: 1 })).toBe(false);
    expect(isColorValue({ r: 1, b: 1 })).toBe(false);
    expect(isColorValue({ g: 1, b: 1 })).toBe(false);
  });
});

describe("toTokenReference", () => {
  it("VARIABLE_ALIAS から参照文字列 {id} を生成する", () => {
    const modeId = Object.keys(mockColorAliasVariable.valuesByMode)[0];
    const raw = getResolvedValue(mockColorAliasVariable, modeId);
    if (!isAliasValue(raw)) throw new Error("mock は alias 値であるべき");
    expect(toTokenReference(raw)).toBe(`{${raw.id}}`);
  });

  it("未 resolve の VariableAlias は型レベルで拒否される（実行時挙動は不変）", () => {
    const rawAlias: VariableAlias = {
      type: "VARIABLE_ALIAS",
      id: "VariableID:88:2",
    };
    // @ts-expect-error resolve を通していない素の VariableAlias は toTokenReference に渡せない（issue #26 の enforcement）
    const result = toTokenReference(rawAlias);
    expect(result).toBe("{VariableID:88:2}");
  });
});

describe("roundTo2ndDecimal", () => {
  it("正の数を小数第2位で四捨五入する", () => {
    expect(roundTo2ndDecimal(1.234)).toBe(1.23);
    expect(roundTo2ndDecimal(1.235)).toBe(1.24);
    expect(roundTo2ndDecimal(1.5)).toBe(1.5);
  });

  it("負の数を小数第2位で四捨五入する", () => {
    expect(roundTo2ndDecimal(-1.234)).toBe(-1.23);
    expect(roundTo2ndDecimal(-1.235)).toBe(-1.23);
    expect(roundTo2ndDecimal(-1.236)).toBe(-1.24);
  });

  it("整数はそのまま返す", () => {
    expect(roundTo2ndDecimal(10)).toBe(10);
    expect(roundTo2ndDecimal(0)).toBe(0);
  });

  it("境界値 0.005 を正しく丸める", () => {
    expect(roundTo2ndDecimal(0.005)).toBe(0.01);
    expect(roundTo2ndDecimal(1.005)).toBe(1.01);
  });

  it("Infinity を渡すと TypeError を投げる", () => {
    expect(() => roundTo2ndDecimal(Infinity)).toThrow(TypeError);
    expect(() => roundTo2ndDecimal(-Infinity)).toThrow(TypeError);
  });

  it("NaN を渡すと TypeError を投げる", () => {
    expect(() => roundTo2ndDecimal(NaN)).toThrow(TypeError);
  });
});

describe("makeColorValue", () => {
  it("a === 1 の場合は alpha キーを省略する", () => {
    expect(makeColorValue(0.1, 0.2, 0.3, 1)).toEqual({
      colorSpace: "srgb",
      components: [0.1, 0.2, 0.3],
    });
    expect("alpha" in makeColorValue(0.1, 0.2, 0.3, 1)).toBe(false);
  });

  it("a === 0 の場合は alpha: 0 が出力される", () => {
    expect(makeColorValue(0.1, 0.2, 0.3, 0)).toEqual({
      colorSpace: "srgb",
      components: [0.1, 0.2, 0.3],
      alpha: 0,
    });
  });

  it("a === 0.5 の場合は alpha: 0.5 が出力される", () => {
    expect(makeColorValue(0.1, 0.2, 0.3, 0.5)).toEqual({
      colorSpace: "srgb",
      components: [0.1, 0.2, 0.3],
      alpha: 0.5,
    });
  });

  it("a === 0.9999 の場合は丸めずそのまま alpha に出力される", () => {
    expect(makeColorValue(0.1, 0.2, 0.3, 0.9999)).toEqual({
      colorSpace: "srgb",
      components: [0.1, 0.2, 0.3],
      alpha: 0.9999,
    });
  });
});
