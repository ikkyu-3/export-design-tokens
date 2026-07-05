import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FigmaCollectionData } from "../collections";
import { createVariableNameMap } from "./createVariableNameMap";
import { createWarningCollector } from "../warnings";

describe("createVariableNameMap", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("単一モードのコレクションでは groupName は collection 名になり、defaultName はその groupName を用いる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-1",
        name: "SingleModeCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-a",
            name: "tokenA",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "var-b",
            name: "tokenB",
            resolvedType: "FLOAT",
            valuesByMode: { "mode-1": 1 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const map = createVariableNameMap(collections);

    const a = map.get("var-a");
    const b = map.get("var-b");
    expect(a?.defaultName).toBe("SingleModeCollection.tokenA");
    expect(a?.modes["mode-1"]).toBe("SingleModeCollection.tokenA");
    expect(b?.defaultName).toBe("SingleModeCollection.tokenB");
    expect(b?.modes["mode-1"]).toBe("SingleModeCollection.tokenB");
  });

  it("複数モードのコレクションでは groupName は collection名_mode名 になり、defaultModeId の名前が defaultName に使われる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-2",
        name: "MultiModeCollection",
        defaultModeId: "dark-id",
        modes: [
          { modeId: "light-id", name: "light" },
          { modeId: "dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-x",
            name: "tokenX",
            resolvedType: "COLOR",
            valuesByMode: {
              "light-id": { r: 1, g: 1, b: 1, a: 1 },
              "dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const map = createVariableNameMap(collections);

    const x = map.get("var-x");
    expect(x).toBeTruthy();
    expect(x?.defaultName).toBe("MultiModeCollectionDark.tokenX");
    expect(x?.modes["light-id"]).toBe("MultiModeCollectionLight.tokenX");
    expect(x?.modes["dark-id"]).toBe("MultiModeCollectionDark.tokenX");
  });

  it("modes が空のコレクションは警告してスキップされる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-3",
        name: "NoModesCollection",
        defaultModeId: "none",
        modes: [],
        variables: [
          {
            id: "var-z",
            name: "tokenZ",
            resolvedType: "STRING",
            valuesByMode: {},
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const map = createVariableNameMap(collections);
    expect(map.size).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("変数名が命名制約に違反する場合、サニタイズされ name-sanitize warning が1件記録される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-clean",
        name: "Clean",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-a",
            name: "color.primary",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const map = createVariableNameMap(collections, warnings);

    const a = map.get("var-a");
    expect(a?.defaultName).toBe("Clean.color-primary");

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(1);
  });

  it("2 mode で同一変数名が違反している場合、mode 横断で warning はちょうど1件に集約される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-multi",
        name: "MultiModeCollection",
        defaultModeId: "dark-id",
        modes: [
          { modeId: "light-id", name: "light" },
          { modeId: "dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-x",
            name: "a.b",
            resolvedType: "COLOR",
            valuesByMode: {
              "light-id": { r: 1, g: 1, b: 1, a: 1 },
              "dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const map = createVariableNameMap(collections, warnings);

    const x = map.get("var-x");
    expect(x?.modes["light-id"]).toBe("MultiModeCollectionLight.a-b");
    expect(x?.modes["dark-id"]).toBe("MultiModeCollectionDark.a-b");

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(1);
  });

  it("collection 名が違反している場合、mode 毎に Group 名の warning が記録される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-dotted",
        name: "my.col",
        defaultModeId: "mode-a",
        modes: [
          { modeId: "mode-a", name: "light" },
          { modeId: "mode-b", name: "dark" },
        ],
        variables: [
          {
            id: "var-y",
            name: "tokenY",
            resolvedType: "COLOR",
            valuesByMode: {
              "mode-a": { r: 1, g: 1, b: 1, a: 1 },
              "mode-b": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    createVariableNameMap(collections, warnings);

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(2);
  });

  it("先頭の `$` を含む変数名はサニタイズされ、空になる場合は unnamed になる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-dollar",
        name: "DollarCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-weight",
            name: "$weight",
            resolvedType: "FLOAT",
            valuesByMode: { "mode-1": 400 },
            description: "",
            scopes: ["FONT_WEIGHT"],
          },
          {
            id: "var-dollar-only",
            name: "$",
            resolvedType: "FLOAT",
            valuesByMode: { "mode-1": 1 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const map = createVariableNameMap(collections, warnings);

    expect(map.get("var-weight")?.defaultName).toBe("DollarCollection.weight");
    expect(map.get("var-dollar-only")?.defaultName).toBe(
      "DollarCollection.unnamed",
    );
  });

  it("`/` 区切りの変数名は参照パスで `.` 区切りに変換される（単一 mode）", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-nest",
        name: "NestCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-nested",
            name: "color/brand/primary",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const map = createVariableNameMap(collections);

    expect(map.get("var-nested")?.defaultName).toBe(
      "NestCollection.color.brand.primary",
    );
  });

  it("`/` 区切りの変数名は複数 mode それぞれで `.` 区切りの参照パスになる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-nest-multi",
        name: "NestMultiCollection",
        defaultModeId: "dark-id",
        modes: [
          { modeId: "light-id", name: "light" },
          { modeId: "dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-nested",
            name: "color/brand/primary",
            resolvedType: "COLOR",
            valuesByMode: {
              "light-id": { r: 1, g: 1, b: 1, a: 1 },
              "dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const map = createVariableNameMap(collections);
    const entry = map.get("var-nested");

    expect(entry?.modes["light-id"]).toBe(
      "NestMultiCollectionLight.color.brand.primary",
    );
    expect(entry?.modes["dark-id"]).toBe(
      "NestMultiCollectionDark.color.brand.primary",
    );
  });

  it("segment 内に命名制約違反がある場合、その segment だけサニタイズされ warning が1件記録される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-nest-sanitize",
        name: "NestSanitizeCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-nested-sanitize",
            name: "color/a.b",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const map = createVariableNameMap(collections, warnings);

    expect(map.get("var-nested-sanitize")?.defaultName).toBe(
      "NestSanitizeCollection.color.a-b",
    );

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(1);
  });

  it("`/` のみの変数名は unnamed の連なりになり、空 segment の sanitize warning が1件（dedup）記録される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-slash-only",
        name: "SlashOnlyCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-slash-only",
            name: "/",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const map = createVariableNameMap(collections, warnings);

    expect(map.get("var-slash-only")?.defaultName).toBe(
      "SlashOnlyCollection.unnamed.unnamed",
    );
    // 両 segment とも空文字→"unnamed" の同一 (source, segment) なので dedup により1件のみ記録される
    expect(
      warnings.items.filter((w) => w.kind === "name-sanitize"),
    ).toHaveLength(1);
  });

  it("`/` 区切り自体は違反ではないため、合法な segment のみで構成される変数名は warning 0件になる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-slash-legal",
        name: "SlashLegalCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-slash-legal",
            name: "color/brand/primary",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    createVariableNameMap(collections, warnings);

    expect(
      warnings.items.filter((w) => w.kind === "name-sanitize"),
    ).toHaveLength(0);
  });

  it("連続する `/`（空 segment）を含む変数名は unnamed segment を挟んで参照パスになる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-double-slash",
        name: "DoubleSlashCollection",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-double-slash",
            name: "a//b",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const map = createVariableNameMap(collections);

    expect(map.get("var-double-slash")?.defaultName).toBe(
      "DoubleSlashCollection.a.unnamed.b",
    );
  });
});
