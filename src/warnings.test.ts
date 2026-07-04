import { describe, it, expect } from "vitest";
import { createWarningCollector } from "./warnings";

describe("createWarningCollector", () => {
  it("初期状態では items は空配列", () => {
    const collector = createWarningCollector();
    expect(collector.items).toEqual([]);
  });

  it("add で追加した警告が items に順番通り蓄積される", () => {
    const collector = createWarningCollector();

    collector.add({
      severity: "error",
      kind: "variable-convert",
      source: "Variable: color/brand/primary (mode: dark)",
      message: "boom",
    });
    collector.add({
      severity: "warning",
      kind: "alias-resolve",
      source: "TextStyle: Heading/H1",
      message: "not found",
    });

    expect(collector.items).toEqual([
      {
        severity: "error",
        kind: "variable-convert",
        source: "Variable: color/brand/primary (mode: dark)",
        message: "boom",
      },
      {
        severity: "warning",
        kind: "alias-resolve",
        source: "TextStyle: Heading/H1",
        message: "not found",
      },
    ]);
  });
});
