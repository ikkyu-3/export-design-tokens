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
- Effect Styles を Shadow トークンとして出力
- Variable / Text Style / Paint Style / Effect Style の名前に含まれる `/` 区切りは、ネストしたGroup構造に再構築されます（例: `color/brand/primary` → `{ color: { brand: { primary: <token> } } }`）

## 処理の流れ
- プラグイン実行 → ローカル変数/スタイルを取得 → エイリアス解決 → JSON生成 → ZIPでダウンロード
- 出力ファイルの拡張子は `{キー}.tokens.json`（DTCG推奨拡張子）です（`_export-warnings.json` を除く）
- ZIP生成にはJSZipをプラグイン本体にバンドルして使用しており、外部ネットワークアクセスは不要です（`manifest.json` の `networkAccess.allowedDomains` は `["none"]`）

## 変換に失敗した場合の挙動（警告の集約）
- Variable / Text Style / Paint Style / Effect Style は、変換に失敗しても1件単位でスキップされ、エクスポート全体は継続します
- 発生した警告・エラーは集約され、ZIP内に `_export-warnings.json` として出力されます（`{ "warnings": [...] }` 形式。各要素は `severity` / `kind` / `source` / `message` を持ちます）
- エクスポート完了時のトーストに警告件数が表示されます（例: 「エクスポートが完了しました（警告 2 件 / 詳細は ZIP 内の _export-warnings.json を確認してください）」）
- 警告が無い場合は「エクスポートが完了しました」のみ表示されます

## 変換ルール（scopeとtoken種別の対応）

次の表は、変数の resolvedType と scopes に応じて出力されるトークン種別を示します（内部実装の変換ロジックに基づく）。

| Figma resolvedType | scope 条件 | 出力 token 種別 | 備考                                   |
|---|---|---|--------------------------------------|
| COLOR | scopesが設定されていること | color | 値がエイリアスなら参照文字列（`{path.to.token}`）に変換。alpha が 1 の場合はキーを省略（DTCG 既定値 1） |
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

### boundVariables の参照化

- `fontFamily`/`fontSize`/`letterSpacing`/`lineHeight` に boundVariables が設定されている場合、対応する値は計算値の代わりに `{GroupName.TokenName}` 参照として出力されます
- `fontWeight` は `fontWeight` の bound を優先し、無ければ `fontStyle` の bound にフォールバックします（両方 bound の場合は `fontWeight` が優先）
- bound の Variable ID が解決できない場合は計算値にフォールバックし、`kind: "alias-resolve"` の警告が `_export-warnings.json` に記録されます
- `paragraphSpacing`/`paragraphIndent` の boundVariables は対応する出力フィールドが無いため無視されます（読まれず、警告も出ません）
- lineHeight/letterSpacing が bound の場合は変換計算そのものをスキップします（Infinity/NaN による TypeError も発生しません）。ただし letterSpacing(PERCENT)/lineHeight(PIXELS実寸) の計算には常に生の `fontSize` を使うため、fontSize が bound で参照出力されていても計算結果には影響しません

## Paint Styles (Color/Gradient) 変換ルール

Paint Styles は `color` または `gradient` トークンに変換されます。

### SOLID Paint → Color Token

- SOLID タイプのペイントを `color` トークンに変換
- boundVariables に color エイリアスがある場合：
  - `paint.opacity`（未指定時は 1）が 1 のときのみエイリアス参照を使用（`{GroupName.tokenName}`）
  - `paint.opacity` が 1 以外の場合はエイリアス参照を破棄し、RGB 値に `paint.opacity` を `alpha` として焼き込んで出力する。このとき `kind: "paint-opacity"` の警告が `_export-warnings.json` に記録される（Figma 側で opacity を 1 に戻すと参照が保持される）
- boundVariables がない場合は RGB 値に `paint.opacity`（未指定時は 1）を `alpha` として付与して出力（alpha が 1 の場合はキー省略）

### GRADIENT_LINEAR Paint → Gradient Token

