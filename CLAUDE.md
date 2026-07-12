# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Figmaのローカル変数・スタイルを W3C Design Tokens Draft (https://www.designtokens.org/tr/drafts/) 準拠のJSONへ変換し、modeごとのGroupに分割してZIPでダウンロードするFigmaプラグイン。Style Dictionaryなどで各プラットフォームへ展開できる。

## 主要コマンド

- `npm run build` — `build.mjs` が esbuild で2成果物をビルド: `src/code.ts` → `dist/code.js`（IIFE, ES2017, minified）、`src/ui/main.ts` → `src/ui/template.html` に埋め込んで `dist/ui.html`
- `npm run watch` — 開発用ウォッチビルド（dev mode、sourcemap有効、minifyなし）。`code.js` と `ui.html` を並行 watch。**`src/ui/template.html` の変更自体は esbuild の watch 対象外のためリビルドされない**（`src/ui/main.ts` 側を再保存するかビルドを再実行する）
- `npm run build:dev` — 型チェック → dev ビルド
- `npm run type-check` — `tsc -p tsconfig.json`（`src/`本体、DOM libなし）と `tsc -p tsconfig.ui.json`（`src/ui/`、DOM lib あり）の2プロジェクトを順に実行
- `npm run lint` / `npm run lint:fix`
- `npm run format` — Prettier
- `npm test` — vitest（`src/**/*.test.ts`、node環境、globals有効）
- 単一テスト実行: `npx vitest run src/converts/convertEffectStyleToShadow.test.ts`

## アーキテクチャ

### エントリポイントとランタイム構成
- **`src/code.ts`** — Figmaプラグインのメインスレッド側エントリ。`figma.showUI(__html__, { visible: false })` でUIをヘッドレス起動し、`main()` が逐次的にデータ取得→トークン生成→`figma.ui.postMessage(message)`（`PluginToUiMessage` 型）で UI に渡す。`figma.ui.onmessage` は `isUiToPluginMessage` で型ガードしてから分岐する。
- **`src/ui/main.ts`** — UIスレッド側エントリ（TypeScript、DOM lib あり）。npm 同梱の JSZip（`import JSZip from "jszip"`）を使い、`onmessage` で受け取った `PluginToUiMessage` を `isPluginToUiMessage` で型ガードし、`src/zipEntries.ts` の `buildZipEntries` が組み立てたエントリを zip に詰めてダウンロードする。完了/失敗は `UiToPluginMessage` 型で `parent.postMessage` に送る。ZIPファイル名は code.ts 側の `buildZipFilename`（`src/zipFilename.ts`）で組み立てられ、postMessage の `data.zipFilename` として渡される（欠落時は `"figma-export.zip"` にフォールバック）。
- **`src/ui/template.html`** — `<!-- %UI_SCRIPT% -->` プレースホルダのみを持つ最小テンプレート。`build.mjs` がバンドル済み `main.ts` の JS を `<script>` タグとして埋め込み `dist/ui.html` を生成する（生成物のため `dist/` は git 管理外）。
- **`src/zipEntries.ts`** — ZIPエントリ（ファイル名・JSON文字列）を組み立てる `buildZipEntries`（DOM/JSZip非依存、ユニットテスト可能。空 group への console.warn を除き副作用なし）。トークンファイルの出力拡張子 `.tokens.json`（DTCG推奨拡張子）は `tokenFileName(key)` が単一情報源。警告ファイル名は `WARNINGS_FILENAME`（`_export-warnings.json`、拡張子は変えない）。
- **`src/types/messages.ts`** — code.ts ⇄ UI 間の `PluginToUiMessage` / `UiToPluginMessage` 型と、ランタイム型ガード `isPluginToUiMessage` / `isUiToPluginMessage` の契約。
- **`manifest.json`** — `editorType: ["figma", "dev"]`, `documentAccess: "dynamic-page"`, `"ui": "dist/ui.html"`。JSZip をプラグイン本体にバンドルしたため `networkAccess.allowedDomains: ["none"]`（外部ネットワークアクセス不要）。

### `main()` の処理フロー（`src/code.ts`）
1. `getCollections()` でローカル変数を全Collection取得
2. `createVariableNameMap(collections)` で `VariableId → { defaultName, modes[modeId] }` のマップを構築
3. `resolveAliasesForAllCollections(collections, nameMap)` で `VARIABLE_ALIAS` のIDを名前パス（`{GroupName.tokenName}` 形式の元）に書き換える（**clone してから書き換える**点に注意）。resolve 済みであることは branded type `ResolvedVariableAlias`（`src/resolve/resolvedAlias.ts`）で表現され、convert 層は `getResolvedValue` 経由で valuesByMode を読む。`toTokenReference` は resolve 済み alias しか受け付けない（未 resolve の `VariableAlias` はコンパイルエラー）。
4. 各 collection を `convertCollectionToModeNamedGroups` で mode 単位の Group に変換
5. `getTextStyles(variableNameMap)` / `getPaintStyles(variableNameMap)` / `getEffectStyles(variableNameMap)` でスタイル系を変換（すべて variableNameMap を受け取り boundVariables を参照解決する）
6. すべてを配列でまとめて UI へ送る（`null` は型述語 `(c): c is NonNullable<typeof c> => c != null` で filter して除外）

