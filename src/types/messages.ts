import type { ExportWarning } from "../warnings";
import type { ProgressStep } from "../progress";
import { isProgressStep } from "../progress";

/** code.ts → UI へ渡すダウンロードデータ。UI側をトークン内部型に結合させないため collections は緩い型で受け取る */
export interface DownloadZipData {
  collections: ReadonlyArray<Record<string, unknown>>;
  warnings: ReadonlyArray<ExportWarning>;
  /** 省略時は UI 側（src/ui/main.ts）がデフォルト名にフォールバックする */
  zipFilename?: string;
}

export type PluginToUiMessage =
  | { type: "download-zip"; data: DownloadZipData }
  | {
      type: "export-progress";
      step: ProgressStep;
      current?: number;
      total?: number;
    }
  | { type: "export-error"; error: string };

export type UiToPluginMessage =
  | { type: "ui-ready" }
  | { type: "download-complete" }
  | { type: "close" }
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
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "download-zip") {
    const data = value.data;
    return (
      isRecord(data) &&
      Array.isArray(data.collections) &&
      Array.isArray(data.warnings) &&
      (data.zipFilename === undefined || typeof data.zipFilename === "string")
    );
  }

  if (value.type === "export-progress") {
    return (
      isProgressStep(value.step) &&
      (value.current === undefined || typeof value.current === "number") &&
      (value.total === undefined || typeof value.total === "number")
    );
  }

  if (value.type === "export-error") {
    return typeof value.error === "string";
  }

  return false;
}

/** UI から code.ts へ送られるメッセージかどうかを判定する。参照するフィールドの形まで検証する */
export function isUiToPluginMessage(
  value: unknown,
): value is UiToPluginMessage {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "ui-ready" || value.type === "close") {
    return true;
  }

  return (
    value.type === "download-complete" ||
    (value.type === "error" && typeof value.error === "string")
  );
}
