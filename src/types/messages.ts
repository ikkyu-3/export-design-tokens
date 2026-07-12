import type { ExportWarning } from "../warnings";

/** code.ts → UI へ渡すダウンロードデータ。UI側をトークン内部型に結合させないため collections は緩い型で受け取る */
export interface DownloadZipData {
  collections: ReadonlyArray<Record<string, unknown>>;
  warnings: ReadonlyArray<ExportWarning>;
  zipFilename: string;
}

export type PluginToUiMessage = {
  type: "download-zip";
  data: DownloadZipData;
};

export type UiToPluginMessage =
  | { type: "download-complete" }
  | { type: "error"; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * code.ts から UI へ送られるメッセージかどうかを判定する。
 * UI 側が参照するフィールドの形まで検証する（要素の中身までは検証しない）。
 * zipFilename は欠落時フォールバック（src/ui/main.ts）を活かすため undefined も許容する。
 */
export function isPluginToUiMessage(
  value: unknown,
): value is PluginToUiMessage {
  if (!isRecord(value) || value.type !== "download-zip") {
    return false;
  }
  const data = value.data;
  return (
    isRecord(data) &&
    Array.isArray(data.collections) &&
    Array.isArray(data.warnings) &&
    (data.zipFilename === undefined || typeof data.zipFilename === "string")
  );
}

/** UI から code.ts へ送られるメッセージかどうかを判定する。参照するフィールドの形まで検証する */
export function isUiToPluginMessage(
  value: unknown,
): value is UiToPluginMessage {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === "download-complete" ||
    (value.type === "error" && typeof value.error === "string")
  );
}
