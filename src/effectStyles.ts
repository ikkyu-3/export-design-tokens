import { convertEffectStyleToShadow } from "./converts/convertEffectStyleToShadow";
import { ShadowToken } from "./types/token";
import { TokenTree } from "./types/group";
import { FigmaEffectStyle } from "./types/figma";
import { WarningCollector } from "./warnings";
import { createNameSanitizer, nestRecordTokens } from "./sanitize";
import { VariableNameMap } from "./resolve/createVariableNameMap";

export function convertEffectStylesToShadows(
  effectStyles: FigmaEffectStyle[],
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
): TokenTree<ShadowToken> {
  const shadowTokens: TokenTree<ShadowToken> = {};
  const sanitizer = createNameSanitizer(warnings);

  for (const effectStyle of effectStyles) {
    try {
      const token = convertEffectStyleToShadow(
        effectStyle,
        variableNameMap,
        warnings,
      );
      if (token) {
        nestRecordTokens(
          shadowTokens,
          token,
          sanitizer,
          `EffectStyle: ${effectStyle.name}`,
          warnings,
        );
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

export async function getEffectStyles(
  variableNameMap: VariableNameMap,
  warnings?: WarningCollector,
) {
  const effectStyles = await figma.getLocalEffectStylesAsync();
  console.log(`✨ Found ${effectStyles.length} effect styles`);

  const shadowTokens = convertEffectStylesToShadows(
    effectStyles,
    variableNameMap,
    warnings,
  );

  if (Object.keys(shadowTokens).length === 0) {
    return null;
  }

  return {
    effectStyles: shadowTokens,
  };
}
