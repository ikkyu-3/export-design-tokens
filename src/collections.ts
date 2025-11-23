export interface FigmaValueTypeMap {
  STRING: string;
  FLOAT: number;
  BOOLEAN: boolean;
  COLOR: RGB | RGBA;
}

export type FigmaVariableValue<T extends VariableResolvedDataType> =
  | FigmaValueTypeMap[T]
  | VariableAlias;

export interface TypedFigmaVariable<
  T extends VariableResolvedDataType = VariableResolvedDataType,
> {
  id: string;
  name: string;
  resolvedType: T;
  valuesByMode: Record<string, FigmaVariableValue<T>>;
  description?: string;
  scopes?: VariableScope[];
}

export interface FigmaCollectionData {
  id: string;
  name: string;
  defaultModeId: string;
  modes: Array<{ modeId: string; name: string }>;
  variables: TypedFigmaVariable[];
}

export async function getCollections(): Promise<FigmaCollectionData[]> {
  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();
  console.log(`📦 Found ${localCollections.length} variable collections`);

  if (localCollections.length === 0) {
    console.warn("No local variable collections found");
    return [];
  }

  const results: FigmaCollectionData[] = [];

  for (const collection of localCollections) {
    console.log(`    Processing collection: ${collection.name}`);

    const variables = await Promise.all(
      collection.variableIds.map((id) =>
        figma.variables.getVariableByIdAsync(id),
      ),
    );

    const figmaData: FigmaCollectionData = {
      id: collection.id,
      name: collection.name,
      defaultModeId: collection.defaultModeId,
      modes: collection.modes,
      variables: [],
    };

    for (const variable of variables) {
      if (variable) {
        figmaData.variables.push({
          id: variable.id,
          name: variable.name,
          resolvedType: variable.resolvedType,
          valuesByMode: variable.valuesByMode,
          description: variable.description,
          scopes: variable.scopes,
        });
      }
    }

    results.push(figmaData);
  }

  return results;
}
