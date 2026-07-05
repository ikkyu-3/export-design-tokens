import { convertTextStyleToTypography } from "./converts/convertTextStyleToTypography";
import { TypographyToken } from "./types/token";
import { TokenTree } from "./types/group";
import { FigmaTextStyle } from "./types/figma";
import { WarningCollector } from "./warnings";
import { createNameSanitizer, nestRecordTokens } from "./sanitize";
import { VariableNameMap } from "./resolve/createVariableNameMap";

export function convertTextStylesToTypography(
  textStyles: FigmaTextStyle[],
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
): TokenTree<TypographyToken> {
  const typography: TokenTree<TypographyToken> = {};
  const sanitizer = createNameSanitizer(warnings);

  for (const textStyle of textStyles) {
    try {
      nestRecordTokens(
        typography,
        convertTextStyleToTypography(textStyle, variableNameMap, warnings),
        sanitizer,
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

export async function getTextStyles(
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
) {
  const textStyles = await figma.getLocalTextStylesAsync();
  console.log(`📝 Found ${textStyles.length} text styles`);

  const typography = convertTextStylesToTypography(
    textStyles,
    variableNameMap,
    warnings,
  );

  if (Object.keys(typography).length === 0) {
    return null;
  }

  return {
    typography,
  };
}
