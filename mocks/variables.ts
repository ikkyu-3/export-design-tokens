import { FigmaCollectionData, TypedFigmaVariable } from "../src/collections";

/**
 * ColorVariable
 */
export const mockColorVariable: TypedFigmaVariable<"COLOR"> = {
  id: "VariableID:88:2",
  name: "color1",
  resolvedType: "COLOR",
  valuesByMode: {
    "2:2": {
      r: 0.740403413772583,
      g: 0.740403413772583,
      b: 0.740403413772583,
      a: 1,
    },
  },
  description: "",
  scopes: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
};

export const mockColorAliasVariable: TypedFigmaVariable<"COLOR"> = {
  id: "VariableID:88:5",
  name: "color1Alias",
  resolvedType: "COLOR",
  valuesByMode: {
    "2:2": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:88:2",
    },
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockColor2Variable: TypedFigmaVariable<"COLOR"> = {
  id: "VariableID:88:3",
  name: "color2",
  resolvedType: "COLOR",
  valuesByMode: {
    "2:2": {
      r: 0.6533015370368958,
      g: 0.007312344387173653,
      b: 0.007312344387173653,
      a: 1,
    },
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockColor2AliasVariable: TypedFigmaVariable<"COLOR"> = {
  id: "VariableID:88:6",
  name: "color2Alias",
  resolvedType: "COLOR",
  valuesByMode: {
    "2:2": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:88:3",
    },
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockColor3Variable: TypedFigmaVariable<"COLOR"> = {
  id: "VariableID:88:4",
  name: "color3",
  resolvedType: "COLOR",
  valuesByMode: {
    "2:2": {
      r: 0,
      g: 0,
      b: 0.6382962465286255,
      a: 1,
    },
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockColor3AliasVariable: TypedFigmaVariable<"COLOR"> = {
  id: "VariableID:88:7",
  name: "color3Alias",
  resolvedType: "COLOR",
  valuesByMode: {
    "2:2": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:88:4",
    },
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockColorCollectionData: FigmaCollectionData = {
  id: "VariableCollectionId:2:12",
  name: "colorCollections",
  defaultModeId: "2:2",
  modes: [
    {
      name: "Mode 1",
      modeId: "2:2",
    },
  ],
  variables: [
    mockColorVariable,
    mockColorAliasVariable,
    mockColor2Variable,
    mockColor2AliasVariable,
    mockColor3Variable,
    mockColor3AliasVariable,
  ],
};

/**
 * StringVariable
 */
export const mockFontFamilyVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:25:9",
  name: "fontFamily",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": "Inter",
  },
  description: "",
  scopes: ["FONT_FAMILY"],
};

export const mockFontFamilyAliasVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:7",
  name: "fontFamilyAlias",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:25:9",
    },
  },
  description: "",
  scopes: ["FONT_FAMILY"],
};

export const mockFontWeightVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:5",
  name: "fontWeight",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": "regular",
  },
  description: "",
  scopes: ["FONT_FAMILY"],
};

export const mockFontWeightAliasVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:7",
  name: "fontFamilyAlias",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:25:9",
    },
  },
  description: "",
  scopes: ["FONT_FAMILY"],
};

export const mockFontStyleVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:6",
  name: "fontStyle",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": "normal",
  },
  description: "",
  scopes: ["FONT_STYLE"],
};

export const mockFontStyleAliasVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:10",
  name: "fontStyleAlias",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:85:6",
    },
  },
  description: "",
  scopes: ["FONT_STYLE"],
};

export const mockTextVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:9",
  name: "text",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": "文字列値",
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockTextAliasVariable: TypedFigmaVariable<"STRING"> = {
  id: "VariableID:85:11",
  name: "textAlias",
  resolvedType: "STRING",
  valuesByMode: {
    "2:0": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:85:9",
    },
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockTextCollectionData: FigmaCollectionData = {
  id: "VariableCollectionId:2:2",
  name: "textCollection",
  defaultModeId: "2:0",
  modes: [
    {
      name: "light",
      modeId: "2:0",
    },
  ],
  variables: [
    mockFontFamilyVariable,
    mockFontFamilyAliasVariable,
    mockFontWeightVariable,
    mockFontWeightAliasVariable,
    mockFontStyleVariable,
    mockFontStyleAliasVariable,
    mockTextVariable,
    mockTextAliasVariable,
  ],
};

/**
 * FloatVariable
 */
export const mockFloatVariableWidthHeightVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:2:6",
    name: "width",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": 120,
    },
    description: "",
    scopes: ["WIDTH_HEIGHT"],
  };

export const mockFloatVariableWidthHeightAliasVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:13",
    name: "widthAlias",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": {
        type: "VARIABLE_ALIAS",
        id: "VariableID:2:6",
      },
    },
    description: "",
    scopes: ["WIDTH_HEIGHT"],
  };

export const mockFloatVariableGapVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:5",
  name: "gap",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 8,
  },
  description: "",
  scopes: ["GAP"],
};

export const mockFloatVariableGapAliasVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:14",
  name: "gapAlias",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:86:5",
    },
  },
  description: "",
  scopes: ["GAP"],
};

export const mockFloatVariableStrokeFloatVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:6",
    name: "borderWidth",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": 1,
    },
    description: "",
    scopes: ["STROKE_FLOAT"],
  };

export const mockFloatVariableStrokeFloatAliasVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:15",
    name: "borderWidthAlias",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": {
        type: "VARIABLE_ALIAS",
        id: "VariableID:86:6",
      },
    },
    description: "",
    scopes: ["STROKE_FLOAT"],
  };

export const mockFloatVariableOpacityVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:7",
  name: "opacity",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 0.5,
  },
  description: "",
  scopes: ["OPACITY"],
};

export const mockFloatVariableOpacityAliasVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:16",
    name: "opacityAlias",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": {
        type: "VARIABLE_ALIAS",
        id: "VariableID:86:7",
      },
    },
    description: "",
    scopes: ["OPACITY"],
  };

export const mockFloatCornerRadiusVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:2",
  name: "borderRadius",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 4,
  },
  description: "",
  scopes: ["CORNER_RADIUS"],
};

export const mockFloatCornerRadiusAliasVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:17",
  name: "borderRadiusAlias",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:86:2",
    },
  },
  description: "",
  scopes: ["CORNER_RADIUS"],
};

export const mockFloatFontSizeVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:3",
  name: "fontSize",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 16,
  },
  description: "",
  scopes: ["FONT_SIZE"],
};

export const mockFloatFontSizeAliasVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:18",
  name: "fontSizeAlias",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:86:3",
    },
  },
  description: "",
  scopes: ["FONT_SIZE"],
};

export const mockFloatFontWeightVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:4",
  name: "fontWeight",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 400,
  },
  description: "",
  scopes: ["FONT_WEIGHT"],
};

export const mockFloatFontWeightAliasVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:19",
  name: "fontWeightAlias",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:86:4",
    },
  },
  description: "",
  scopes: ["FONT_WEIGHT"],
};

export const mockFloatLineHeightVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:8",
  name: "lineHeight",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 16,
  },
  description: "",
  scopes: ["LINE_HEIGHT"],
};

export const mockFloatLineHeightAliasVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:20",
  name: "lineHeightAlias",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:86:8",
    },
  },
  description: "",
  scopes: ["LINE_HEIGHT"],
};

export const mockFloatLetterSpacingVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:9",
  name: "letterSpacing",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 0,
  },
  description: "",
  scopes: ["LETTER_SPACING"],
};

export const mockFloatLetterSpacingAliasVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:21",
    name: "letterSpacingAlias",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": {
        type: "VARIABLE_ALIAS",
        id: "VariableID:86:9",
      },
    },
    description: "",
    scopes: ["LETTER_SPACING"],
  };

export const mockFloatParagraphIndentVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:10",
  name: "indent",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 16,
  },
  description: "",
  scopes: ["PARAGRAPH_INDENT"],
};

export const mockFloatParagraphIndentAliasVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:22",
    name: "indentAlias",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": {
        type: "VARIABLE_ALIAS",
        id: "VariableID:86:10",
      },
    },
    description: "",
    scopes: ["PARAGRAPH_INDENT"],
  };

export const mockFloatParagraphSpacingVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:11",
  name: "paragraphSpacing",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 0,
  },
  description: "",
  scopes: ["PARAGRAPH_SPACING"],
};

export const mockFloatParagraphSpacingAliasVariable: TypedFigmaVariable<"FLOAT"> =
  {
    id: "VariableID:86:23",
    name: "paragraphSpacingAlias",
    resolvedType: "FLOAT",
    valuesByMode: {
      "2:1": {
        type: "VARIABLE_ALIAS",
        id: "VariableID:86:11",
      },
    },
    description: "",
    scopes: ["PARAGRAPH_SPACING"],
  };

export const mockFloatAllScopesVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:12",
  name: "数値",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 12,
  },
  description: "",
  scopes: ["ALL_SCOPES"],
};

export const mockFloatEffectFloatVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:24",
  name: "effect",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": 5,
  },
  description: "",
  scopes: ["EFFECT_FLOAT"],
};

export const mockFloatEffectFloatAliasVariable: TypedFigmaVariable<"FLOAT"> = {
  id: "VariableID:86:25",
  name: "effectAlias",
  resolvedType: "FLOAT",
  valuesByMode: {
    "2:1": {
      type: "VARIABLE_ALIAS",
      id: "VariableID:86:24",
    },
  },
  description: "",
  scopes: ["EFFECT_FLOAT"],
};

export const mockFlatModeCollectionData: FigmaCollectionData = {
  id: "VariableCollectionId:2:5",
  name: "numberCollections",
  defaultModeId: "2:1",
  modes: [
    {
      name: "Mode 1",
      modeId: "2:1",
    },
  ],
  variables: [
    mockFloatVariableWidthHeightVariable,
    mockFloatVariableWidthHeightAliasVariable,
    mockFloatVariableGapVariable,
    mockFloatVariableGapAliasVariable,
    mockFloatVariableStrokeFloatVariable,
    mockFloatVariableStrokeFloatAliasVariable,
    mockFloatVariableOpacityVariable,
    mockFloatVariableOpacityAliasVariable,
    mockFloatCornerRadiusVariable,
    mockFloatCornerRadiusAliasVariable,
    mockFloatFontSizeVariable,
    mockFloatFontSizeAliasVariable,
    mockFloatFontWeightVariable,
    mockFloatFontWeightAliasVariable,
    mockFloatLineHeightVariable,
    mockFloatLineHeightAliasVariable,
    mockFloatLetterSpacingVariable,
    mockFloatLetterSpacingAliasVariable,
    mockFloatParagraphIndentVariable,
    mockFloatParagraphIndentAliasVariable,
    mockFloatParagraphSpacingVariable,
    mockFloatParagraphSpacingAliasVariable,
    mockFloatAllScopesVariable,
    mockFloatEffectFloatVariable,
    mockFloatEffectFloatAliasVariable,
  ],
};

export const mockMultiModeCollectionData: FigmaCollectionData = {
  id: "VariableCollectionId:25:2",
  name: "multiModeCollections",
  defaultModeId: "25:0",
  modes: [
    {
      name: "light",
      modeId: "25:0",
    },
    {
      name: "dark",
      modeId: "25:1",
    },
  ],
  variables: [
    {
      id: "VariableID:131:2",
      name: "background",
      resolvedType: "COLOR",
      valuesByMode: {
        "25:0": {
          r: 1,
          g: 1,
          b: 1,
          a: 1,
        },
        "25:1": {
          r: 0.16588416695594788,
          g: 0.16467542946338654,
          b: 0.16467542946338654,
          a: 1,
        },
      },
      description: "",
      scopes: ["ALL_SCOPES"],
    },
    {
      id: "VariableID:131:3",
      name: "text",
      resolvedType: "COLOR",
      valuesByMode: {
        "25:0": {
          r: 0.23296649754047394,
          g: 0.23296649754047394,
          b: 0.23296649754047394,
          a: 1,
        },
        "25:1": {
          r: 1,
          g: 1,
          b: 1,
          a: 1,
        },
      },
      description: "",
      scopes: ["ALL_SCOPES"],
    },
  ],
};
