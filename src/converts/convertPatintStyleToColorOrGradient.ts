import { FigmaColorStyle } from "../types/figma";
import {
  ColorToken,
  GradientToken,
  ColorValue,
  GradientValue,
} from "../types/token";
import { VariableNameMap } from "../resolve/createVariableNameMap";
import { WarningCollector } from "../warnings";

export type PaintStyleToken = ColorToken | GradientToken;
type PluginBoundVariables = {
  [field in VariableBindablePaintField]?: VariableAlias;
};

/**
 * boundVariables から color の VariableAlias を取得
 */
function extractColorAlias(
  boundVariables?: PluginBoundVariables,
): VariableAlias | null {
  if (!boundVariables?.color) return null;

  const alias = boundVariables.color;
  return alias.type === "VARIABLE_ALIAS" ? alias : null;
}

interface WarnPaintOpacityBakeProps {
  opacity: number;
  source: string;
  warnings?: WarningCollector;
}
/**
 * opacity !== 1 のため Variable 参照を破棄して RGBA を焼き込んだ場合の警告
 */
function warnPaintOpacityBake({
  opacity,
  source,
  warnings,
}: WarnPaintOpacityBakeProps): void {
  const message = `ペイントの opacity が ${opacity} のため、Variable 参照を破棄して RGBA 値を焼き込みました（${source}）。Figma 側で opacity を 1 にすると参照が保持されます。`;
  console.warn(message);
  warnings?.add({
    severity: "warning",
    kind: "paint-opacity",
    source,
    message,
  });
}

/**
 * PaintStyle を Color/Gradient トークンに変換する
 * - SOLID → ColorToken
 * - GRADIENT_LINEAR → GradientToken
 * - IMAGE/VIDEO は変換しない
 *
 * 命名規則:
 * - 単数: `name`
 * - 複数: `name-color-{index}` または `name-gradient-{index}` (0始まり)
 *
 * エイリアス解決:
 * - variableNameMap を渡すことで、boundVariables の Variable ID を名前参照に解決
 */
export function convertPaintStyleToTokens(
  paintStyle: FigmaColorStyle,
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
): Record<string, PaintStyleToken> {
  const tokens: Record<string, PaintStyleToken> = {};

  const solidPaints = paintStyle.paints.filter(
    (p): p is SolidPaint => p.type === "SOLID",
  );
  const gradientPaints = paintStyle.paints.filter(
    (p): p is GradientPaint => p.type === "GRADIENT_LINEAR",
  );

  solidPaints.forEach((paint, index) => {
    const tokenName =
      solidPaints.length === 1
        ? paintStyle.name
        : `${paintStyle.name}-color-${index}`;
    tokens[tokenName] = convertSolidToColorToken({
      paint,
      description: paintStyle.description,
      variableNameMap,
      source: `PaintStyle: ${paintStyle.name}`,
      warnings,
    });
  });

  gradientPaints.forEach((paint, index) => {
    const tokenName =
      gradientPaints.length === 1
        ? paintStyle.name
        : `${paintStyle.name}-gradient-${index}`;
    tokens[tokenName] = convertGradientToGradientToken({
      paint,
      description: paintStyle.description,
      variableNameMap,
      source: `PaintStyle: ${paintStyle.name}`,
      warnings,
    });
  });

  return tokens;
}

interface ConvertSolidToColorTokenProps {
  paint: SolidPaint;
  description: string;
  variableNameMap: VariableNameMap;
  source: string;
  warnings?: WarningCollector;
}
function convertSolidToColorToken({
  paint,
  description,
  variableNameMap,
  source,
  warnings,
}: ConvertSolidToColorTokenProps): ColorToken {
  const base = { $description: description };
  const paintOpacity = paint.opacity ?? 1;

  // boundVariables から color のエイリアスを取得
  const alias = extractColorAlias(paint.boundVariables);
  if (alias) {
    if (paintOpacity === 1) {
      const variableName = variableNameMap.get(alias.id);
      if (variableName) {
        return {
          ...base,
          $type: "color",
          $value: `{${variableName.defaultName}}`,
        };
      } else {
        const message = `[paintStyle] Variable ID not found: ${alias.id}, using color value as fallback`;
        console.warn(message);
        warnings?.add({
          severity: "warning",
          kind: "alias-resolve",
          source,
          message,
        });
      }
    } else {
      // opacity !== 1 の場合は参照を破棄して値焼き込みへフォールスルー
      warnPaintOpacityBake({ opacity: paintOpacity, source, warnings });
    }
  }

  // 通常のカラー値（エイリアス未解決 or opacity 焼き込みの場合もここに含まれる）
  const { r, g, b } = paint.color;

  const colorValue: ColorValue = {
    colorSpace: "srgb",
    components: [r, g, b],
    alpha: paintOpacity,
  };

  return {
    ...base,
    $type: "color",
    $value: colorValue,
  };
}

interface ConvertGradientToGradientTokenProps {
  paint: GradientPaint;
  description: string;
  variableNameMap: VariableNameMap;
  source: string;
  warnings?: WarningCollector;
}
function convertGradientToGradientToken({
  paint,
  description,
  variableNameMap,
  source,
  warnings,
}: ConvertGradientToGradientTokenProps): GradientToken {
  const base = { $description: description };
  const paintOpacity = paint.opacity ?? 1;

  // opacity !== 1 で焼き込みが発生する場合、エイリアスを持つ stop が1つでもあれば
  // 1 paint につき最大1件の警告を出す（stop ごとには出さない）
  const hasAliasStop = paint.gradientStops.some(
    (stop) => extractColorAlias(stop.boundVariables) !== null,
  );
  if (paintOpacity !== 1 && hasAliasStop) {
    warnPaintOpacityBake({ opacity: paintOpacity, source, warnings });
  }

  const gradientStops: GradientValue = paint.gradientStops.map((stop) => {
    const alias = extractColorAlias(stop.boundVariables);
    // NOTE: `paint.opacity ?? 1` が 1 のときのみ stop のエイリアスを参照として採用する。
    // それ以外は下部で RGBA を焼き込む（paint-opacity 警告は上部で 1 paint につき最大1件記録済み）。
    if (paintOpacity === 1 && alias) {
      const variableName = variableNameMap.get(alias.id);
      if (variableName) {
        return {
          color: `{${variableName.defaultName}}`,
          position: stop.position,
        };
      } else {
        const message = `[paintStyle] Variable ID not found: ${alias.id}, using color value as fallback`;
        console.warn(message);
        warnings?.add({
          severity: "warning",
          kind: "alias-resolve",
          source,
          message,
        });
      }
    }

    const { r, g, b, a } = stop.color;
    const colorValue: ColorValue = {
      colorSpace: "srgb",
      components: [r, g, b],
      // グラデーション全体の透明度が調整されている
      alpha: a * paintOpacity,
    };

    return {
      color: colorValue,
      position: stop.position,
    };
  });

  return {
    ...base,
    $type: "gradient",
    $value: gradientStops,
  };
}
