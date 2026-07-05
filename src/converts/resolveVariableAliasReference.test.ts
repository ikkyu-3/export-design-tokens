import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveVariableAliasReference } from "./resolveVariableAliasReference";
import { createVariableNameMap } from "../resolve/createVariableNameMap";
import { createWarningCollector } from "../warnings";
import type { FigmaCollectionData } from "../collections";

describe("resolveVariableAliasReference", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const collections: FigmaCollectionData[] = [
    {
      id: "VariableCollectionId:1:2",
      name: "Colors",
      defaultModeId: "1:0",
      modes: [{ modeId: "1:0", name: "Mode 1" }],
      variables: [
        {
          id: "VariableID:133:3",
          name: "primary",
          resolvedType: "COLOR",
          valuesByMode: { "1:0": { r: 1, g: 0, b: 0, a: 1 } },
          description: "",
          scopes: ["ALL_SCOPES"],
        },
      ],
    },
  ];

  it("alias が undefined の場合は null を返し、警告は出さない", () => {
    const variableNameMap = createVariableNameMap(collections);
    const warnings = createWarningCollector();

    const result = resolveVariableAliasReference({
      alias: undefined,
      variableNameMap,
      source: "TextStyle: Body",
      prefix: "textStyle",
      field: "fontSize",
      warnings,
    });

    expect(result).toBeNull();
    expect(warnings.items).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("alias.type が VARIABLE_ALIAS でない場合は null を返し、警告は出さない", () => {
    const variableNameMap = createVariableNameMap(collections);
    const warnings = createWarningCollector();

    const result = resolveVariableAliasReference({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alias: { type: "NOT_ALIAS", id: "VariableID:133:3" } as any,
      variableNameMap,
      source: "TextStyle: Body",
      prefix: "textStyle",
      field: "fontSize",
      warnings,
    });

    expect(result).toBeNull();
    expect(warnings.items).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("variableNameMap にヒットする場合は参照文字列を返す", () => {
    const variableNameMap = createVariableNameMap(collections);
    const warnings = createWarningCollector();

    const result = resolveVariableAliasReference({
      alias: { type: "VARIABLE_ALIAS", id: "VariableID:133:3" },
      variableNameMap,
      source: "TextStyle: Body",
      prefix: "textStyle",
      field: "fontSize",
      warnings,
    });

    expect(result).toBe("{Colors.primary}");
    expect(warnings.items).toEqual([]);
  });

  it("variableNameMap にヒットしない場合は null を返し、console.warn と warnings.add を行う", () => {
    const warnings = createWarningCollector();

    const result = resolveVariableAliasReference({
      alias: { type: "VARIABLE_ALIAS", id: "VariableID:999:999" },
      variableNameMap: new Map(),
      source: "TextStyle: Body",
      prefix: "textStyle",
      field: "fontSize",
      warnings,
    });

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Variable ID not found"),
    );
    expect(warnings.items).toHaveLength(1);
    expect(warnings.items[0]).toMatchObject({
      severity: "warning",
      kind: "alias-resolve",
      source: "TextStyle: Body",
    });
    expect(warnings.items[0].message).toContain("(field:");
  });
});
