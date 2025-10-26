import { FigmaColorStyle } from "../types/figma";
import {
  ColorToken,
  GradientToken,
  ColorValue,
  GradientValue,
} from "../types/token";
import { VariableNameMap } from "../resolve/createVariableNameMap";

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
    });
  });

  return tokens;
}

interface ConvertSolidToColorTokenProps {
  paint: SolidPaint;
  description: string;
  variableNameMap: VariableNameMap;
}
function convertSolidToColorToken({
  paint,
  description,
  variableNameMap,
}: ConvertSolidToColorTokenProps): ColorToken {
  const base = { $description: description };

  // boundVariables から color のエイリアスを取得
  const alias = extractColorAlias(paint.boundVariables);
  if (alias) {
    const variableName = variableNameMap.get(alias.id);
    if (variableName) {
      return {
        ...base,
        $type: "color",
        $value: `{${variableName.defaultName}}`,
      };
    } else {
      console.warn(
        `[paintStyle] Variable ID not found: ${alias.id}, using color value as fallback`,
      );
    }
  }

  // 通常のカラー値（エイリアス未解決の場合もここに含まれる）
  const { r, g, b } = paint.color;
  const alpha = paint.opacity ?? 1;

  const colorValue: ColorValue = {
    colorSpace: "srgb",
    components: [r, g, b],
    alpha,
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
}
function convertGradientToGradientToken({
  paint,
  description,
  variableNameMap,
}: ConvertGradientToGradientTokenProps): GradientToken {
  const base = { $description: description };

  const gradientStops: GradientValue = paint.gradientStops.map((stop) => {
    const alias = extractColorAlias(stop.boundVariables);
    // NOTE: Figmaではグラデーション全体の透明度の上書きができるため、1の時のみエイリアスを有効とします。
    if (paint.opacity === 1 && alias) {
      const variableName = variableNameMap.get(alias.id);
      if (variableName) {
        return {
          color: `{${variableName.defaultName}}`,
          position: stop.position,
        };
      } else {
        console.warn(
          `[paintStyle] Variable ID not found: ${alias.id}, using color value as fallback`,
        );
      }
    }

    const { r, g, b, a } = stop.color;
    const colorValue: ColorValue = {
      colorSpace: "srgb",
      components: [r, g, b],
      // グラデーション全体の透明度が調整されている
      alpha: a * (paint.opacity ?? 1),
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
