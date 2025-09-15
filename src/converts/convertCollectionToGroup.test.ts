import { describe, it, expect } from "vitest";
import {
  mockFlatModeCollectionData,
  mockMultiModeCollectionData,
} from "../../mocks/variables";
import { convertCollectionToModeNamedGroups } from "./convertCollectionToGroup";
import { capitalize } from "./util";

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
});
