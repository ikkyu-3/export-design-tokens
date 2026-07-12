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

/** code.ts から UI へ送られるメッセージかどうかを判定する（過剰に深い検証はしない） */
export function isPluginToUiMessage(
  value: unknown,
): value is PluginToUiMessage {
  return isRecord(value) && value.type === "download-zip";
}

/** UI から code.ts へ送られるメッセージかどうかを判定する（過剰に深い検証はしない） */
export function isUiToPluginMessage(
  value: unknown,
): value is UiToPluginMessage {
  return (
    isRecord(value) &&
    (value.type === "download-complete" || value.type === "error")
  );
}
