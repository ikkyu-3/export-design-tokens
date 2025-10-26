import { convertTextStyleToTypography } from "./converts/convertTextStyleToTypography";
import { TypographyToken } from "./types/token";

export async function getTextStyles() {
  const textStyles = await figma.getLocalTextStylesAsync();
  console.log(`📝 Found ${textStyles.length} text styles`);

  const result: Record<string, TypographyToken> = {};
  const typography = textStyles.reduce((acc, textStyle) => {
    return { ...acc, ...convertTextStyleToTypography(textStyle) };
  }, result);

  if (Object.keys(typography).length === 0) {
    return null;
  }

  return {
    typography,
  };
}
