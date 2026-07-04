import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeTokenName,
  createNameSanitizer,
  sanitizeRecordKeys,
  FALLBACK_TOKEN_NAME,
} from "./sanitize";
import { createWarningCollector } from "./warnings";

describe("sanitizeTokenName", () => {
  it("`.` を `-` に置換する", () => {
    expect(sanitizeTokenName("color.brand.primary")).toBe(
      "color-brand-primary",
    );
  });

  it("`{` `}` を `-` に置換する", () => {
    expect(sanitizeTokenName("{alias}")).toBe("-alias-");
  });

  it("先頭の `$` を除去する", () => {
    expect(sanitizeTokenName("$weight")).toBe("weight");
  });

  it("先頭の連続する `$` をすべて除去する", () => {
    expect(sanitizeTokenName("$$x")).toBe("x");
  });

  it("中間の `$` は保持する", () => {
    expect(sanitizeTokenName("a$b")).toBe("a$b");
  });

  it("空文字は FALLBACK_TOKEN_NAME になる", () => {
    expect(sanitizeTokenName("")).toBe(FALLBACK_TOKEN_NAME);
  });

  it("`$` のみは FALLBACK_TOKEN_NAME になる", () => {
    expect(sanitizeTokenName("$")).toBe(FALLBACK_TOKEN_NAME);
  });

  it("`$$` のみは FALLBACK_TOKEN_NAME になる", () => {
    expect(sanitizeTokenName("$$")).toBe(FALLBACK_TOKEN_NAME);
  });

  it("連続する `.` はそれぞれ `-` に置換される", () => {
    expect(sanitizeTokenName("...")).toBe("---");
  });

  it("複合パターン: 先頭 $ 除去後に . { } を置換する", () => {
    expect(sanitizeTokenName("$color.{x}")).toBe("color--x-");
  });

  it("`/` は変更しない（ネスト化は #16 の担当）", () => {
    expect(sanitizeTokenName("color/brand/primary")).toBe(
      "color/brand/primary",
    );
  });

  it("合法な名前は恒等写像となる", () => {
    expect(sanitizeTokenName("tokenA")).toBe("tokenA");
    expect(sanitizeTokenName("数値")).toBe("数値");
    expect(sanitizeTokenName("Mode 1")).toBe("Mode 1");
  });
});

describe("createNameSanitizer", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("違反名はサニタイズされ、warning が1件記録され、console.warn も呼ばれる", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    const result = sanitizer.sanitize(
      "color.primary",
      "Variable: color.primary",
    );

    expect(result).toBe("color-primary");
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "name-sanitize",
      source: "Variable: color.primary",
    });
    expect(warnings.items[0].message).toContain("color.primary");
    expect(warnings.items[0].message).toContain("color-primary");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("同一 (name, source) を2回サニタイズしても warning は1件のみ", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    sanitizer.sanitize("a.b", "Variable: a.b");
    sanitizer.sanitize("a.b", "Variable: a.b");

    expect(warnings.items).toHaveLength(1);
  });

  it("同一 name でも source が異なれば warning は2件記録される", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    sanitizer.sanitize("a.b", "Variable: a.b (mode: light)");
    sanitizer.sanitize("a.b", "Variable: a.b (mode: dark)");

    expect(warnings.items).toHaveLength(2);
  });

  it("合法な名前では warning が記録されない", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    const result = sanitizer.sanitize("tokenA", "Variable: tokenA");

    expect(result).toBe("tokenA");
    expect(warnings.items).toEqual([]);
  });

  it("warnings を指定しなくても throw しない", () => {
    const sanitizer = createNameSanitizer();
    expect(() => sanitizer.sanitize("a.b", "Variable: a.b")).not.toThrow();
  });
});

describe("sanitizeRecordKeys", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("違反キーをサニタイズしつつ値を保持し、警告を記録する", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    const result = sanitizeRecordKeys(
      { "a.b": "v1", ok: "v2" },
      sanitizer,
      "TextStyle: sample",
    );

    expect(result).toEqual({ "a-b": "v1", ok: "v2" });
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({ kind: "name-sanitize" });
  });

  it("サニタイズ後にキーが衝突した場合は duplicate 警告を記録し後勝ちで上書きする", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    const result = sanitizeRecordKeys(
      { "a.b": "v1", "a-b": "v2" },
      sanitizer,
      "TextStyle: sample",
      warnings,
    );

    expect(result).toEqual({ "a-b": "v2" });
    expect(warnings.items.map((w) => w.kind)).toEqual(
      expect.arrayContaining(["name-sanitize", "duplicate"]),
    );
    expect(warnings.items.filter((w) => w.kind === "duplicate")).toHaveLength(
      1,
    );
  });
});
