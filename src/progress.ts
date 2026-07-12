/**
 * エクスポート処理の進捗ステップとその % 換算ロジック。
 * code.ts（Figmaメインスレッド）と src/ui/main.ts の両方から参照される
 * 環境非依存の共有モジュール。
 */
export const PROGRESS_STEPS = [
  "collections",
  "convert",
  "text-styles",
  "paint-styles",
  "effect-styles",
  "zip",
] as const;

export type ProgressStep = (typeof PROGRESS_STEPS)[number];

export const PROGRESS_STEP_LABELS: Record<ProgressStep, string> = {
  collections: "Variable を読み込んでいます…",
  convert: "Variable を変換しています…",
  "text-styles": "Text Style を変換しています…",
  "paint-styles": "Paint Style を変換しています…",
  "effect-styles": "Effect Style を変換しています…",
  zip: "ZIP を作成しています…",
};

export function isProgressStep(value: unknown): value is ProgressStep {
  return (
    typeof value === "string" &&
    (PROGRESS_STEPS as readonly string[]).includes(value)
  );
}

/**
 * 各ステップの重み（合計100）。collections が Variable 取得（重い非同期処理）
 * の大半を占めるため大きく配分し、残りのステップは同期変換中心のため小さく配分する。
 */
const PROGRESS_WEIGHTS: Record<ProgressStep, number> = {
  collections: 70,
  convert: 5,
  "text-styles": 5,
  "paint-styles": 5,
  "effect-styles": 5,
  zip: 10,
};

/** step の開始位置（%） = それ以前のステップの重み合計 */
function stepStartPercent(step: ProgressStep): number {
  let start = 0;
  for (const s of PROGRESS_STEPS) {
    if (s === step) break;
    start += PROGRESS_WEIGHTS[s];
  }
  return start;
}

/**
 * step の進捗を 0-100 の整数 % に変換する。
 * current/total が両方とも有限数かつ total > 0 のときのみ、step 内をサブ進捗として
 * 線形補間する（比率は 0-1 にクランプ）。それ以外（total が 0/負/非有限、current が
 * 非有限、または未指定）はサブ進捗を無視し、step の開始位置を返す。
 */
export function progressPercent(
  step: ProgressStep,
  current?: number,
  total?: number,
): number {
  const start = stepStartPercent(step);
  const weight = PROGRESS_WEIGHTS[step];

  let percent = start;

  if (
    typeof current === "number" &&
    typeof total === "number" &&
    Number.isFinite(current) &&
    Number.isFinite(total) &&
    total > 0
  ) {
    const ratio = Math.min(Math.max(current / total, 0), 1);
    percent = start + weight * ratio;
  }

  return Math.round(Math.min(100, Math.max(0, percent)));
}
