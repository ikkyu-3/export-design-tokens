import { convertEffectStyleToShadow } from "./converts/convertEffectStyleToShadow";
import { ShadowToken } from "./types/token";

export async function getEffectStyles() {
  const effectStyles = await figma.getLocalEffectStylesAsync();
  console.log(`✨ Found ${effectStyles.length} effect styles`);

  let shadowTokens: Record<string, ShadowToken> = {};

  for (const effectStyle of effectStyles) {
    const token = convertEffectStyleToShadow(effectStyle);
    if (token) {
      Object.assign(shadowTokens, token);
    }
  }

  if (Object.keys(shadowTokens).length === 0) {
    return null;
  }

  return {
    effectStyles: shadowTokens,
  };
}
