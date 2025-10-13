import { describe, it, expect } from "vitest";
import { convertTextStyleToTypography } from "./convertTextStyleToTypography";
import { FigmaTextStyle } from "../types/figma";
import { TypographyValue } from "../types/token";

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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;
    expect(result.$type).toBe("typography");
    expect(result.$description).toBe("");
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

    const result = convertTextStyleToTypography(textStyle);

    expect(result.$description).toBe("本文用のテキストスタイル");
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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;
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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;

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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;

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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;

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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;

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

    const result = convertTextStyleToTypography(textStyle);
    const value = result.$value as TypographyValue;

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

    expect(() => convertTextStyleToTypography(textStyle)).toThrow(TypeError);
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

    expect(() => convertTextStyleToTypography(textStyle)).toThrow(TypeError);
  });
});
