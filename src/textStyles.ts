import { convertTextStyleToTypography } from "./converts/convertTextStyleToTypography";

export async function getTextStyles() {
  const textStyles = await figma.getLocalTextStylesAsync();
  console.log(`📝 Found ${textStyles.length} text styles`);

  if (textStyles.length === 0) {
    return null;
  }

  return {
    typography: textStyles.reduce((acc, textStyle) => {
      return { ...acc, ...convertTextStyleToTypography(textStyle) };
    }, {}),
  };
}
