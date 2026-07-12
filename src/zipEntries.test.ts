import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildZipEntries,
  tokenFileName,
  WARNINGS_FILENAME,
} from "./zipEntries";

describe("tokenFileName", () => {
  it("キーに .tokens.json を付与する", () => {
    expect(tokenFileName("a")).toBe("a.tokens.json");
  });
});

describe("buildZipEntries", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warnings が非空の場合、先頭に _export-warnings.json が追加される", () => {
    const warnings = [{ severity: "warning", message: "boom" }];
    const entries = buildZipEntries([], warnings);

    expect(entries).toHaveLength(1);
    expect(entries[0].filename).toBe(WARNINGS_FILENAME);
    expect(entries[0].content).toBe(JSON.stringify({ warnings }, null, 2));
  });

  it("warnings が空の場合、警告ファイルは追加されない", () => {
    const entries = buildZipEntries(
      [{ collectionA: { $type: "color", $value: "#fff" } }],
      [],
    );

    expect(entries.some((e) => e.filename === WARNINGS_FILENAME)).toBe(false);
  });

  it("単一キーの group は、group 全体を stringify した旧分岐の出力と一致する", () => {
    const group = { collectionA: { $type: "color", $value: "#fff" } };
    const entries = buildZipEntries([group], []);

    expect(entries).toHaveLength(1);
    expect(entries[0].filename).toBe("collectionA.tokens.json");
    // 旧 ui.html: JSON.stringify(group, null, 2)（group は単一キーのオブジェクトそのもの）
    expect(entries[0].content).toBe(JSON.stringify(group, null, 2));
    expect(entries[0].content).toBe(
      JSON.stringify({ collectionA: group.collectionA }, null, 2),
    );
  });

  it("複数キーの group は、キーごとに分割されたエントリになる", () => {
    const group = {
      typography: { $type: "typography", $value: {} },
      paintStyles: { $type: "color", $value: "#000" },
    };
    const entries = buildZipEntries([group], []);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      filename: "typography.tokens.json",
      content: JSON.stringify({ typography: group.typography }, null, 2),
    });
    expect(entries[1]).toEqual({
      filename: "paintStyles.tokens.json",
      content: JSON.stringify({ paintStyles: group.paintStyles }, null, 2),
    });
  });

  it("キーが0個の group は console.warn を呼び、エントリを生成しない", () => {
    const entries = buildZipEntries([{}], []);

    expect(entries).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("複数 group 間で同名キーが出現する場合、複数エントリが入力順で生成される", () => {
    const groupA = { shared: { $type: "color", $value: "#111" } };
    const groupB = { shared: { $type: "color", $value: "#222" } };
    const entries = buildZipEntries([groupA, groupB], []);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      filename: "shared.tokens.json",
      content: JSON.stringify({ shared: groupA.shared }, null, 2),
    });
    expect(entries[1]).toEqual({
      filename: "shared.tokens.json",
      content: JSON.stringify({ shared: groupB.shared }, null, 2),
    });
  });
});
