import { describe, it, expect } from "vitest";
import { chunk } from "./collections";

describe("chunk", () => {
  it("size で均等に割り切れる配列を分割する", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("端数があるときは最後のチャンクが短くなる", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("空配列は空配列を返す", () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it("size が配列長以上のときは1チャンクにまとまる", () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it("size が配列長と等しいときは1チャンクにまとまる", () => {
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("size が1のときは要素ごとに分割される", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it("size が0以下のときは全件を1チャンクにまとめる", () => {
    expect(chunk([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunk([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("size が0以下でも空配列は空配列を返す", () => {
    expect(chunk([], 0)).toEqual([]);
  });

  it("元の配列を変更しない", () => {
    const items = [1, 2, 3, 4];
    chunk(items, 2);
    expect(items).toEqual([1, 2, 3, 4]);
  });
});