- GRADIENT_LINEAR タイプのペイントを `gradient` トークンに変換
- 各 gradientStop の色を以下のルールで処理：
  - boundVariables に color エイリアスがある場合：
    - `paint.opacity`（未指定時は 1）が 1 の場合のみエイリアス参照を使用
    - `paint.opacity` が 1 以外の場合は各停止点の透明度にペイント全体の透明度を掛け合わせてRGB(A)値として焼き込む
  - RGB(A) 値の場合は同様に透明度を適用（掛け合わせた結果が 1 の場合は alpha キー省略）
  - opacity が 1 以外で焼き込みが発生し、かつ color エイリアスを持つ stop が1つ以上ある場合、`kind: "paint-opacity"` の警告が `_export-warnings.json` に記録される（1 paint につき最大1件）

### 命名規則

- 単数：PaintStyle の name をそのまま使用
- 複数：`{name}-color-{index}` または `{name}-gradient-{index}` で命名（0始まり）
- name に `/` が含まれる場合、`/` 区切りの部分はネストしたGroupに変換されます（例: `brand/red` の複数塗りは `{ brand: { "red-color-0": ..., "red-color-1": ... } }` のように、suffixは葉のキー名に残ります）

### 非対応タイプ

- IMAGE/VIDEO タイプは出力対象外

## Effect Styles (Shadow) 変換ルール

Effect Styles は `shadow` トークンに変換されます。

- **対象**: `visible: true` かつ、タイプが `DROP_SHADOW` または `INNER_SHADOW` のエフェクトのみ抽出
- **構造**: 1つのStyleに複数のエフェクトがある場合、配列として出力されます（Figmaのスタック順序＝配列順序を維持）

| プロパティ | 変換ルール |
|---|---|
| color | RGBA値を変換（a が 1 の場合は alpha キー省略） |
| offsetX | `offset.x` を `{ value: number, unit: "px" }` 形式で出力 |
| offsetY | `offset.y` を `{ value: number, unit: "px" }` 形式で出力 |
| blur | `radius` を `{ value: number, unit: "px" }` 形式で出力 |
| spread | `spread` を `{ value: number, unit: "px" }` 形式で出力 |
| inset | `INNER_SHADOW` の場合 `true`、それ以外は省略 |

### boundVariables の参照化

- 各エフェクトの boundVariables（`color`/`offsetX`/`offsetY`/`radius`/`spread`）は `{GroupName.TokenName}` 参照として出力されます。Figma 側のフィールド名 `radius` はトークン側の `blur` に対応します
- 判定はエフェクト単位で独立して行われます（1 Style 内に複数エフェクトがある場合、一部だけ bound でも問題ありません）
- `color` が bound の場合、alpha は参照先の Variable に従うため `effect.color.a` は出力に反映されません
- bound の Variable ID が解決できない場合は値にフォールバックし、`kind: "alias-resolve"` の警告が `_export-warnings.json` に記録されます

## エイリアス（Alias）
- FigmaのエイリアスはID参照ですが、出力時は `{GroupName.TokenName}` 形式に解決します
- GroupNameは makeGroupName に基づく命名規則（単一: collection名、複数: collection名 + Capitalize(mode名)）で決定されます
- 複数モードを持つコレクションへの参照は、参照元と**同名のモード**（大文字小文字を区別する完全一致）の Group に解決されます
- 一致するモード名が無い場合は参照先の defaultMode の Group にフォールバックし、`kind: "alias-resolve"` の警告が `_export-warnings.json` に記録されます（参照先が単一モードの場合はフォールバックしても警告は出ません）

## 出力構造（概要）
- modeごとに1 Group（フラットなトークン集合）
- Group名は makeGroupName の規則に従います
- Group内に各Tokenが格納されます（必要に応じてネスト可）
- Variable/Style名の `/` 区切りはネストしたGroupとして再構築されます（参照パスも `{GroupName.color.brand.primary}` のように `.` 区切りのネストパスになります）
- 衝突規則: ネスト構築中にGroup（枝）とToken（葉）が同じキーで衝突した場合、Group（枝）がToken（葉）に勝ちます（葉は破棄され警告が記録されます）。葉同士が衝突した場合は後勝ちで上書きされます（`kind: "duplicate"` の警告として記録）

## ロードマップ
- [x] local variables
- [x] Text Styles
- [x] Color Styles (Paint Styles)
- [x] Effect Styles

ご意見・不具合の報告はIssueまで