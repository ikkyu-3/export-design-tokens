import { getCollections } from "./collections";
import { getTextStyles } from "./textStyles";
import { getEffectStyles } from "./effectStyles";
import { convertCollectionToModeNamedGroups } from "./converts/convertCollectionToGroup";
import { resolveAliasesForAllCollections } from "./resolve";
import { getPaintStyles } from "./paintStyles";
import { createVariableNameMap } from "./resolve/createVariableNameMap";
import { createWarningCollector } from "./warnings";
import { findDuplicateFileNames } from "./duplicates";
import { buildZipFilename } from "./zipFilename";
import { tokenFileName } from "./zipEntries";
import { isUiToPluginMessage } from "./types/messages";
import type { PluginToUiMessage } from "./types/messages";
import type { ProgressStep } from "./progress";

figma.showUI(__html__, { width: 280, height: 120, themeColors: true });

const warnings = createWarningCollector();

/** 進捗ステップを UI へ通知する */
function postProgress(
  step: ProgressStep,
  current?: number,
  total?: number,
): void {
  const message: PluginToUiMessage = {
    type: "export-progress",
    step,
    current,
    total,
  };
  figma.ui.postMessage(message);
}

/** postMessage をUIスレッドへ描画させるための1tick譲渡 */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// main() の多重起動防止（UI 側からの ui-ready は原則1回だが念のため）
let started = false;

figma.ui.onmessage = (msg: unknown) => {
  if (!isUiToPluginMessage(msg)) return;

  if (msg.type === "ui-ready") {
    if (started) return;
    started = true;
    main();
  } else if (msg.type === "download-complete") {
    // 警告がなければ即クローズ。警告ありの場合は UI が完了ビューを表示し続けるため、
    // ユーザーが閉じるボタンを押す（"close" メッセージ）まで何もしない
    if (warnings.items.length === 0) {
      figma.closePlugin("エクスポートが完了しました");
    }
  } else if (msg.type === "close") {
    figma.closePlugin();
  } else if (msg.type === "error") {
    console.error("UIエラー:", msg.error);
  }
};

async function main() {
  try {
    console.log("========== get collections ==========");
    postProgress("collections");
    const collections = await getCollections((done, total) =>
      postProgress("collections", done, total),
    );

    console.log("========== convert ==========");
    postProgress("convert");
    await yieldToUi();
    const variableNameMap = createVariableNameMap(collections, warnings);
    const resolvedAliasNames = resolveAliasesForAllCollections(
      collections,
      variableNameMap,
      warnings,
    );
    const groups = resolvedAliasNames.map((c) =>
      convertCollectionToModeNamedGroups(c, warnings),
    );

    console.log("========== get textStyles ==========");
    postProgress("text-styles");
    await yieldToUi();
    const typography = await getTextStyles(variableNameMap, warnings);

    console.log("========== get paintStyles ==========");
    postProgress("paint-styles");
    await yieldToUi();
    const paintStyles = await getPaintStyles(variableNameMap, warnings);

    console.log("========== get effectStyles ==========");
    postProgress("effect-styles");
    await yieldToUi();
    const effectStyles = await getEffectStyles(variableNameMap, warnings);

    const collectionsData = [
      ...groups,
      typography,
      paintStyles,
      effectStyles,
    ].filter((c): c is NonNullable<typeof c> => c != null);

    for (const { name, count } of findDuplicateFileNames(collectionsData)) {
      const filename = tokenFileName(name);
      const message = `出力ファイル名 "${filename}" が ${count} 件の出力で重複しています。ZIP 内では最後の 1 件で上書きされます。`;
      console.warn(message);
      warnings.add({
        severity: "warning",
        kind: "duplicate",
        source: `File: ${filename}`,
        message,
      });
    }

    const message: PluginToUiMessage = {
      type: "download-zip",
      data: {
        collections: collectionsData,
        warnings: warnings.items,
        zipFilename: buildZipFilename(figma.root.name, new Date()),
      },
    };
    figma.ui.postMessage(message);
  } catch (e) {
    console.error(e);
    const message: PluginToUiMessage = {
      type: "export-error",
      error: String(e),
    };
    figma.ui.postMessage(message);
  }
}
