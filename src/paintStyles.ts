import {
  convertPaintStyleToTokens,
  PaintStyleToken,
} from "./converts/convertPatintStyleToColorOrGradient";
import { VariableNameMap } from "./resolve/createVariableNameMap";

export async function getPaintStyles(variableNameMap: VariableNameMap) {
  const paintStyles = await figma.getLocalPaintStylesAsync();
  console.log(`🎨 Found ${paintStyles.length} paint styles`);

  let paintStylesData: Record<string, PaintStyleToken> = {};

  for (const style of paintStyles) {
    const tokens = convertPaintStyleToTokens(style, variableNameMap);
    paintStylesData = { ...paintStylesData, ...tokens };
  }

  if (Object.keys(paintStylesData).length === 0) {
    return null;
  }

  return {
    paintStyles: paintStylesData,
  };
}
