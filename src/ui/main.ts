import JSZip from "jszip";
import type { DownloadZipData, UiToPluginMessage } from "../types/messages";
import { isPluginToUiMessage } from "../types/messages";
import { buildZipEntries } from "../zipEntries";

function postToPlugin(message: UiToPluginMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

async function downloadAsZip(
  data: DownloadZipData,
  zipFilename = "figma-export.zip",
): Promise<void> {
  try {
    const zip = new JSZip();

    const { collections, warnings } = data;

    for (const entry of buildZipEntries(collections, warnings)) {
      zip.file(entry.filename, entry.content);
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6, // 圧縮レベル (1-9)
      },
    });

    // ZIPファイルをダウンロード
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = zipFilename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 完了通知
    postToPlugin({ type: "download-complete" });
  } catch (error) {
    console.error("ZIP作成エラー:", error);

    postToPlugin({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

onmessage = (event: MessageEvent) => {
  const msg: unknown = event.data?.pluginMessage;

  if (isPluginToUiMessage(msg) && msg.type === "download-zip") {
    // zipFilename は code.ts 側でサニタイズ・組み立て済み。
    // 欠落時（バージョンずれ）は downloadAsZip のデフォルト名にフォールバック
    downloadAsZip(msg.data, msg.data.zipFilename || undefined);
  }
};
