import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setTokenWithDuplicateWarning,
  assignTokensWithDuplicateWarning,
  findDuplicateFileNames,
} from "./duplicates";
import { createWarningCollector } from "./warnings";

describe("setTokenWithDuplicateWarning", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("新規キーは warning なしで代入される", () => {
    const target: Record<string, number> = {};
    const warnings = createWarningCollector();

    setTokenWithDuplicateWarning(target, "a", 1, "source-a", warnings);

    expect(target).toEqual({ a: 1 });
    expect(warnings.items).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("既存キーへの代入は duplicate warning が1件記録され、値は後勝ちで上書きされる", () => {
    const target: Record<string, number> = { a: 1 };
    const warnings = createWarningCollector();

    setTokenWithDuplicateWarning(target, "a", 2, "source-a-2", warnings);

    expect(target).toEqual({ a: 2 });
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "source-a-2",
    });
  });

  it("warnings 未指定でも throw せず後勝ちで上書きされる", () => {
    const target: Record<string, number> = { a: 1 };

    expect(() =>
      setTokenWithDuplicateWarning(target, "a", 2, "source-a"),
    ).not.toThrow();
    expect(target).toEqual({ a: 2 });
  });

  it("重複時は console.warn が呼ばれる", () => {
    const target: Record<string, number> = { a: 1 };

    setTokenWithDuplicateWarning(target, "a", 2, "source-a");

    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("assignTokensWithDuplicateWarning", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("重複がない場合は複数キー全てがマージされ、warning は0件", () => {
    const target: Record<string, number> = { a: 1 };
    const warnings = createWarningCollector();

    assignTokensWithDuplicateWarning(
      target,
      { b: 2, c: 3 },
      "source",
      warnings,
    );

    expect(target).toEqual({ a: 1, b: 2, c: 3 });
    expect(warnings.items).toEqual([]);
  });

  it("一部重複がある場合は重複したキーの分だけ warning が記録される", () => {
    const target: Record<string, number> = { a: 1, b: 2 };
    const warnings = createWarningCollector();

    assignTokensWithDuplicateWarning(
      target,
      { b: 20, c: 3 },
      "source",
      warnings,
    );

    expect(target).toEqual({ a: 1, b: 20, c: 3 });
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      kind: "duplicate",
      source: "source",
    });
  });
});

describe("findDuplicateFileNames", () => {
  it("重複がない場合は空配列を返す", () => {
    const result = findDuplicateFileNames([{ a: {} }, { b: {} }]);
    expect(result).toEqual([]);
  });

  it("2要素間で同じキーが出現する場合、count: 2 で返す", () => {
    const result = findDuplicateFileNames([{ a: {} }, { a: {} }]);
    expect(result).toEqual([{ name: "a", count: 2 }]);
  });

  it("3要素にまたがって同じキーが出現する場合、count: 3 で返す", () => {
    const result = findDuplicateFileNames([{ a: {} }, { a: {} }, { a: {} }]);
    expect(result).toEqual([{ name: "a", count: 3 }]);
  });

  it("固定キー（typography 等）との衝突も検出する", () => {
    const result = findDuplicateFileNames([
      { typography: {} },
      { typography: {} },
      { paintStyles: {} },
    ]);
    expect(result).toEqual([{ name: "typography", count: 2 }]);
  });

  it("null/undefined 要素が混在していても throw せず無視される", () => {
    expect(() =>
      findDuplicateFileNames([{ a: {} }, null, undefined, { a: {} }]),
    ).not.toThrow();

    const result = findDuplicateFileNames([
      { a: {} },
      null,
      undefined,
      { a: {} },
    ]);
    expect(result).toEqual([{ name: "a", count: 2 }]);
  });

  it("$description がネスト内にある Group 要素では $description を誤検出しない", () => {
    const result = findDuplicateFileNames([
      { MyGroup: { $description: "x", token: {} } },
      { MyGroup: { $description: "y", token: {} } },
    ]);
    expect(result).toEqual([{ name: "MyGroup", count: 2 }]);
  });

  it("空オブジェクト要素は無害（キーが無いため何にも影響しない）", () => {
    const result = findDuplicateFileNames([{}, { a: {} }, {}]);
    expect(result).toEqual([]);
  });
});
