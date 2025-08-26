async function main() {
  if (figma.editorType === 'figma') {
    console.log("figmaで実行中")
  }

  if (figma.editorType === 'dev') {
    console.log("devで実行中")
  }

  // TODO: try catch

  // Collectionsを全て取得
  const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
  console.log(`📦 Found ${localCollections.length} variable collections`)

  // ない場合は終了
  if (localCollections.length === 0) {
    figma.closePlugin('No variable collections found. Please create some variables first.')
    return
  }

  // collectionを取得
  for (const collection of localCollections) {
    console.log(`Processing collection: ${collection.name}`)

    // collectionのvariablesを取得する
    const variables = await Promise.all(
        collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id)) // functionにした方がよいかも
    )

    console.log(`collection.id: ${collection.id}, collection.mode: ${collection.defaultModeId}, collection.modes: ${JSON.stringify(collection.modes)}`)

    for (const variable of variables) {
      if (variable) {
        console.log(`variable.id: ${variable.id}`)
        console.log(`mode: ${JSON.stringify(variable.valuesByMode[collection.defaultModeId])}`)
        console.log(variable.valuesByMode[collection.defaultModeId])

        // const v = await figma.variables.getVariableByIdAsync(variable.id)
        // if (v) {
        //   console.log(`id: ${v.id}`)
        //   console.log(`resolvedType: ${v.resolvedType}`)
        // } else {
        //   console.log(`  - Variable not found`)
        // }
      }
    }
  }

  figma.closePlugin()
}

main()