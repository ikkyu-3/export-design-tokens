import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setTokenWithDuplicateWarning,
  setTokenAtPath,
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

describe("setTokenAtPath", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("path 長 1 は通常のフラット代入と同等になり、無警告", () => {
    const target: Record<string, unknown> = {};
    const warnings = createWarningCollector();

    setTokenAtPath(target, ["a"], { $value: "v1" }, "source", warnings);

    expect(target).toEqual({ a: { $value: "v1" } });
    expect(warnings.items).toEqual([]);
  });

  it("path 長 3 は中間 Group を作りながら葉にトークンを挿入する", () => {
    const target: Record<string, unknown> = {};
    const warnings = createWarningCollector();

    setTokenAtPath(
      target,
      ["a", "b", "c"],
      { $value: "v1" },
      "source",
      warnings,
    );

    expect(target).toEqual({ a: { b: { c: { $value: "v1" } } } });
    expect(warnings.items).toEqual([]);
  });

  it("同一親パスの複数トークンは同じ中間 Group に集約される（無警告）", () => {
    const target: Record<string, unknown> = {};
    const warnings = createWarningCollector();

    setTokenAtPath(
      target,
      ["color", "brand", "primary"],
      { $value: "v1" },
      "source",
      warnings,
    );
    setTokenAtPath(
      target,
      ["color", "brand", "secondary"],
      { $value: "v2" },
      "source",
      warnings,
    );

    expect(target).toEqual({
      color: {
        brand: {
          primary: { $value: "v1" },
          secondary: { $value: "v2" },
        },
      },
    });
    expect(warnings.items).toEqual([]);
  });

  it("(a) 既存の葉の位置に子パスを挿入すると、葉が Group に置き換わり duplicate warning が1件記録される（メッセージに「中間キー」を含む）", () => {
    const target: Record<string, unknown> = { color: { $value: "leaf" } };
    const warnings = createWarningCollector();

    setTokenAtPath(
      target,
      ["color", "brand", "primary"],
      { $value: "v1" },
      "source",
      warnings,
    );

    expect(target).toEqual({
      color: { brand: { primary: { $value: "v1" } } },
    });
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "source",
    });
    expect(warnings.items[0].message).toContain("中間キー");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("(b) 既存の Group がある葉の位置に新規トークンを挿入すると、Group が保持され新トークンは破棄される。duplicate warning が1件記録される（メッセージに「スキップ」を含む）", () => {
    const target: Record<string, unknown> = {
      color: { brand: { primary: { $value: "v1" } } },
    };
    const warnings = createWarningCollector();

    setTokenAtPath(target, ["color"], { $value: "v2" }, "source", warnings);

    expect(target).toEqual({
      color: { brand: { primary: { $value: "v1" } } },
    });
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "source",
    });
    expect(warnings.items[0].message).toContain("スキップ");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("(b') 完全に同一の path を2回挿入すると、後勝ちで上書きされ duplicate warning が1件記録される", () => {
    const target: Record<string, unknown> = {};
    const warnings = createWarningCollector();

    setTokenAtPath(
      target,
      ["color", "primary"],
      { $value: "v1" },
      "source",
      warnings,
    );
    setTokenAtPath(
      target,
      ["color", "primary"],
      { $value: "v2" },
      "source",
      warnings,
    );

    expect(target).toEqual({ color: { primary: { $value: "v2" } } });
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
      source: "source",
    });
  });

  it("`__proto__` を含む path は own enumerable プロパティとして格納され、Object.prototype を汚染しない", () => {
    const target: Record<string, unknown> = {};
    const warnings = createWarningCollector();

    setTokenAtPath(
      target,
      ["__proto__", "x"],
      { $value: "v1" },
      "source",
      warnings,
    );

    // own property として格納されている（アクセサ経由の [[Prototype]] 変更ではない）
    expect(Object.prototype.hasOwnProperty.call(target, "__proto__")).toBe(
      true,
    );
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);

    // グローバルな Object.prototype は汚染されていない
    expect(({} as Record<string, unknown>).x).toBeUndefined();

    // own property の値として正しく格納され、JSON化にも反映される
    const ownProtoValue = Object.getOwnPropertyDescriptor(
      target,
      "__proto__",
    )?.value;
    expect(ownProtoValue).toEqual({ x: { $value: "v1" } });
    expect(JSON.stringify(target)).toBe('{"__proto__":{"x":{"$value":"v1"}}}');
  });

  it("warnings を指定しなくても throw しない", () => {
    const target: Record<string, unknown> = { color: { $value: "leaf" } };

    expect(() =>
      setTokenAtPath(target, ["color", "brand"], { $value: "v1" }, "source"),
    ).not.toThrow();
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
