import { describe, it, expect } from "vitest";
import { isPluginToUiMessage, isUiToPluginMessage } from "./messages";

describe("isPluginToUiMessage", () => {
  it("type: download-zip の正しい形は true", () => {
    expect(
      isPluginToUiMessage({
        type: "download-zip",
        data: { collections: [], warnings: [], zipFilename: "a.zip" },
      }),
    ).toBe(true);
  });

  it("type が異なる場合は false", () => {
    expect(isPluginToUiMessage({ type: "download-complete" })).toBe(false);
  });

  it("null は false", () => {
    expect(isPluginToUiMessage(null)).toBe(false);
  });

  it("非オブジェクト（文字列）は false", () => {
    expect(isPluginToUiMessage("download-zip")).toBe(false);
  });

  it("undefined は false", () => {
    expect(isPluginToUiMessage(undefined)).toBe(false);
  });

  it("data が欠落している場合は false", () => {
    expect(isPluginToUiMessage({ type: "download-zip" })).toBe(false);
  });

  it("data が非オブジェクトの場合は false", () => {
    expect(isPluginToUiMessage({ type: "download-zip", data: "x" })).toBe(
      false,
    );
  });

  it("collections が配列でない場合は false", () => {
    expect(
      isPluginToUiMessage({
        type: "download-zip",
        data: { collections: {}, warnings: [], zipFilename: "a.zip" },
      }),
    ).toBe(false);
  });

  it("warnings が配列でない場合は false", () => {
    expect(
      isPluginToUiMessage({
        type: "download-zip",
        data: { collections: [], warnings: "warn", zipFilename: "a.zip" },
      }),
    ).toBe(false);
  });

  it("zipFilename が undefined でも true（フォールバック経路を許容）", () => {
    expect(
      isPluginToUiMessage({
        type: "download-zip",
        data: { collections: [], warnings: [] },
      }),
    ).toBe(true);
  });

  it("zipFilename が文字列以外の場合は false", () => {
    expect(
      isPluginToUiMessage({
        type: "download-zip",
        data: { collections: [], warnings: [], zipFilename: 42 },
      }),
    ).toBe(false);
  });
});

describe("isUiToPluginMessage", () => {
  it("type: download-complete は true", () => {
    expect(isUiToPluginMessage({ type: "download-complete" })).toBe(true);
  });

  it("type: error は true", () => {
    expect(isUiToPluginMessage({ type: "error", error: "boom" })).toBe(true);
  });

  it("type が異なる場合は false", () => {
    expect(isUiToPluginMessage({ type: "download-zip" })).toBe(false);
  });

  it("type: error で error が欠落している場合は false", () => {
    expect(isUiToPluginMessage({ type: "error" })).toBe(false);
  });

  it("type: error で error が文字列以外の場合は false", () => {
    expect(isUiToPluginMessage({ type: "error", error: 42 })).toBe(false);
  });

  it("null は false", () => {
    expect(isUiToPluginMessage(null)).toBe(false);
  });

  it("非オブジェクト（数値）は false", () => {
    expect(isUiToPluginMessage(42)).toBe(false);
  });
});
