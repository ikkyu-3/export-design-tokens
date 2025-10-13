import { convertTextStyleToTypography } from "./converts/convertTextStyleToTypography";

export async function getTextStyles() {
  const textStyles = await figma.getLocalTextStylesAsync();
  console.log(`📝 Found ${textStyles.length} text styles`);

  return {
    typography: textStyles.reduce((acc, textStyle) => {
      return { ...acc, ...convertTextStyleToTypography(textStyle) };
    }, {}),
  };
}
