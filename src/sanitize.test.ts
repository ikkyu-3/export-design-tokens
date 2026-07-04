import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeTokenName,
  createNameSanitizer,
  toTokenPath,
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

describe("toTokenPath", () => {
  it("`/` 区切りの名前を segment 配列に分解する", () => {
    expect(toTokenPath("color/brand/primary")).toEqual([
      "color",
      "brand",
      "primary",
    ]);
  });

  it("`/` を含まない名前は単一要素の配列になる", () => {
    expect(toTokenPath("tokenA")).toEqual(["tokenA"]);
  });

  it("連続する `/`（空 segment）は unnamed になる", () => {
    expect(toTokenPath("a//b")).toEqual(["a", "unnamed", "b"]);
  });

  it("先頭の `/` は先頭 segment が unnamed になる", () => {
    expect(toTokenPath("/a")).toEqual(["unnamed", "a"]);
  });

  it("末尾の `/` は末尾 segment が unnamed になる", () => {
    expect(toTokenPath("a/")).toEqual(["a", "unnamed"]);
  });

  it("空文字は `[unnamed]` になる", () => {
    expect(toTokenPath("")).toEqual(["unnamed"]);
  });

  it("各 segment は独立してサニタイズされる", () => {
    expect(toTokenPath("a.b/c{d}")).toEqual(["a-b", "c-d-"]);
  });

  it("split 後に先頭 $ が現れる segment もサニタイズされる", () => {
    expect(toTokenPath("a/$b")).toEqual(["a", "b"]);
  });
});

describe("sanitizePath", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each([
    "color/brand/primary",
    "a.b/c",
    "a//b",
    "/a/",
    "$x/$y",
    "",
    "色/値",
  ])("%s: toTokenPath と同じ値を返す（値パリティ）", (name) => {
    const sanitizer = createNameSanitizer();
    expect(sanitizer.sanitizePath(name, "source")).toEqual(toTokenPath(name));
  });

  it("違反 segment ごとに name-sanitize warning が記録される", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    const result = sanitizer.sanitizePath("a.b/$c", "TextStyle: sample");

    expect(result).toEqual(["a-b", "c"]);
    expect(
      warnings.items.filter((w) => w.kind === "name-sanitize"),
    ).toHaveLength(2);
  });

  it("`/` のみで区切られた合法な segment では warning が記録されない", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    sanitizer.sanitizePath("color/brand/primary", "source");

    expect(warnings.items).toEqual([]);
  });

  it("同一 (source, segment) の警告は1回だけ記録される", () => {
    const warnings = createWarningCollector();
    const sanitizer = createNameSanitizer(warnings);

    sanitizer.sanitizePath("a.b/a.b", "source");

    expect(warnings.items).toHaveLength(1);
  });

  it("warnings を指定しなくても throw しない", () => {
    const sanitizer = createNameSanitizer();
    expect(() => sanitizer.sanitizePath("a.b/$c", "source")).not.toThrow();
  });
});
