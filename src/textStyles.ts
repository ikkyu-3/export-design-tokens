import { convertTextStyleToTypography } from "./converts/convertTextStyleToTypography";
import { TypographyToken } from "./types/token";
import { FigmaTextStyle } from "./types/figma";
import { WarningCollector } from "./warnings";
import { assignTokensWithDuplicateWarning } from "./duplicates";
import { createNameSanitizer, sanitizeRecordKeys } from "./sanitize";

export function convertTextStylesToTypography(
  textStyles: FigmaTextStyle[],
  warnings?: WarningCollector,
): Record<string, TypographyToken> {
  const typography: Record<string, TypographyToken> = {};
  const sanitizer = createNameSanitizer(warnings);

  for (const textStyle of textStyles) {
    try {
      assignTokensWithDuplicateWarning(
        typography,
        sanitizeRecordKeys(
          convertTextStyleToTypography(textStyle),
          sanitizer,
          `TextStyle: ${textStyle.name}`,
        ),
        `TextStyle: ${textStyle.name}`,
        warnings,
      );
    } catch (e) {
      console.error(e);
      warnings?.add({
        severity: "error",
        kind: "style-convert",
        source: `TextStyle: ${textStyle.name}`,
        message: String(e),
      });
    }
  }

  return typography;
}

export async function getTextStyles(warnings?: WarningCollector) {
  const textStyles = await figma.getLocalTextStylesAsync();
  console.log(`📝 Found ${textStyles.length} text styles`);

  const typography = convertTextStylesToTypography(textStyles, warnings);

  if (Object.keys(typography).length === 0) {
    return null;
  }

  return {
    typography,
  };
}
