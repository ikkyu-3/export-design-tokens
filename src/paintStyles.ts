import {
  convertPaintStyleToTokens,
  PaintStyleToken,
} from "./converts/convertPatintStyleToColorOrGradient";
import { VariableNameMap } from "./resolve/createVariableNameMap";
import { FigmaColorStyle } from "./types/figma";
import { WarningCollector } from "./warnings";
import { assignTokensWithDuplicateWarning } from "./duplicates";
import { createNameSanitizer, sanitizeRecordKeys } from "./sanitize";

export function convertPaintStylesToTokens(
  paintStyles: FigmaColorStyle[],
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
): Record<string, PaintStyleToken> {
  const paintStylesData: Record<string, PaintStyleToken> = {};
  const sanitizer = createNameSanitizer(warnings);

  for (const style of paintStyles) {
    try {
      const tokens = convertPaintStyleToTokens(
        style,
        variableNameMap,
        warnings,
      );
      assignTokensWithDuplicateWarning(
        paintStylesData,
        sanitizeRecordKeys(
          tokens,
          sanitizer,
          `PaintStyle: ${style.name}`,
          warnings,
        ),
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
