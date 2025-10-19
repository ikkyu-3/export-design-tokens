import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FigmaCollectionData } from "../collections";
import { resolveAliasesForAllCollections } from "./index";
import { createVariableNameMap } from "./createVariableNameMap";

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
});
