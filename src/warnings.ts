export interface ExportWarning {
  severity: "error" | "warning";
  kind: "variable-convert" | "style-convert" | "alias-resolve" | "name-map";
  source: string;
  message: string;
}

export function createWarningCollector() {
  const items: ExportWarning[] = [];

  return {
    add(warning: ExportWarning) {
      items.push(warning);
    },
    get items(): ExportWarning[] {
      return items;
    },
  };
}

export type WarningCollector = ReturnType<typeof createWarningCollector>;
