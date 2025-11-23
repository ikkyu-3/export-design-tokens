import { getCollections } from "./collections";
import { getTextStyles } from "./textStyles";
import { getEffectStyles } from "./effectStyles";
import { convertCollectionToModeNamedGroups } from "./converts/convertCollectionToGroup";
import { resolveAliasesForAllCollections } from "./resolve";
import { getPaintStyles } from "./paintStyles";
import { createVariableNameMap } from "./resolve/createVariableNameMap";

figma.showUI(__html__, { width: 280, height: 80, visible: false });

figma.ui.onmessage = (msg) => {
  if (msg?.type === "download-complete") {
    figma.closePlugin();
  } else if (msg?.type === "error") {
    figma.closePlugin("エラーが発生しました: " + msg.error);
  }
};

async function main() {
  try {
    console.log("========== get collections ==========");
    const collections = await getCollections();

    console.log("========== create variable name map ==========");
    const variableNameMap = createVariableNameMap(collections);

    console.log("========== resolve aliases ==========");
    const resolvedAliasNames = resolveAliasesForAllCollections(
      collections,
      variableNameMap,
    );
    const groups = resolvedAliasNames.map((c) =>
      convertCollectionToModeNamedGroups(c),
    );

    console.log("========== get textStyles ==========");
    const typography = await getTextStyles();

    console.log("========== get paintStyles ==========");
    const paintStyles = await getPaintStyles(variableNameMap);

    console.log("========== get effectStyles ==========");
    const effectStyles = await getEffectStyles();

    figma.ui.postMessage({
      type: "download-zip",
      data: {
        collections: [...groups, typography, paintStyles, effectStyles].filter(
          Boolean,
        ),
      },
    });
  } catch (e) {
    console.error(e);
    figma.closePlugin(`Export処理中にエラーが発生しました.`);
  }
}

main();
