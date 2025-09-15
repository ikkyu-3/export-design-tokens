import { getCollections } from "./collections";
// import { getTextStyles } from "./textStyles";
// import { getPaintStyles } from "./paintStyles";
// import { getEffectStyles } from "./effectStyles";
import { convertCollectionToModeNamedGroups } from "./converts/convertCollectionToGroup";
import { resolveAliasesForAllCollections } from "./resolve";

figma.showUI(__html__, { width: 280, height: 80, visible: false });

figma.ui.onmessage = (msg) => {
  if (msg?.type === "download-complete") {
    figma.closePlugin();
  } else if (msg?.type === "error") {
    figma.closePlugin("エラーが発生しました: " + msg.error);
  }
};

async function main() {
  if (figma.editorType === "figma") {
    console.log("figmaで実行中");
  }

  if (figma.editorType === "dev") {
    console.log("devで実行中");
  }

  try {
    console.log("========== get collections ==========");
    const collections = await getCollections();
    // console.log(collections);
    // await getTextStyles();
    // await getPaintStyles();
    // await getEffectStyles();

    console.log("========== resolve aliases ==========");
    const resolvedAliasNames = resolveAliasesForAllCollections(collections);

    const groups = resolvedAliasNames.map((c) =>
      convertCollectionToModeNamedGroups(c),
    );
    console.log(groups);

    figma.ui.postMessage({
      type: "download-zip",
      data: {
        collections: groups,
      },
    });
  } catch (e) {
    console.error(e);
    figma.closePlugin(`Export処理中にエラーが発生しました.`);
  }
}

main();
