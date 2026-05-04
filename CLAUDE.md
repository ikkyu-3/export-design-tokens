# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Figmaのローカル変数・スタイルを W3C Design Tokens Draft (https://www.designtokens.org/tr/drafts/) 準拠のJSONへ変換し、modeごとのGroupに分割してZIPでダウンロードするFigmaプラグイン。Style Dictionaryなどで各プラットフォームへ展開できる。

## 主要コマンド

- `npm run build` — `src/code.ts` を esbuild で `dist/code.js` (IIFE, ES2017, minified) にバンドル
- `npm run watch` — 開発用ウォッチビルド（dev mode、sourcemap有効、minifyなし）
- `npm run build:dev` — 型チェック → dev ビルド
- `npm run type-check` — `tsc`（noEmit、strict）
- `npm run lint` / `npm run lint:fix`
- `npm run format` — Prettier
- `npm test` — vitest（`src/**/*.test.ts`、node環境、globals有効）
- 単一テスト実行: `npx vitest run src/converts/convertEffectStyleToShadow.test.ts`

## アーキテクチャ

### エントリポイントとランタイム構成
- **`src/code.ts`** — Figmaプラグインのメインスレッド側エントリ。`figma.showUI(__html__, { visible: false })` でUIをヘッドレス起動し、`main()` が逐次的にデータ取得→トークン生成→`figma.ui.postMessage({ type: "download-zip", ... })` で UI に渡す。
- **`ui.html`** — UIスレッド側。CDNの JSZip を使い、受け取った collections 配列をファイルに分割してZIPダウンロードする。`networkAccess.allowedDomains` に `https://cdnjs.cloudflare.com` を許可済み。
- **`manifest.json`** — `editorType: ["figma", "dev"]`, `documentAccess: "dynamic-page"`。

### `main()` の処理フロー（`src/code.ts`）
1. `getCollections()` でローカル変数を全Collection取得
2. `createVariableNameMap(collections)` で `VariableId → { defaultName, modes[modeId] }` のマップを構築
3. `resolveAliasesForAllCollections(collections, nameMap)` で `VARIABLE_ALIAS` のIDを名前パス（`{GroupName.tokenName}` 形式の元）に書き換える（**clone してから書き換える**点に注意）
4. 各 collection を `convertCollectionToModeNamedGroups` で mode 単位の Group に変換
5. `getTextStyles()` / `getPaintStyles(variableNameMap)` / `getEffectStyles()` でスタイル系を変換
6. すべてを配列でまとめて UI へ送る（`falsy` は filter で除外）

### Group 命名規則（`src/converts/util.ts: makeGroupName`）
- mode が1つ: `collection名`
- mode が複数: `${collection名}${Capitalize(mode名)}`（例: `MyCollection` + `dark` → `MyCollectionDark`）
- この命名は **alias 解決と Group生成の両方で使われる**ため、`makeGroupName` を変更する場合は両方の出力に影響する。

### 変数 → トークン振り分け（`src/converts/convertVariableToTokenBySpec.ts`）
`scopes` が未設定の Variable は出力対象外。それ以外は `resolvedType` と `scopes` の組み合わせで振り分ける:
- `COLOR` → color トークン
- `FLOAT` + scopes `["FONT_WEIGHT"]` → fontWeight
- `FLOAT` + scopes に `ALL_SCOPES`/`OPACITY` を含む → number
- `FLOAT` その他 → dimension（`unit: "px"`）
- `STRING` + scopes `["FONT_STYLE"]` → fontWeight（文字列）
- `STRING` + scopes `["FONT_FAMILY"]` → fontFamily

詳細表とエッジケースは README.md を参照。

### スタイル変換
- **Text Styles** → `typography` トークン。lineHeight の単位（AUTO/PERCENT/PIXELS）と PIXELS の0.5〜3範囲判定など、`convertTextStyleToTypography.ts` 内の特殊ルールに注意。`fontSize=0` や lineHeight/letterSpacing が Infinity/NaN になると TypeError を投げる仕様。
- **Paint Styles** → `color`（SOLID）/ `gradient`（GRADIENT_LINEAR）。SOLID は `boundVariables.color` のエイリアスがあれば常にそれを参照として採用する（`paint.opacity` の値に関係なく alias 優先）。GRADIENT は各 stop の `boundVariables.color` を見つつ、`paint.opacity === 1` のときのみエイリアス参照を採用し、それ以外は stop の alpha に paint 全体の opacity を掛け合わせて RGB(A) を出力する。複数paintは `{name}-color-{index}` / `{name}-gradient-{index}` で命名（0始まり）。IMAGE/VIDEO は除外。
- **Effect Styles** → `shadow` トークン。`visible: true` かつ `DROP_SHADOW`/`INNER_SHADOW` のみ。1Style内の複数エフェクトは配列としてスタック順に保持。`INNER_SHADOW` のときだけ `inset: true`。

### 型レイヤ（`src/types/`）
- `common.ts` — `AllTokenTypes`, `TokenReference = `{${string}}``, `TokenValue<T> = T | TokenReference`, `CommonProperties`
- `token.ts` — W3C Design Tokens の Type / Composite Type を `$type`/`$value` 形で定義（`TokenInterfaceMap` / `TokenOfType`）
- `group.ts` — `Group` は再帰可能なネスト構造。`GroupOfType<T>` は `$type` を任意化したトークン（中間ノードでまとめて型指定するため）。
- `figma.ts` — Figma SDK 型から必要フィールドだけ Pick したサブセット。テストで実型に依存しすぎないようにするための層。

### テストとモック
- テストは各実装ファイル隣接の `*.test.ts`。Figma SDK へは触らず、`mocks/` 以下のモックデータ（variables / textStyles / paintStyles / effectStyles）でユニットテストする方針。
- `vitest` は `globals: true` なので `describe/it/expect` は import 不要。

## コーディング規約
- ESLint: `eslint:recommended` + `@typescript-eslint/recommended` + `@figma/figma-plugins/recommended` + Prettier。`_` 始まりの未使用変数は許容。
- TypeScript strict + `target: ES2017`、`moduleResolution: Bundler`、`noEmit`（実バンドルは esbuild 側）。
- ユーザー向け文言・エラーメッセージは日本語。

## レビュー指示（`.github/copilot-instructions.md` より要約）
- レビューコメントは日本語。
- 指摘は `【優先度】HIGH/MIDDLE/LOW`／`【指摘内容】`／`【なぜ問題か】`／`【推奨改善】`／`【参考】` の構造に従う。
- HIGH = 障害/セキュリティ、MIDDLE = 保守性、LOW = スタイル/軽微。
