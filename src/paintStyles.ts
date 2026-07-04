import {
  convertPaintStyleToTokens,
  PaintStyleToken,
} from "./converts/convertPatintStyleToColorOrGradient";
import { VariableNameMap } from "./resolve/createVariableNameMap";
import { FigmaColorStyle } from "./types/figma";
import { TokenTree } from "./types/group";
import { WarningCollector } from "./warnings";
import { createNameSanitizer, nestRecordTokens } from "./sanitize";

export function convertPaintStylesToTokens(
  paintStyles: FigmaColorStyle[],
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
): TokenTree<PaintStyleToken> {
  const paintStylesData: TokenTree<PaintStyleToken> = {};
  const sanitizer = createNameSanitizer(warnings);

  for (const style of paintStyles) {
    try {
      const tokens = convertPaintStyleToTokens(
        style,
        variableNameMap,
        warnings,
      );
      nestRecordTokens(
        paintStylesData,
        tokens,
        sanitizer,
        `PaintStyle: ${style.name}`,
        warnings,
      );
    } catch (e) {
      console.error(e);
      warnings?.add({
        severity: "error",
        kind: "style-convert",
        source: `PaintStyle: ${style.name}`,
        message: String(e),
      });
    }
  }

  return paintStylesData;
}

export async function getPaintStyles(
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
) {
  const paintStyles = await figma.getLocalPaintStylesAsync();
  console.log(`🎨 Found ${paintStyles.length} paint styles`);

  const paintStylesData = convertPaintStylesToTokens(
    paintStyles,
    variableNameMap,
    warnings,
  );

  if (Object.keys(paintStylesData).length === 0) {
    return null;
  }

  return {
    paintStyles: paintStylesData,
  };
}