`main()` の冒頭で `createWarningCollector()`（`src/warnings.ts`）を生成し、上記1〜5の各関数にオプション引数として渡す。変換に失敗した Variable/Style は1件単位でスキップされ、collector に記録された `warnings.items` は `postMessage` の data に含めて UI へ渡され、ZIP内 `_export-warnings.json` として出力される。

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
- **Text Styles** → `typography` トークン。lineHeight の単位（AUTO/PERCENT/PIXELS）と PIXELS の0.5〜3範囲判定など、`convertTextStyleToTypography.ts` 内の特殊ルールに注意。`fontSize=0` や lineHeight/letterSpacing が Infinity/NaN になると TypeError を投げる仕様。`boundVariables`（fontFamily/fontSize/letterSpacing/lineHeight、fontWeight は fontWeight bound 優先→fontStyle bound）があれば `resolveVariableAliasReference`（`src/converts/resolveVariableAliasReference.ts`）経由で `{GroupName.TokenName}` 参照を出力し、未解決は計算値フォールバック＋`kind: "alias-resolve"` 警告。lineHeight/letterSpacing が bound の場合は計算自体をスキップ（TypeError 検証も非適用）。paragraphSpacing/paragraphIndent の bound は無視。
- **Paint Styles** → `color`（SOLID）/ `gradient`（GRADIENT_LINEAR）。SOLID / GRADIENT とも `paint.opacity ?? 1` が 1 のときのみ `boundVariables.color` のエイリアス参照を採用する。opacity ≠ 1 の場合は参照を破棄して RGBA を焼き込み（SOLID: alpha = opacity、GRADIENT: stop の alpha × opacity）、エイリアスが存在した場合は `kind: "paint-opacity"` の警告を記録する（GRADIENT は 1 paint につき最大1件）。複数paintは `{name}-color-{index}` / `{name}-gradient-{index}` で命名（0始まり）。IMAGE/VIDEO は除外。ColorValue の構築は全変換共通で `makeColorValue`（`src/converts/util.ts`）を使い、alpha === 1 のときは DTCG 既定値（1）に合わせて `alpha` キーを省略する（alpha ≠ 1 の値は丸めずそのまま出力する）。
- **Effect Styles** → `shadow` トークン。`visible: true` かつ `DROP_SHADOW`/`INNER_SHADOW` のみ。1Style内の複数エフェクトは配列としてスタック順に保持。`INNER_SHADOW` のときだけ `inset: true`。各エフェクトの `boundVariables`（color/offsetX/offsetY/radius/spread。radius は token 側 `blur` に対応）はエフェクト単位で独立に `resolveVariableAliasReference` 経由で参照化し、未解決は値フォールバック＋`kind: "alias-resolve"` 警告。color が bound のときは alpha も参照先に従う（`effect.color.a` は破棄）。

### 型レイヤ（`src/types/`）
- `common.ts` — `AllTokenTypes`, `TokenReference = `{${string}}``, `TokenValue<T> = T | TokenReference`, `CommonProperties`
- `token.ts` — W3C Design Tokens の Type / Composite Type を `$type`/`$value` 形で定義（`TokenInterfaceMap` / `TokenOfType`）
- `group.ts` — `Group` は再帰可能なネスト構造。`GroupOfType<T>` は `$type` を任意化したトークン（中間ノードでまとめて型指定するため）。
- `figma.ts` — Figma SDK 型から必要フィールドだけ Pick したサブセット。テストで実型に依存しすぎないようにするための層。

### テストとモック
- テストは各実装ファイル隣接の `*.test.ts`。Figma SDK へは触らず、`mocks/` 以下のモックデータ（variables / textStyles / paintStyles / effectStyles）でユニットテストする方針。
- `vitest` は `globals: true` なので `describe/it/expect` は import 不要。

## コーディング規約
- ESLint: `eslint:recommended` + `@typescript-eslint/recommended` + `@figma/figma-plugins/recommended` + Prettier。`_` 始まりの未使用変数は許容。ESLint の `parserOptions.project` は `["./tsconfig.json", "./tsconfig.ui.json"]`。
- TypeScript strict + `target: ES2017`、`moduleResolution: Bundler`、`noEmit`（実バンドルは esbuild 側）。`tsconfig.base.json`（共通設定）を `tsconfig.json`（`src/` 本体、`lib: ["ES2017"]`、DOMなし、`@figma/plugin-typings` の typeRoots、`src/ui` を exclude）と `tsconfig.ui.json`（`src/ui/` 用、`lib` に `DOM`/`DOM.Iterable`、`esModuleInterop: true`、`@figma` typeRoots は含めない）の2つが extends する構成。
- 型のみの import は `import type` で明示する。
- ユーザー向け文言・エラーメッセージは日本語。
- `jszip` は `--save-exact` でバージョン固定した通常 dependency（`src/ui/main.ts` からのみ import）。

## レビュー指示（`.github/copilot-instructions.md` より要約）
- レビューコメントは日本語。
- 指摘は `【優先度】HIGH/MIDDLE/LOW`／`【指摘内容】`／`【なぜ問題か】`／`【推奨改善】`／`【参考】` の構造に従う。
- HIGH = 障害/セキュリティ、MIDDLE = 保守性、LOW = スタイル/軽微。
