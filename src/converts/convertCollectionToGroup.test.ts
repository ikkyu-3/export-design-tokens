import { describe, it, expect, vi } from "vitest";
import {
  mockFlatModeCollectionData,
  mockMultiModeCollectionData,
} from "../../mocks/variables";
import { convertCollectionToModeNamedGroups } from "./convertCollectionToGroup";
import { capitalize } from "./util";
import { createWarningCollector } from "../warnings";
import { FigmaCollectionData } from "../collections";

describe("convertCollectionToModeNamedGroups", () => {
  it("単一 mode の場合、キーは collection 名になる", () => {
    const result = convertCollectionToModeNamedGroups(
      mockFlatModeCollectionData,
    );

    const expectedKey = mockFlatModeCollectionData.name;
    expect(Object.keys(result)).toEqual([expectedKey]);

    const group = result[expectedKey];
    expect(group.$description).toBe(
      `Collection: ${mockFlatModeCollectionData.name}`,
    );
    expect(Object.keys(group).length).toBeGreaterThan(1);
  });

  it("複数 mode の場合、キーは collection名_mode名 になる", () => {
    const result = convertCollectionToModeNamedGroups(
      mockMultiModeCollectionData,
    );

    const keys = Object.keys(result).sort();
    const expectedKeys = mockMultiModeCollectionData.modes
      .map((m) => `${mockMultiModeCollectionData.name}${capitalize(m.name)}`)
      .sort();

    expect(keys).toEqual(expectedKeys);

    for (const mode of mockMultiModeCollectionData.modes) {
      const key = `${mockMultiModeCollectionData.name}${capitalize(mode.name)}`;
      const group = result[key];
      expect(group.$description).toBe(
        `Collection: ${mockMultiModeCollectionData.name} | Mode: ${mode.name}`,
      );
      expect(Object.keys(group).length).toBeGreaterThan(1);
    }
  });

  it("modes が 0 件の場合は空オブジェクトを返す", () => {
    const noModes = {
      ...mockFlatModeCollectionData,
      modes: [],
    };

    const result = convertCollectionToModeNamedGroups(noModes);
    expect(result).toEqual({});
  });

  it("同一 collection 内に同名の variable が複数ある場合（単一 mode）、entries は1件に集約され duplicate warning が1件記録される", () => {
    const collection: FigmaCollectionData = {
      id: "VariableCollectionId:dup:1",
      name: "dupCollection",
      defaultModeId: "mode-1",
      modes: [{ modeId: "mode-1", name: "Mode 1" }],
      variables: [
        {
          id: "VariableID:dup:1",
          name: "duplicated",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
        {
          id: "VariableID:dup:2",
          name: "duplicated",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 0, g: 0, b: 1, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const warnings = createWarningCollector();
    const result = convertCollectionToModeNamedGroups(collection, warnings);

    const group = result[collection.name];
    const entryKeys = Object.keys(group).filter((k) => !k.startsWith("$"));
    expect(entryKeys).toEqual(["duplicated"]);

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("複数 mode（2 modes）で同名 variable が2件ある場合、mode 毎に warning が出るため2件記録される（仕様）", () => {
    const collection: FigmaCollectionData = {
      id: "VariableCollectionId:dup:2",
      name: "dupMultiModeCollection",
      defaultModeId: "mode-a",
      modes: [
        { modeId: "mode-a", name: "light" },
        { modeId: "mode-b", name: "dark" },
      ],
      variables: [
        {
          id: "VariableID:dup:3",
          name: "duplicated",
          resolvedType: "COLOR",
          valuesByMode: {
            "mode-a": { r: 1, g: 1, b: 1, a: 1 },
            "mode-b": { r: 0, g: 0, b: 0, a: 1 },
          },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
        {
          id: "VariableID:dup:4",
          name: "duplicated",
          resolvedType: "COLOR",
          valuesByMode: {
            "mode-a": { r: 0.5, g: 0.5, b: 0.5, a: 1 },
            "mode-b": { r: 0.2, g: 0.2, b: 0.2, a: 1 },
          },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const warnings = createWarningCollector();
    const result = convertCollectionToModeNamedGroups(collection, warnings);

    expect(Object.keys(result).sort()).toEqual(
      collection.modes
        .map((m) => `${collection.name}${capitalize(m.name)}`)
        .sort(),
    );

    // buildGroupForMode は mode ごとに独立した entries を持つため、
    // 同名 variable の重複は mode の数だけ warning が記録される。
    expect(warnings.items).toHaveLength(2);
    expect(warnings.items.every((w) => w.kind === "duplicate")).toBe(true);

    warnSpy.mockRestore();
  });

  it("変数名が命名制約に違反する場合、entry のキーはサニタイズされる（無警告）", () => {
    const collection: FigmaCollectionData = {
      id: "VariableCollectionId:sanitize:1",
      name: "SanitizeCollection",
      defaultModeId: "mode-1",
      modes: [{ modeId: "mode-1", name: "Mode 1" }],
      variables: [
        {
          id: "VariableID:sanitize:1",
          name: "color.primary",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    };

    const result = convertCollectionToModeNamedGroups(collection);
    const group = result[collection.name];
    const entryKeys = Object.keys(group).filter((k) => !k.startsWith("$"));
    expect(entryKeys).toEqual(["color-primary"]);
  });

  it("collection 名が命名制約に違反する場合（単一 mode）、トップレベルキーはサニタイズされる", () => {
    const collection: FigmaCollectionData = {
      id: "VariableCollectionId:sanitize:2",
      name: "my.col",
      defaultModeId: "mode-1",
      modes: [{ modeId: "mode-1", name: "Mode 1" }],
      variables: [
        {
          id: "VariableID:sanitize:2",
          name: "tokenA",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    };

    const result = convertCollectionToModeNamedGroups(collection);
    expect(Object.keys(result)).toEqual(["my-col"]);
  });

  it("無警告設計: collector を渡してもサニタイズによる name-sanitize warning は記録されない", () => {
    const collection: FigmaCollectionData = {
      id: "VariableCollectionId:sanitize:3",
      name: "my.col",
      defaultModeId: "mode-1",
      modes: [{ modeId: "mode-1", name: "Mode 1" }],
      variables: [
        {
          id: "VariableID:sanitize:3",
          name: "color.primary",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    };

    const warnings = createWarningCollector();
    convertCollectionToModeNamedGroups(collection, warnings);

    expect(warnings.items.filter((w) => w.kind === "name-sanitize")).toEqual(
      [],
    );
  });

  it("サニタイズ由来の新規衝突: 変数 a.b と a-b が同一 collection にある場合、entries は1件（後勝ち）に集約され duplicate warning が1件記録される", () => {
    const collection: FigmaCollectionData = {
      id: "VariableCollectionId:sanitize:4",
      name: "CollisionCollection",
      defaultModeId: "mode-1",
      modes: [{ modeId: "mode-1", name: "Mode 1" }],
      variables: [
        {
          id: "VariableID:sanitize:4a",
          name: "a.b",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
        {
          id: "VariableID:sanitize:4b",
          name: "a-b",
          resolvedType: "COLOR",
          valuesByMode: { "mode-1": { r: 0, g: 0, b: 1, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const warnings = createWarningCollector();
    const result = convertCollectionToModeNamedGroups(collection, warnings);

    const group = result[collection.name];
    const entryKeys = Object.keys(group).filter((k) => !k.startsWith("$"));
    expect(entryKeys).toEqual(["a-b"]);

    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "duplicate",
    });

    warnSpy.mockRestore();
  });
});
