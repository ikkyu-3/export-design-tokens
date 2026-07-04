import { convertEffectStyleToShadow } from "./converts/convertEffectStyleToShadow";
import { ShadowToken } from "./types/token";
import { FigmaEffectStyle } from "./types/figma";
import { WarningCollector } from "./warnings";

export function convertEffectStylesToShadows(
  effectStyles: FigmaEffectStyle[],
  warnings?: WarningCollector,
): Record<string, ShadowToken> {
  const shadowTokens: Record<string, ShadowToken> = {};

  for (const effectStyle of effectStyles) {
    try {
      const token = convertEffectStyleToShadow(effectStyle);
      if (token) {
        Object.assign(shadowTokens, token);
      }
    } catch (e) {
      console.error(e);
      warnings?.add({
        severity: "error",
        kind: "style-convert",
        source: `EffectStyle: ${effectStyle.name}`,
        message: String(e),
      });
    }
  }

  return shadowTokens;
}

export async function getEffectStyles(warnings?: WarningCollector) {
  const effectStyles = await figma.getLocalEffectStylesAsync();
  console.log(`✨ Found ${effectStyles.length} effect styles`);

  const shadowTokens = convertEffectStylesToShadows(effectStyles, warnings);

  if (Object.keys(shadowTokens).length === 0) {
    return null;
  }

  return {
    effectStyles: shadowTokens,
  };
}
