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

  it("複数モードの参照先では、参照元と同名のモードの Group 名で解決される", () => {
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

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    const resolved = result[1].variables[0].valuesByMode.m1 as VariableAlias;
    expect(resolved).toEqual({
      type: "VARIABLE_ALIAS",
      id: "MultiLight.textColor",
    });

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(0);
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

    const lightGroup = groups[0]["BrandLight"] as unknown as Record<
      string,
      Record<string, ColorToken>
    >;
    expect(lightGroup.alias.ref.$value).toBe(
      "{BrandLight.color.brand.primary}",
    );
  });

  it("コレクション間の参照でも、参照元と同名モードの Group 名で解決される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-primitive",
        name: "Primitive",
        defaultModeId: "primitive-light-id",
        modes: [
          { modeId: "primitive-light-id", name: "light" },
          { modeId: "primitive-dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-primitive",
            name: "colorBase",
            resolvedType: "COLOR",
            valuesByMode: {
              "primitive-light-id": { r: 1, g: 1, b: 1, a: 1 },
              "primitive-dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-semantic",
        name: "Semantic",
        defaultModeId: "semantic-light-id",
        modes: [
          { modeId: "semantic-light-id", name: "light" },
          { modeId: "semantic-dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-semantic",
            name: "colorSurface",
            resolvedType: "COLOR",
            valuesByMode: {
              "semantic-light-id": {
                type: "VARIABLE_ALIAS",
                id: "var-primitive",
              },
              "semantic-dark-id": {
                type: "VARIABLE_ALIAS",
                id: "var-primitive",
              },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    const semanticVar = result[1].variables[0];
    expect(
      (semanticVar.valuesByMode["semantic-light-id"] as VariableAlias).id,
    ).toBe("PrimitiveLight.colorBase");
    expect(
      (semanticVar.valuesByMode["semantic-dark-id"] as VariableAlias).id,
    ).toBe("PrimitiveDark.colorBase");

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(0);
  });

  it("参照元と一致するモード名が参照先にない場合、参照先の defaultMode にフォールバックし警告する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-target",
        name: "Target",
        defaultModeId: "target-dark-id",
        modes: [
          { modeId: "target-light-id", name: "light" },
          { modeId: "target-dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-target",
            name: "colorBase",
            resolvedType: "COLOR",
            valuesByMode: {
              "target-light-id": { r: 1, g: 1, b: 1, a: 1 },
              "target-dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-source",
        name: "Source",
        defaultModeId: "source-mode-1",
        modes: [{ modeId: "source-mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-alias",
            name: "colorAlias",
            resolvedType: "COLOR",
            valuesByMode: {
              "source-mode-1": { type: "VARIABLE_ALIAS", id: "var-target" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    const resolved = result[1].variables[0].valuesByMode[
      "source-mode-1"
    ] as VariableAlias;
    expect(resolved.id).toBe("TargetDark.colorBase");

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(1);
    expect(aliasResolveWarnings[0].message).toContain("Mode 1");
    expect(aliasResolveWarnings[0].message).toContain("light, dark");
    expect(aliasResolveWarnings[0].message).toContain("TargetDark.colorBase");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("参照先が単一モードの場合は、モード名が不一致でも警告せず defaultName に解決される", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-target",
        name: "Target",
        defaultModeId: "target-mode-1",
        modes: [{ modeId: "target-mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-target",
            name: "colorBase",
            resolvedType: "COLOR",
            valuesByMode: { "target-mode-1": { r: 1, g: 1, b: 1, a: 1 } },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-source",
        name: "Source",
        defaultModeId: "source-dark-id",
        modes: [
          { modeId: "source-light-id", name: "light" },
          { modeId: "source-dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-alias",
            name: "colorAlias",
            resolvedType: "COLOR",
            valuesByMode: {
              "source-light-id": { type: "VARIABLE_ALIAS", id: "var-target" },
              "source-dark-id": { type: "VARIABLE_ALIAS", id: "var-target" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    const resolvedDark = result[1].variables[0].valuesByMode[
      "source-dark-id"
    ] as VariableAlias;
    expect(resolvedDark.id).toBe("Target.colorBase");

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(0);
  });

  it("参照元の modeId がコレクションの modes に存在しない異常系では defaultName にフォールバックし警告する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-target",
        name: "Target",
        defaultModeId: "target-dark-id",
        modes: [
          { modeId: "target-light-id", name: "light" },
          { modeId: "target-dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-target",
            name: "colorBase",
            resolvedType: "COLOR",
            valuesByMode: {
              "target-light-id": { r: 1, g: 1, b: 1, a: 1 },
              "target-dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-source",
        name: "Source",
        defaultModeId: "source-mode-1",
        modes: [{ modeId: "source-mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-alias",
            name: "colorAlias",
            resolvedType: "COLOR",
            valuesByMode: {
              "ghost-mode": { type: "VARIABLE_ALIAS", id: "var-target" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    const resolved = result[1].variables[0].valuesByMode[
      "ghost-mode"
    ] as VariableAlias;
    expect(resolved.id).toBe("TargetDark.colorBase");

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(1);
    expect(aliasResolveWarnings[0].message).toContain("ghost-mode");
  });

  it("モード名の大文字小文字は区別され、不一致ならフォールバック＋警告する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-target",
        name: "Target",
        defaultModeId: "target-dark-id",
        modes: [
          { modeId: "target-light-id", name: "light" },
          { modeId: "target-dark-id", name: "dark" },
        ],
        variables: [
          {
            id: "var-target",
            name: "colorBase",
            resolvedType: "COLOR",
            valuesByMode: {
              "target-light-id": { r: 1, g: 1, b: 1, a: 1 },
              "target-dark-id": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-source",
        name: "Source",
        defaultModeId: "source-mode-1",
        modes: [{ modeId: "source-mode-1", name: "Light" }],
        variables: [
          {
            id: "var-alias",
            name: "colorAlias",
            resolvedType: "COLOR",
            valuesByMode: {
              "source-mode-1": { type: "VARIABLE_ALIAS", id: "var-target" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    const resolved = result[1].variables[0].valuesByMode[
      "source-mode-1"
    ] as VariableAlias;
    expect(resolved.id).toBe("TargetDark.colorBase");

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(1);
    expect(aliasResolveWarnings[0].message).toContain("Light");
  });

  it("参照先のモード名が重複していても、複数モードなら不一致時に警告する", () => {
    const collections: FigmaCollectionData[] = [
      {
        id: "col-target",
        name: "Target",
        defaultModeId: "target-dup-2",
        modes: [
          { modeId: "target-dup-1", name: "same" },
          { modeId: "target-dup-2", name: "same" },
        ],
        variables: [
          {
            id: "var-target",
            name: "colorBase",
            resolvedType: "COLOR",
            valuesByMode: {
              "target-dup-1": { r: 1, g: 1, b: 1, a: 1 },
              "target-dup-2": { r: 0, g: 0, b: 0, a: 1 },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
      {
        id: "col-source",
        name: "Source",
        defaultModeId: "source-mode-1",
        modes: [{ modeId: "source-mode-1", name: "Mode 1" }],
        variables: [
          {
            id: "var-alias",
            name: "colorAlias",
            resolvedType: "COLOR",
            valuesByMode: {
              "source-mode-1": { type: "VARIABLE_ALIAS", id: "var-target" },
            },
            description: "",
            scopes: ["ALL_SCOPES"],
          },
        ],
      },
    ];

    const warnings = createWarningCollector();
    const nameMap = createVariableNameMap(collections, warnings);
    const result = resolveAliasesForAllCollections(
      collections,
      nameMap,
      warnings,
    );

    // 参照先の 2 モードは同名 "same" のため modesByName.size は 1 に潰れるが、
    // 参照先は複数モードなので曖昧な参照として警告が出る必要がある。
    const resolved = result[1].variables[0].valuesByMode[
      "source-mode-1"
    ] as VariableAlias;
    expect(resolved.id).toBe("TargetSame.colorBase");

    const aliasResolveWarnings = warnings.items.filter(
      (w) => w.kind === "alias-resolve",
    );
    expect(aliasResolveWarnings).toHaveLength(1);
  });
});
