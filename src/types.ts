type AllTokenTypes =
    | 'color'
    | 'dimension'
    | 'fontFamily'
    | 'fontWeight'
    | 'duration'
    | 'cubicBezier'
    | 'number'
    | 'strokeStyle'
    | 'border'
    | 'transition'
    | 'shadow'
    | 'gradient'
    | 'typography';

// ============================================================================
// 基本型定義
// ============================================================================

// ✅ 有効な参照
// const validReferences: TokenReference[] = [
//     "{colors.primary}",                    // 基本的な参照
//     "{typography.heading.fontSize}",       // ネストしたグループ
//     "{spacing.large}",                     // シンプルな参照
//     "{shadows.elevation.high}",            // 複数レベルのネスト
//     "{brand.colors.accent-color}",         // ハイフン含む
//     "{tokens.with_underscore}",            // アンダースコア含む
// ];
// ❌ 以下はコンパイルエラー
// const invalidReferences: TokenReference[] = [
//   "colors.primary",           // 波括弧なし
//   "[colors.primary]",         // 角括弧
//   "(colors.primary)",         // 丸括弧
//   "{colors.primary",          // 閉じ括弧なし
//   "colors.primary}",          // 開き括弧なし
//   "",                         // 空文字
//   "plain string",             // 普通の文字列
// ];
type TokenReference = `{${string}}`;

type TokenValue<T> = T | TokenReference;

interface Extensions {
    [vendorKey: string]: unknown;
}

// ============================================================================
// 共通プロパティ
// ============================================================================
interface GroupProperties {
    $type?: AllTokenTypes;
    $description?: string;
    $extensions?: Extensions;
    $deprecated?: boolean | string;
}

// interface TokenProperties {}

// ============================================================================
// 基本値型
// ============================================================================
/**
 * 色値 (color)
 * 色空間とコンポーネントで定義
 */
interface ColorValue {
    colorSpace: 'srgb';
    components: [number, number, number];
    alpha?: number;
    hex?: string;
}

/**
 * 寸法値 (dimension)
 * 距離、幅、高さ、半径、厚さなどを表現
 */
interface DimensionValue {
    value: number;
    unit: 'px' | 'rem';
}

/**
 * フォントファミリー値 (fontFamily)
 * 単一のフォント名または優先順位付きの配列
 */
type FontFamilyValue = string | string[];

/**
 * フォントウェイト値 (fontWeight)
 * 数値[1-1000]または定義済み文字列
 */
type FontWeightValue = number |
    'thin' | 'hairline' |
    'extra-light' | 'ultra-light' |
    'light' |
    'normal' | 'regular' | 'book' |
    'medium' |
    'semi-bold' | 'demi-bold' |
    'bold' |
    'extra-bold' | 'ultra-bold' |
    'black' | 'heavy' |
    'extra-black' | 'ultra-black';

/**
 * 継続時間値 (duration)
 * アニメーション時間を表現
 */
interface DurationValue {
    value: number;
    unit: 'ms' | 's';
}

/**
 * キュービックベジェ値 (cubicBezier)
 * アニメーションのイージング関数
 */
type CubicBezierValue = [number, number, number, number];

/**
 * 数値 (number)
 * 単純な数値
 */
type NumberValue = number;

// ============================================================================
// コンポジット型
// ============================================================================
/**
 * ストロークスタイル値 (strokeStyle)
 * 線や境界線のスタイル
 */
type StrokeStyleValue =
    | 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'outset' | 'inset'
    | {
    dashArray: TokenValue<DimensionValue>[];
    lineCap: 'round' | 'butt' | 'square';
};

/**
 * ボーダー値 (border)
 */
interface BorderValue {
    color: TokenValue<ColorValue>;
    width: TokenValue<DimensionValue>;
    style: TokenValue<StrokeStyleValue>;
}

/**
 * トランジション値 (transition)
 */
interface TransitionValue {
    duration: TokenValue<DurationValue>;
    delay: TokenValue<DurationValue>;
    timingFunction: TokenValue<CubicBezierValue>;
}

/**
 * シャドウ値 (shadow)
 */
interface ShadowObjectValue {
    color: TokenValue<ColorValue>;
    offsetX: TokenValue<DimensionValue>;
    offsetY: TokenValue<DimensionValue>;
    blur: TokenValue<DimensionValue>;
    spread: TokenValue<DimensionValue>;
    inset?: boolean;
}

type ShadowValue = ShadowObjectValue | ShadowObjectValue[]

/**
 * グラデーション停止点
 */
interface GradientStop {
    color: TokenValue<ColorValue>;
    position: TokenValue<NumberValue>;
}

/**
 * グラデーション値 (gradient)
 */
type GradientValue = GradientStop[];

/**
 * タイポグラフィ値 (typography)
 */
interface TypographyValue {
    fontFamily: TokenValue<FontFamilyValue>;
    fontSize: TokenValue<DimensionValue>;
    fontWeight: TokenValue<FontWeightValue>;
    letterSpacing: TokenValue<DimensionValue>;
    lineHeight: TokenValue<NumberValue>;
}