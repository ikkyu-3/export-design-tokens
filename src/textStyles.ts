import { convertTextStyleToTypography } from "./converts/convertTextStyleToTypography";
import { TypographyToken } from "./types/token";
import { FigmaTextStyle } from "./types/figma";
import { WarningCollector } from "./warnings";

export function convertTextStylesToTypography(
  textStyles: FigmaTextStyle[],
  warnings?: WarningCollector,
): Record<string, TypographyToken> {
  const typography: Record<string, TypographyToken> = {};

  for (const textStyle of textStyles) {
    try {
      Object.assign(typography, convertTextStyleToTypography(textStyle));
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
