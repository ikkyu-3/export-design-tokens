import { convertEffectStyleToShadow } from "./converts/convertEffectStyleToShadow";
import { ShadowToken } from "./types/token";

export async function getEffectStyles() {
  const effectStyles = await figma.getLocalEffectStylesAsync();
  console.log(`✨ Found ${effectStyles.length} effect styles`);

  let shadowTokens: Record<string, ShadowToken> = {};

  effectStyles.forEach((effectStyle) => {
    const token = convertEffectStyleToShadow(effectStyle);
    if (token) {
      shadowTokens = { ...shadowTokens, ...token };
    }
  });

  if (Object.keys(shadowTokens).length === 0) {
    return null;
  }

  return {
    effectStyles: shadowTokens,
  };
}
