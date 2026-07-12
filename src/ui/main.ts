import JSZip from "jszip";
import type { DownloadZipData, UiToPluginMessage } from "../types/messages";
import { isPluginToUiMessage } from "../types/messages";
import { buildZipEntries } from "../zipEntries";
import { PROGRESS_STEP_LABELS, progressPercent } from "../progress";

function postToPlugin(message: UiToPluginMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`要素が見つかりません: #${id}`);
  }
  return el as T;
}

const progressView = getElement<HTMLDivElement>("progress-view");
const progressLabel = getElement<HTMLDivElement>("progress-label");
const progressFill = getElement<HTMLDivElement>("progress-fill");
const resultView = getElement<HTMLDivElement>("result-view");
const resultStatus = getElement<HTMLDivElement>("result-status");
const resultDetail = getElement<HTMLDivElement>("result-detail");
const closeButton = getElement<HTMLButtonElement>("close-button");

/** 進捗ビューを表示する（結果ビューは隠す） */
function showProgress(label: string, percent: number): void {
  progressView.hidden = false;
  resultView.hidden = true;
  progressLabel.textContent = label;
  progressFill.style.width = `${percent}%`;
}

/** 結果ビューを表示する（進捗ビューは隠す） */
function showResult(options: {
  status: string;
  detail?: string;
  isError?: boolean;
}): void {
  progressView.hidden = true;
  resultView.hidden = false;
  resultStatus.textContent = options.status;
  resultStatus.classList.toggle("is-error", !!options.isError);
  resultDetail.textContent = options.detail ?? "";
}

closeButton.addEventListener("click", () => {
  postToPlugin({ type: "close" });
});

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

    if (warnings.length === 0) {
      showResult({ status: "エクスポートが完了しました" });
    } else {
      showResult({
        status: `エクスポートが完了しました（警告 ${warnings.length} 件）`,
        detail: "詳細は ZIP 内の _export-warnings.json を確認してください",
      });
    }

    // 完了通知（プラグイン側は警告0件のときのみ即クローズする）
    postToPlugin({ type: "download-complete" });
  } catch (error) {
    console.error("ZIP作成エラー:", error);

    const message = error instanceof Error ? error.message : String(error);
    showResult({
      status: "ZIP の作成に失敗しました",
      detail: message,
      isError: true,
    });

    postToPlugin({
      type: "error",
      error: message,
    });
  }
}

onmessage = (event: MessageEvent) => {
  const msg: unknown = event.data?.pluginMessage;

  if (!isPluginToUiMessage(msg)) return;

  if (msg.type === "download-zip") {
    // zipFilename は code.ts 側でサニタイズ・組み立て済み。
    // 欠落時（バージョンずれ）は downloadAsZip のデフォルト名にフォールバック
    showProgress(PROGRESS_STEP_LABELS.zip, progressPercent("zip"));
    downloadAsZip(msg.data, msg.data.zipFilename || undefined);
  } else if (msg.type === "export-progress") {
    showProgress(
      PROGRESS_STEP_LABELS[msg.step],
      progressPercent(msg.step, msg.current, msg.total),
    );
  } else if (msg.type === "export-error") {
    showResult({
      status: "エクスポートに失敗しました",
      detail: msg.error,
      isError: true,
    });
  }
};

postToPlugin({ type: "ui-ready" });
