import { describe, it, expect } from "vitest";
import {
  sanitizeZipNameSegment,
  formatTimestamp,
  buildZipFilename,
  ZIP_NAME_MAX_LENGTH,
} from "./zipFilename";

describe("sanitizeZipNameSegment", () => {
  it("合法な名前は変化しない", () => {
    expect(sanitizeZipNameSegment("MyDesignSystem")).toBe("MyDesignSystem");
  });

  it("空白を含む合法な名前は保持される", () => {
    expect(sanitizeZipNameSegment("Design Tokens 2026")).toBe(
      "Design Tokens 2026",
    );
  });

  it("日本語・非ASCIIは保持される", () => {
    expect(sanitizeZipNameSegment("デザイントークン")).toBe("デザイントークン");
  });

  it.each([
    ["a/b", "a-b"],
    ["a\\b", "a-b"],
    ["a:b", "a-b"],
    ["a*b", "a-b"],
    ["a?b", "a-b"],
    ['a"b', "a-b"],
    ["a<b", "a-b"],
    ["a>b", "a-b"],
    ["a|b", "a-b"],
  ])("禁止文字 %s は - に置換される", (input, expected) => {
    expect(sanitizeZipNameSegment(input)).toBe(expected);
  });

  it.each([
    ["a\x00b", "a-b"],
    ["a\nb", "a-b"],
    ["a\tb", "a-b"],
    ["a\x1fb", "a-b"],
    ["a\x7fb", "a-b"],
  ])("制御文字を含む %j は - に置換される", (input, expected) => {
    expect(sanitizeZipNameSegment(input)).toBe(expected);
  });

  it("連続する禁止文字は1個の - に畳み込まれる", () => {
    expect(sanitizeZipNameSegment("a//:*b")).toBe("a-b");
  });

  it("前後の空白がトリムされる", () => {
    expect(sanitizeZipNameSegment("  name  ")).toBe("name");
  });

  it("前後の `.` がトリムされる", () => {
    expect(sanitizeZipNameSegment(".name.")).toBe("name");
  });

  it("前後の `-`（置換由来含む）がトリムされる", () => {
    expect(sanitizeZipNameSegment("/name/")).toBe("name");
  });

  it("空文字は空文字のまま", () => {
    expect(sanitizeZipNameSegment("")).toBe("");
  });

  it.each(["///", "...", "  ", " "])(
    "サニタイズ後に空になる入力 %j は空文字になる",
    (input) => {
      expect(sanitizeZipNameSegment(input)).toBe("");
    },
  );

  it("51文字以上は50文字に切り詰められる", () => {
    const result = sanitizeZipNameSegment("a".repeat(60));
    expect(result).toHaveLength(ZIP_NAME_MAX_LENGTH);
  });

  it("切り詰めがサロゲートペアを壊さない", () => {
    const result = sanitizeZipNameSegment("🎨".repeat(60));
    expect(Array.from(result)).toHaveLength(50);
    expect(result).not.toContain("�");
  });

  it("混合パターン: 空白・禁止文字・前後の空白が組み合わさっても正しくサニタイズされる", () => {
    expect(sanitizeZipNameSegment(" My/Design:System? ")).toBe(
      "My-Design-System",
    );
  });
});

describe("formatTimestamp", () => {
  it("固定 Date から YYYYMMDDHHmm 形式の文字列を生成する", () => {
    expect(formatTimestamp(new Date(2026, 6, 8, 12, 34))).toBe("202607081234");
  });

  it("1桁の月日時分はゼロ埋めされる", () => {
    expect(formatTimestamp(new Date(2026, 0, 5, 9, 7))).toBe("202601050907");
  });
});

describe("buildZipFilename", () => {
  it("通常のドキュメント名は `export-design-tokens_<name>_<timestamp>.zip` になる", () => {
    expect(buildZipFilename("MyFile", new Date(2026, 6, 8, 12, 34))).toBe(
      "export-design-tokens_MyFile_202607081234.zip",
    );
  });

  it("空文字のドキュメント名は従来形式（`_` の二重化なし）になる", () => {
    expect(buildZipFilename("", new Date(2026, 6, 8, 12, 34))).toBe(
      "export-design-tokens_202607081234.zip",
    );
  });

  it("サニタイズ後に空になるドキュメント名も従来形式になる", () => {
    expect(buildZipFilename("///", new Date(2026, 6, 8, 12, 34))).toBe(
      "export-design-tokens_202607081234.zip",
    );
  });

  it("禁止文字入りのドキュメント名はサニタイズされてから組み込まれる", () => {
    expect(buildZipFilename("A/B", new Date(2026, 6, 8, 12, 34))).toBe(
      "export-design-tokens_A-B_202607081234.zip",
    );
  });

  it("長い名前でもファイル名全体の名前部は50 code pointに収まる", () => {
    const result = buildZipFilename(
      "あ".repeat(100),
      new Date(2026, 6, 8, 12, 34),
    );
    expect(result).toBe(
      `export-design-tokens_${"あ".repeat(50)}_202607081234.zip`,
    );
  });
});
