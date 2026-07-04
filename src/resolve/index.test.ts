import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FigmaCollectionData } from "../collections";
import { resolveAliasesForAllCollections } from "./index";
import { createVariableNameMap } from "./createVariableNameMap";
import { convertCollectionToModeNamedGroups } from "../converts/convertCollectionToGroup";
import { createWarningCollector } from "../warnings";
import { ColorToken } from "../types/token";

describe("resolveAliasesForAllCollections", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("単一モードの同一コレクション内エイリアスを defaultMode 基準の名前に解決する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-1",
        name: "Single",
        defaultModeId: "m1",
        modes: [{ modeId: "m1", name: "light" }],
        variables: [
          {
            id: "var-target",
            name: "colorPrimary",
            resolvedType: "COLOR",
            valuesByMode: { m1: { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "var-alias",
            name: "colorPrimaryAlias",
            resolvedType: "COLOR",
            valuesByMode: { m1: { type: "VARIABLE_ALIAS", id: "var-target" } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const result = resolveAliasesForAllCollections(collections, nameMap);

    expect(
      (collections[0].variables[1].valuesByMode.m1 as VariableAlias).id,
    ).toBe("var-target");

    const resolved = result[0].variables[1].valuesByMode.m1 as VariableAlias;
    expect(resolved).toEqual({
      type: "VARIABLE_ALIAS",
      id: "Single.colorPrimary",
    });
  });

  it("複数コレクション間のエイリアスも参照先の defaultMode で解決する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-A",
        name: "A",
        defaultModeId: "mA",
        modes: [{ modeId: "mA", name: "one" }],
        variables: [
          {
            id: "var-A",
            name: "spacingM",
            resolvedType: "FLOAT",
            valuesByMode: { mA: 8 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-B",
        name: "B",
        defaultModeId: "mB",
        modes: [{ modeId: "mB", name: "two" }],
        variables: [
          {
            id: "var-B-alias",
            name: "spacingMAlias",
            resolvedType: "FLOAT",
            valuesByMode: { mB: { type: "VARIABLE_ALIAS", id: "var-A" } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const result = resolveAliasesForAllCollections(collections, nameMap);

    const resolved = result[1].variables[0].valuesByMode.mB as VariableAlias;
    expect(resolved).toEqual({
      type: "VARIABLE_ALIAS",
      id: "A.spacingM",
    });
  });

  it("複数モードの参照先でも、defaultModeId に対応するモード名で group 名が決まる", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-X",
        name: "Multi",
        defaultModeId: "dark-id",
        modes: [
          { modeId: "light-id", name: "light" },
          { modeId: "dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-target",
            name: "textColor",
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
      {
        id: "col-Y",
        name: "Source",
        defaultModeId: "m1",
        modes: [{ modeId: "m1", name: "light" }],
        variables: [
          {
            id: "var-alias",
            name: "textColorAlias",
            resolvedType: "COLOR",
            valuesByMode: { m1: { type: "VARIABLE_ALIAS", id: "var-target" } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const result = resolveAliasesForAllCollections(collections, nameMap);

    const resolved = result[1].variables[0].valuesByMode.m1 as VariableAlias;
    expect(resolved).toEqual({
      type: "VARIABLE_ALIAS",
      id: "MultiDark.textColor",
    });
  });

  it("参照先 ID が見つからない場合は警告してスキップする", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-1",
        name: "C",
        defaultModeId: "m1",
        modes: [{ modeId: "m1", name: "light" }],
        variables: [
          {
            id: "var-missing-alias",
            name: "missing",
            resolvedType: "STRING",
            valuesByMode: { m1: { type: "VARIABLE_ALIAS", id: "no-such-id" } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const result = resolveAliasesForAllCollections(collections, nameMap);

    const resolved = result[0].variables[0].valuesByMode.m1 as VariableAlias;
    expect(resolved).toEqual({
      type: "VARIABLE_ALIAS",
      id: "no-such-id",
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("入力データは非破壊（deep clone）であること", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-1",
        name: "Single",
        defaultModeId: "m1",
        modes: [{ modeId: "m1", name: "light" }],
        variables: [
          {
            id: "target",
            name: "t",
            resolvedType: "FLOAT",
            valuesByMode: { m1: 4 },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "alias",
            name: "a",
            resolvedType: "FLOAT",
            valuesByMode: { m1: { type: "VARIABLE_ALIAS", id: "target" } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const before = JSON.parse(JSON.stringify(collections));
    const nameMap = createVariableNameMap(collections);
    const result = resolveAliasesForAllCollections(collections, nameMap);

    expect(collections).toEqual(before);

    const resolved = result[0].variables[1].valuesByMode.m1 as VariableAlias;
    expect(resolved.id).toBe("Single.t");
  });

  it("サニタイズ後の Group名/変数名で alias 参照とトップレベルキーが一致する（参照整合性の統合テスト）", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-brand",
        name: "brand.colors",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-primary",
            name: "color.primary",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "var-primary-alias",
            name: "primaryAlias",
            resolvedType: "COLOR",
            valuesByMode: {
              "mode-1": { type: "VARIABLE_ALIAS", id: "var-primary" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const resolved = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );
    const groups = resolved.map((c) =>
      convertCollectionToModeNamedGroups(c, warnings),
    );

    const topLevelKeys = Object.keys(groups[0]);
    expect(topLevelKeys).toEqual(["brand-colors"]);

    const group = groups[0]["brand-colors"];
    expect(Object.keys(group)).toContain("color-primary");

    const aliasToken = group["primaryAlias"] as ColorToken;
    expect(aliasToken.$value).toBe(`{${topLevelKeys[0]}.color-primary}`);
    expect(aliasToken.$value).toBe("{brand-colors.color-primary}");

    const sanitizeWarnings = warnings.items.filter(
      (w) => w.kind === "name-sanitize",
    );
    expect(sanitizeWarnings).toHaveLength(2);
  });

  it("`/` 区切りの変数名とエイリアス参照がネスト Group のパスとして解決される（#16 統合テスト）", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-brand-nest",
        name: "Brand",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-primary",
            name: "color/brand/primary",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "var-alias",
            name: "alias/ref",
            resolvedType: "COLOR",
            valuesByMode: {
              "mode-1": { type: "VARIABLE_ALIAS", id: "var-primary" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const resolved = resolveAliasesForAllCollections(collections, nameMap);
    const groups = resolved.map((c) => convertCollectionToModeNamedGroups(c));

    const topLevelKeys = Object.keys(groups[0]);
    expect(topLevelKeys).toEqual(["Brand"]);

    const group = groups[0]["Brand"] as unknown as Record<
      string,
      Record<string, Record<string, { $value: unknown }>>
    > &
      Record<string, Record<string, ColorToken>>;

    // 参照パスをツリーとして歩いて $value ノードに到達できること
    expect(group.color.brand.primary.$value).toBeDefined();

    const aliasToken = group.alias.ref;
    expect(aliasToken.$value).toBe("{Brand.color.brand.primary}");
  });

  it("参照パスにサニタイズ対象の segment が混在していても、ネスト後のパスで解決される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-brand-nest-sanitize",
        name: "Brand",
        defaultModeId: "mode-1",
        modes: [{ modeId: "mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-primary",
            name: "color/a.b",
            resolvedType: "COLOR",
            valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "var-alias",
            name: "alias",
            resolvedType: "COLOR",
            valuesByMode: {
              "mode-1": { type: "VARIABLE_ALIAS", id: "var-primary" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const resolved = resolveAliasesForAllCollections(collections, nameMap);
    const groups = resolved.map((c) => convertCollectionToModeNamedGroups(c));

    const group = groups[0]["Brand"] as unknown as Record<string, ColorToken>;
    expect(group.alias.$value).toBe("{Brand.color.a-b}");
  });

  it("複数 mode でも `/` 区切りの参照パスが mode ごとの Group 名で解決される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-brand-nest-multi",
        name: "Brand",
        defaultModeId: "dark-id",
        modes: [
          { modeId: "light-id", name: "light" },
          { modeId: "dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-primary",
            name: "color/brand/primary",
            resolvedType: "COLOR",
            valuesByMode: {
              "light-id": { r: 1, g: 1, b: 1, a: 1 },
              "dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
          {
            id: "var-alias",
            name: "alias/ref",
            resolvedType: "COLOR",
            valuesByMode: {
              "light-id": { type: "VARIABLE_ALIAS", id: "var-primary" },
              "dark-id": { type: "VARIABLE_ALIAS", id: "var-primary" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const nameMap = createVariableNameMap(collections);
    const resolved = resolveAliasesForAllCollections(collections, nameMap);
    const groups = resolved.map((c) => convertCollectionToModeNamedGroups(c));

    const group = groups[0]["BrandDark"] as unknown as Record<
      string,
      Record<string, ColorToken>
    >;
    expect(group.alias.ref.$value).toBe("{BrandDark.color.brand.primary}");
  });
});
