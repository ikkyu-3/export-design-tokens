import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertTextStyleToTypography } from "./convertTextStyleToTypography";
import { FigmaTextStyle } from "../types/figma";
import { DimensionValue, TypographyValue } from "../types/token";
import { createVariableNameMap } from "../resolve/createVariableNameMap";
import { createWarningCollector } from "../warnings";
import type { FigmaCollectionData } from "../collections";

describe("convertTextStyleToTypography", () => {
  it("基本的な TextStyle を Typography トークンに変換する", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-1",
      name: "Body",
      description: "",
      type: "TEXT",
      fontSize: 16,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "PERCENT", value: 150 },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const typography = result[textStyle.name];
    const value = typography.$value as TypographyValue;
    expect(typography.$type).toBe("typography");
    expect(typography.$description).toBe("");
    expect(value.fontFamily).toBe("Inter");
    expect(value.fontWeight).toBe(400);
    expect(value.fontSize).toEqual({ value: 16, unit: "px" });
    expect(value.letterSpacing).toEqual({ value: 0, unit: "px" });
    expect(value.lineHeight).toBe(1.5);
  });

  it("description が設定されている場合は $description に反映される", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-10",
      name: "Body",
      description: "本文用のテキストスタイル",
      type: "TEXT",
      fontSize: 16,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "AUTO" },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    expect(result[textStyle.name].$description).toBe(
      "本文用のテキストスタイル",
    );
  });

  it("fontWeight を style 名から正しく変換する", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-2",
      name: "Heading",
      description: "",
      type: "TEXT",
      fontSize: 24,
      fontName: { family: "Inter", style: "Bold" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "AUTO" },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const value = result[textStyle.name].$value as TypographyValue;
    expect(value.fontWeight).toBe(700);
  });

  it("lineHeight が AUTO の場合は 1.5 を返す", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-3",
      name: "Caption",
      description: "",
      type: "TEXT",
      fontSize: 12,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "AUTO" },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const value = result[textStyle.name].$value as TypographyValue;

    expect(value.lineHeight).toBe(1.5);
  });

  it("lineHeight が PERCENT の場合は比率に変換する", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-4",
      name: "Title",
      description: "",
      type: "TEXT",
      fontSize: 32,
      fontName: { family: "Inter", style: "Medium" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "PERCENT", value: 120 },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const value = result[textStyle.name].$value as TypographyValue;

    expect(value.lineHeight).toBe(1.2);
  });

  it("lineHeight が PIXELS で比率範囲内(0.5〜3)の場合はそのまま返す", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-5",
      name: "Dense",
      description: "",
      type: "TEXT",
      fontSize: 16,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "PIXELS", value: 1.5 },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const value = result[textStyle.name].$value as TypographyValue;

    expect(value.lineHeight).toBe(1.5);
  });

  it("lineHeight が PIXELS で実寸の場合は fontSize で割って比率を算出する", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-6",
      name: "Large",
      description: "",
      type: "TEXT",
      fontSize: 16,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "PIXELS", value: 24 },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const value = result[textStyle.name].$value as TypographyValue;

    expect(value.lineHeight).toBe(1.5);
  });

  it("letterSpacing が PERCENT の場合は px に変換する", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-7",
      name: "Spaced",
      description: "",
      type: "TEXT",
      fontSize: 16,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 5 },
      lineHeight: { unit: "AUTO" },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    const result = convertTextStyleToTypography(textStyle, new Map());
    const value = result[textStyle.name].$value as TypographyValue;

    expect(value.letterSpacing).toEqual({ value: 0.8, unit: "px" });
  });

  it("不正な lineHeight.value (Infinity) は TypeError を投げる", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-8",
      name: "Invalid",
      description: "",
      type: "TEXT",
      fontSize: 16,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "PIXELS", value: Infinity },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    expect(() => convertTextStyleToTypography(textStyle, new Map())).toThrow(
      TypeError,
    );
  });

  it("fontSize が 0 の場合は TypeError を投げる", () => {
    const textStyle: FigmaTextStyle = {
      id: "style-9",
      name: "ZeroSize",
      description: "",
      type: "TEXT",
      fontSize: 0,
      fontName: { family: "Inter", style: "Regular" },
      textCase: "ORIGINAL",
      textDecoration: "NONE",
      letterSpacing: { unit: "PERCENT", value: 0 },
      lineHeight: { unit: "PIXELS", value: 24 },
      leadingTrim: "NONE",
      paragraphIndent: 0,
      paragraphSpacing: 0,
      listSpacing: 0,
      hangingPunctuation: false,
      hangingList: false,
    };

    expect(() => convertTextStyleToTypography(textStyle, new Map())).toThrow(
      TypeError,
    );
  });

  describe("boundVariables の参照化", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    const typoCollection: FigmaCollectionData[] = [
      {
        id: "VariableCollectionId:1:1",
        name: "Typo",
        defaultModeId: "1:0",
        modes: [{ modeId: "1:0", name: "Mode 1" }],
        variables: [
          {
            id: "VariableID:1:1",
            name: "size",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 20 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:1:2",
            name: "family",
            resolvedType: "STRING",
            valuesByMode: { "1:0": "Roboto" },
            description: "",
            scopes: ["FONT_FAMILY"],
          },
          {
            id: "VariableID:1:3",
            name: "tracking",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 1 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:1:4",
            name: "leading",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 1.5 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "VariableID:1:5",
            name: "weight",
            resolvedType: "FLOAT",
            valuesByMode: { "1:0": 700 },
            description: "",
            scopes: ["FONT_WEIGHT"],
          },
          {
            id: "VariableID:1:6",
            name: "styleName",
            resolvedType: "STRING",
            valuesByMode: { "1:0": "italic" },
            description: "",
            scopes: ["FONT_STYLE"],
          },
        ],
      },
    ];

    function makeTextStyle(
      overrides: Partial<FigmaTextStyle> = {},
    ): FigmaTextStyle {
      return {
        id: "style-bound-1",
        name: "Bound",
        description: "",
        type: "TEXT",
        fontSize: 16,
        fontName: { family: "Inter", style: "Regular" },
        textCase: "ORIGINAL",
        textDecoration: "NONE",
        letterSpacing: { unit: "PERCENT", value: 0 },
        lineHeight: { unit: "PERCENT", value: 150 },
        leadingTrim: "NONE",
        paragraphIndent: 0,
        paragraphSpacing: 0,
        listSpacing: 0,
        hangingPunctuation: false,
        hangingList: false,
        ...overrides,
      };
    }

    it("fontSize が bound の場合、fontSize は参照になり他は計算値のまま", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        boundVariables: {
          fontSize: { type: "VARIABLE_ALIAS", id: "VariableID:1:1" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontSize).toBe("{Typo.size}");
      expect(value.fontFamily).toBe("Inter");
      expect(value.fontWeight).toBe(400);
      expect(value.letterSpacing).toEqual({ value: 0, unit: "px" });
      expect(value.lineHeight).toBe(1.5);
    });

    it("fontFamily が bound の場合、参照になる", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        boundVariables: {
          fontFamily: { type: "VARIABLE_ALIAS", id: "VariableID:1:2" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontFamily).toBe("{Typo.family}");
    });

    it("letterSpacing が bound の場合、参照になる", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        boundVariables: {
          letterSpacing: { type: "VARIABLE_ALIAS", id: "VariableID:1:3" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.letterSpacing).toBe("{Typo.tracking}");
    });

    it("lineHeight が bound の場合、PIXELS/Infinity でも throw せず参照になる（計算スキップ）", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        lineHeight: { unit: "PIXELS", value: Infinity },
        boundVariables: {
          lineHeight: { type: "VARIABLE_ALIAS", id: "VariableID:1:4" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.lineHeight).toBe("{Typo.leading}");
    });

    it("fontWeight のみ bound の場合、参照になる", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        boundVariables: {
          fontWeight: { type: "VARIABLE_ALIAS", id: "VariableID:1:5" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontWeight).toBe("{Typo.weight}");
    });

    it("fontStyle のみ bound の場合、fontWeight として参照になる", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        boundVariables: {
          fontStyle: { type: "VARIABLE_ALIAS", id: "VariableID:1:6" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontWeight).toBe("{Typo.styleName}");
    });

    it("fontWeight と fontStyle の両方が bound の場合、fontWeight を優先する", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        boundVariables: {
          fontWeight: { type: "VARIABLE_ALIAS", id: "VariableID:1:5" },
          fontStyle: { type: "VARIABLE_ALIAS", id: "VariableID:1:6" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontWeight).toBe("{Typo.weight}");
    });

    it("fontWeight bound が map miss の場合、fontStyle bound にフォールバックし alias-resolve 警告が1件記録される", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const warnings = createWarningCollector();
      const textStyle = makeTextStyle({
        boundVariables: {
          fontWeight: { type: "VARIABLE_ALIAS", id: "VariableID:999:999" },
          fontStyle: { type: "VARIABLE_ALIAS", id: "VariableID:1:6" },
        },
      });

      const result = convertTextStyleToTypography(
        textStyle,
        variableNameMap,
        warnings,
      );
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontWeight).toBe("{Typo.styleName}");
      expect(warnings.items).toHaveLength(1);
      expect(warnings.items[0]).toMatchObject({
        severity: "warning",
        kind: "alias-resolve",
      });
    });

    it("fontSize bound が map miss の場合、計算値にフォールバックし warnings が1件記録される", () => {
      const warnings = createWarningCollector();
      const textStyle = makeTextStyle({
        boundVariables: {
          fontSize: { type: "VARIABLE_ALIAS", id: "VariableID:999:999" },
        },
      });

      const result = convertTextStyleToTypography(
        textStyle,
        new Map(),
        warnings,
      );
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontSize).toEqual({ value: 16, unit: "px" });
      expect(warnings.items).toHaveLength(1);
      expect(warnings.items[0]).toMatchObject({
        severity: "warning",
        kind: "alias-resolve",
        source: "TextStyle: Bound",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Variable ID not found"),
      );
    });

    it("fontSize が bound、letterSpacing(PERCENT) が非 bound の場合、letterSpacing の計算には生の fontSize を使う", () => {
      const variableNameMap = createVariableNameMap(typoCollection);
      const textStyle = makeTextStyle({
        fontSize: 16,
        letterSpacing: { unit: "PERCENT", value: 5 },
        boundVariables: {
          fontSize: { type: "VARIABLE_ALIAS", id: "VariableID:1:1" },
        },
      });

      const result = convertTextStyleToTypography(textStyle, variableNameMap);
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontSize).toBe("{Typo.size}");
      expect(value.letterSpacing as DimensionValue).toEqual({
        value: 0.8,
        unit: "px",
      });
    });

    it("paragraphSpacing/paragraphIndent の bound は無視される（出力・警告とも無変化）", () => {
      const warnings = createWarningCollector();
      const textStyle = makeTextStyle({
        boundVariables: {
          paragraphSpacing: { type: "VARIABLE_ALIAS", id: "VariableID:1:1" },
          paragraphIndent: { type: "VARIABLE_ALIAS", id: "VariableID:1:1" },
        },
      });

      const result = convertTextStyleToTypography(
        textStyle,
        new Map(),
        warnings,
      );
      const value = result[textStyle.name].$value as TypographyValue;

      expect(value.fontFamily).toBe("Inter");
      expect(value.fontWeight).toBe(400);
      expect(value.fontSize).toEqual({ value: 16, unit: "px" });
      expect(warnings.items).toEqual([]);
    });
  });
});
