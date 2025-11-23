import { FigmaEffectStyle } from "../src/types/figma";

export const effectStyles: FigmaEffectStyle[] = [
  {
    id: "S:a3726d36dd0830c5b0665964c29923385d31e56e,",
    name: "Drop Shadow",
    description: "",
    type: "EFFECT",
    effects: [
      {
        type: "DROP_SHADOW",
        visible: true,
        radius: 4,
        boundVariables: {},
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.25,
        },
        offset: {
          x: 0,
          y: 4,
        },
        spread: 0,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      },
    ],
  },
  {
    id: "S:51850d856c47ccbea1538fc1b45606645c339436,",
    name: "double drop shadow",
    description: "",
    type: "EFFECT",
    effects: [
      {
        type: "DROP_SHADOW",
        visible: true,
        radius: 4,
        boundVariables: {},
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.25,
        },
        offset: {
          x: 0,
          y: 4,
        },
        spread: 0,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      },
      {
        type: "DROP_SHADOW",
        visible: true,
        radius: 4,
        boundVariables: {},
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.25,
        },
        offset: {
          x: 0,
          y: 4,
        },
        spread: 0,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      },
    ],
  },
  {
    id: "S:5f5a7f0baeeb5080281d3cd8b397c4d8a42c8bd8,",
    name: "inner shadow",
    description: "",
    type: "EFFECT",
    effects: [
      {
        type: "INNER_SHADOW",
        visible: true,
        radius: 4,
        boundVariables: {},
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.25,
        },
        offset: {
          x: 0,
          y: 4,
        },
        spread: 0,
        blendMode: "NORMAL",
      },
    ],
  },
];
