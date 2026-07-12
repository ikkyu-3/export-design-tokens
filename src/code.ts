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

figma.showUI(__html__, { width: 280, height: 80, visible: false });

const warnings = createWarningCollector();

figma.ui.onmessage = (msg: unknown) => {
  if (!isUiToPluginMessage(msg)) return;

  if (msg.type === "download-complete") {
    const warningCount = warnings.items.length;
    if (warningCount > 0) {
      figma.closePlugin(
        `エクスポートが完了しました（警告 ${warningCount} 件 / 詳細は ZIP 内の _export-warnings.json を確認してください）`,
      );
    } else {
      figma.closePlugin("エクスポートが完了しました");
    }
  } else if (msg.type === "error") {
    figma.closePlugin("エラーが発生しました: " + msg.error);
  }
};

async function main() {
  try {
    console.log("========== get collections ==========");
    const collections = await getCollections();

    console.log("========== create variable name map ==========");
    const variableNameMap = createVariableNameMap(collections, warnings);

    console.log("========== resolve aliases ==========");
    const resolvedAliasNames = resolveAliasesForAllCollections(
      collections,
      variableNameMap,
      warnings,
    );
    const groups = resolvedAliasNames.map((c) =>
      convertCollectionToModeNamedGroups(c, warnings),
    );

    console.log("========== get textStyles ==========");
    const typography = await getTextStyles(variableNameMap, warnings);

    console.log("========== get paintStyles ==========");
    const paintStyles = await getPaintStyles(variableNameMap, warnings);

    console.log("========== get effectStyles ==========");
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
    figma.closePlugin(`Export処理中にエラーが発生しました: ${String(e)}`);
  }
}

main();
