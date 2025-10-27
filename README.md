# Export Design Tokens

Figmaのローカル変数・スタイルを、W3C Design Tokens Draft準拠のJSONへ変換・エクスポートする実験的プラグインです。エクスポートしたDesign TokensはStyle Dictionaryなどで各プラットフォームへ展開できます。

注意: 本プラグインは https://www.designtokens.org/tr/drafts/ を元にした実験的実装です。

## 概要
- Variable CollectionsをmodeごとにGroupとして出力
- グループ名は makeGroupName の規則に従います
    - modeが1つ: collection名
    - modeが複数: collection名 + Capitalize(mode名)（例: MyCollection + dark → MyCollectionDark）
- Variableのエイリアス(ID参照)は名前参照に解決して出力（参照形式: `{GroupName.TokenName}`）
- Text Styles を Typography トークンとして出力
- Paint Styles を Color/Gradient トークンとして出力

## 処理の流れ
- プラグイン実行 → ローカル変数/スタイルを取得 → エイリアス解決 → JSON生成 → ZIPでダウンロード

## 変換ルール（scopeとtoken種別の対応）

次の表は、変数の resolvedType と scopes に応じて出力されるトークン種別を示します（内部実装の変換ロジックに基づく）。

| Figma resolvedType | scope 条件 | 出力 token 種別 | 備考                                   |
|---|---|---|--------------------------------------|
| COLOR | scopesが設定されていること | color | 値がエイリアスなら参照文字列（`{path.to.token}`）に変換 |
| FLOAT | scopes に `ALL_SCOPES` または `OPACITY` を含む | number | 不透明度や一般数値として扱いたい場合                   |
| FLOAT | 上記以外（例: `WIDTH_HEIGHT`, `GAP`, `FONT_SIZE` など） | dimension | 単位は `"px"` として出力                     |
| FLOAT | `["FONT_WEIGHT"]` | fontWeight | 数値のフォントウェイト（例: `400`）                |
| STRING | `["FONT_STYLE"]` | fontWeight | 文字列のフォントウェイト（例: `"regular"`）         |
| STRING | `["FONT_FAMILY"]` | fontFamily | フォントファミリー名                           |
| 上記以外 | — | 出力しない | 該当しない場合は除外                           |

注意:
- scopes が未設定の Variable は出力対象外です
- FLOAT を dimension として出力したい場合、`ALL_SCOPES`/`OPACITY` を含めないでください（含むと number とみなされます）
- fontWeight は FLOAT/STRING で条件が異なります（上表参照）

## Text Styles (Typography) 変換ルール

Text Styles は `typography` トークンに変換されます。以下のプロパティが含まれます：

| プロパティ | 変換ルール |
|---|---|
| fontFamily | `fontName.family` をそのまま使用 |
| fontWeight | `fontName.style` から数値に変換（例: "Bold" → 700、未定義は 400） |
| fontSize | `fontSize` を `{ value: number, unit: "px" }` 形式で出力 |
| letterSpacing | PIXELS の場合はそのまま、PERCENT の場合は `fontSize * (value / 100)` で px に変換 |
| lineHeight | unitless（数値）として出力。変換ルールは以下の通り |

### lineHeight 変換ルール

| Figma unit | 変換ルール |
|---|---|
| AUTO | 1.5 を返す |
| PERCENT | `value / 100` で比率に変換（小数第2位で四捨五入） |
| PIXELS（0.5〜3の範囲） | そのまま unitless として採用（小数第2位で四捨五入） |
| PIXELS（上記以外） | `lineHeightPx / fontSizePx` で比率を算出（小数第2位で四捨五入） |

注意:
- lineHeight/letterSpacing で Infinity/NaN が検出された場合は TypeError を投げます
- fontSize が 0 の場合も TypeError を投げます
- 数値の丸め処理には `roundTo2ndDecimal` を使用し、浮動小数点誤差を軽減しています

## Paint Styles (Color/Gradient) 変換ルール

Paint Styles は `color` または `gradient` トークンに変換されます。

### SOLID Paint → Color Token

- SOLID タイプのペイントを `color` トークンに変換
- boundVariables に color エイリアスがある場合：
  - `paint.opacity === 1` の場合のみエイリアス参照を使用（`{GroupName.tokenName}`）
  - `paint.opacity !== 1` の場合は透明度を掛け合わせた値を出力
- boundVariables がない場合は RGB(A) 値をそのまま出力

### GRADIENT_LINEAR Paint → Gradient Token

- GRADIENT_LINEAR タイプのペイントを `gradient` トークンに変換
- 各 gradientStop の色を以下のルールで処理：
  - boundVariables に color エイリアスがある場合：
    - `paint.opacity === 1` の場合のみエイリアス参照を使用
    - `paint.opacity !== 1` の場合は各停止点の透明度にペイント全体の透明度を掛け合わせ
  - RGB(A) 値の場合は同様に透明度を適用

### 命名規則

- 単数：PaintStyle の name をそのまま使用
- 複数：`{name}-color-{index}` または `{name}-gradient-{index}` で命名（0始まり）

### 非対応タイプ

- IMAGE/VIDEO タイプは出力対象外

## エイリアス（Alias）
- FigmaのエイリアスはID参照ですが、出力時は `{GroupName.TokenName}` 形式に解決します
- GroupNameは makeGroupName に基づく命名規則（単一: collection名、複数: collection名 + Capitalize(mode名)）で決定されます

## 出力構造（概要）
- modeごとに1 Group（フラットなトークン集合）
- Group名は makeGroupName の規則に従います
- Group内に各Tokenが格納されます（必要に応じてネスト可）

## ロードマップ
- [x] local variables
- [x] Text Styles
- [x] Color Styles (Paint Styles)
- [ ] Effect Styles

ご意見・不具合の報告はIssueまで