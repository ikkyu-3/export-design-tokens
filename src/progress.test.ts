import { describe, it, expect } from "vitest";
import {
  PROGRESS_STEPS,
  PROGRESS_STEP_LABELS,
  isProgressStep,
  progressPercent,
} from "./progress";

describe("PROGRESS_STEP_LABELS", () => {
  it("全ステップにラベルが存在する", () => {
    for (const step of PROGRESS_STEPS) {
      expect(typeof PROGRESS_STEP_LABELS[step]).toBe("string");
      expect(PROGRESS_STEP_LABELS[step].length).toBeGreaterThan(0);
    }
  });
});

describe("isProgressStep", () => {
  it.each(PROGRESS_STEPS)("%s は ProgressStep", (step) => {
    expect(isProgressStep(step)).toBe(true);
  });

  it("未知の文字列は false", () => {
    expect(isProgressStep("unknown")).toBe(false);
  });

  it("数値は false", () => {
    expect(isProgressStep(42)).toBe(false);
  });

  it("null は false", () => {
    expect(isProgressStep(null)).toBe(false);
  });

  it("undefined は false", () => {
    expect(isProgressStep(undefined)).toBe(false);
  });
});

describe("progressPercent", () => {
  it("各ステップの開始位置は単調増加する", () => {
    const starts = PROGRESS_STEPS.map((step) => progressPercent(step));
    expect(starts).toEqual([0, 70, 75, 80, 85, 90]);
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBeGreaterThan(starts[i - 1]);
    }
  });

  it("collections のサブ進捗: current=0/total=100 は開始位置と同じ 0", () => {
    expect(progressPercent("collections", 0, 100)).toBe(0);
  });

  it("collections のサブ進捗: current=50/total=100 は 35", () => {
    expect(progressPercent("collections", 50, 100)).toBe(35);
  });

  it("collections のサブ進捗: current=100/total=100 は 70（次ステップ convert の開始位置と同じ）", () => {
    expect(progressPercent("collections", 100, 100)).toBe(70);
  });

  it("zip は current/total 未指定だと開始位置の 90 になり、100 にはならない", () => {
    expect(progressPercent("zip")).toBe(90);
  });

  it("zip が完了 (current=total) すると 100 になる", () => {
    expect(progressPercent("zip", 10, 10)).toBe(100);
  });

  it("total=0 はサブ進捗を無視して開始位置を返す", () => {
    expect(progressPercent("collections", 50, 0)).toBe(0);
  });

  it("total が負の値はサブ進捗を無視して開始位置を返す", () => {
    expect(progressPercent("collections", 50, -10)).toBe(0);
  });

  it("current が NaN はサブ進捗を無視して開始位置を返す", () => {
    expect(progressPercent("collections", NaN, 100)).toBe(0);
  });

  it("total が NaN はサブ進捗を無視して開始位置を返す", () => {
    expect(progressPercent("collections", 50, NaN)).toBe(0);
  });

  it("current が Infinity はサブ進捗を無視して開始位置を返す", () => {
    expect(progressPercent("collections", Infinity, 100)).toBe(0);
  });

  it("total が Infinity はサブ進捗を無視して開始位置を返す", () => {
    expect(progressPercent("collections", 50, Infinity)).toBe(0);
  });

  it("current が負の値は 0% として扱われる（開始位置にクランプ）", () => {
    expect(progressPercent("collections", -10, 100)).toBe(0);
  });

  it("current > total は 100% として扱われる（そのステップの終端にクランプ）", () => {
    expect(progressPercent("collections", 150, 100)).toBe(70);
  });

  it("結果は常に 0-100 の範囲にクランプされる", () => {
    for (const step of PROGRESS_STEPS) {
      const percent = progressPercent(step, 1, 1);
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    }
  });

  it("結果は整数に丸められる", () => {
    // collections: start=0, weight=70, current=1/total=3 -> 23.33... -> 23
    expect(progressPercent("collections", 1, 3)).toBe(23);
  });
});
