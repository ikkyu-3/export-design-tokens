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

/** VARIABLE_ID 取得チャンクサイズ。大規模ファイルでも1回の Promise.all が肥大化しすぎないようにする */
const VARIABLE_FETCH_CHUNK_SIZE = 50;

/** items を size 件ずつの配列に分割する。size <= 0 のときは全件を1チャンクとして返す */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (items.length === 0) {
    return [];
  }

  if (size <= 0) {
    return [items.slice()];
  }

  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export async function getCollections(
  onProgress?: (done: number, total: number) => void,
): Promise<FigmaCollectionData[]> {
  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();
  console.log(`📦 Found ${localCollections.length} variable collections`);

  if (localCollections.length === 0) {
    console.warn("No local variable collections found");
    return [];
  }

  const total = localCollections.reduce(
    (sum, collection) => sum + collection.variableIds.length,
    0,
  );
  let done = 0;

  const results: FigmaCollectionData[] = [];

  for (const collection of localCollections) {
    console.log(`    Processing collection: ${collection.name}`);

    const figmaData: FigmaCollectionData = {
      id: collection.id,
      name: collection.name,
      defaultModeId: collection.defaultModeId,
      modes: collection.modes,
      variables: [],
    };

    for (const idChunk of chunk(
      collection.variableIds,
      VARIABLE_FETCH_CHUNK_SIZE,
    )) {
      const variables = await Promise.all(
        idChunk.map((id) => figma.variables.getVariableByIdAsync(id)),
      );

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

      done += idChunk.length;
      onProgress?.(done, total);
    }

    results.push(figmaData);
  }

  return results;
}
