# Export Design Tokens

Figmaのローカル変数・スタイルを、W3C Design Tokens Draft準拠のJSONへ変換・エクスポートする実験的プラグインです。エクスポートしたDesign TokensはStyle Dictionaryなどで各プラットフォームへ展開できます。

注意: 本プラグインは https://www.designtokens.org/tr/drafts/ を元にした実験的実装です。

## 概要
- Variable CollectionsをmodeごとにGroupとして出力
- グループ名は makeGroupName の規則に従います
    - modeが1つ: collection名
    - modeが複数: collection名 + Capitalize(mode名)（例: MyCollection + dark → MyCollectionDark）
- Variableのエイリアス(ID参照)は名前参照に解決して出力（参照形式: `{GroupName.TokenName}`）

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

## エイリアス（Alias）
- FigmaのエイリアスはID参照ですが、出力時は `{GroupName.TokenName}` 形式に解決します
- GroupNameは makeGroupName に基づく命名規則（単一: collection名、複数: collection名 + Capitalize(mode名)）で決定されます

## 出力構造（概要）
- modeごとに1 Group（フラットなトークン集合）
- Group名は makeGroupName の規則に従います
- Group内に各Tokenが格納されます（必要に応じてネスト可）

## ロードマップ
- [x] local variables
- [ ] Text Styles
- [ ] Color Styles
- [ ] Effect Styles

ご意見・不具合の報告はIssueまで