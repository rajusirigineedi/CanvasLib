const assert = require("node:assert/strict");
const {
  deriveImageList,
  getCustomizerTotal,
  interpolateCanvasViewport,
  resolveCanvasFrame,
} = require("../dist/cjs/core");

const frame = resolveCanvasFrame(800, 1600, 400, 400, {
  zoom: 2,
  focusX: 0.5,
  focusY: 0,
});
assert.deepEqual(frame, {
  x: 0,
  y: 0,
  width: 400,
  height: 800,
});

const nextViewport = interpolateCanvasViewport(
  { zoom: 1, focusX: 0.5, focusY: 0.5 },
  { zoom: 2, focusX: 0, focusY: 1 },
  16,
  0,
);
assert.deepEqual(nextViewport, { zoom: 2, focusX: 0, focusY: 1 });

const product = {
  id: "pants-1",
  basePrice: 1000,
  defaultFabricId: 0,
  defaultShadeId: 0,
  currentView: 0,
  measurements: [],
  fabrics: [
    {
      id: "fabric-a",
      price: 100,
      disabledSubElementIndices: {},
    },
  ],
  shades: [
    {
      id: "shade-a",
      price: 50,
      disabledSubElementIndices: {},
    },
  ],
  subElementGroups: [
    {
      id: "base",
      category: "custom",
      selectedSubElementId: 0,
      zPos: 2,
      zoom: "none",
      subElements: [
        {
          id: "base-a",
          images: ["https://cdn.example/v1/old-shade/old-fabric/base.png"],
          price: 25,
          disabledSubElementIndices: {},
        },
      ],
    },
    {
      id: "global",
      category: "global",
      selectedSubElementId: 0,
      zPos: 1,
      zoom: "none",
      subElements: [
        {
          id: "global-a",
          images: ["https://cdn.example/v1/global/logo.png"],
          disabledSubElementIndices: {},
        },
      ],
    },
  ],
};

assert.equal(getCustomizerTotal(product), 1175);
assert.deepEqual(deriveImageList(product), [
  "https://cdn.example/global/logo.png",
  "https://cdn.example/shade-a/fabric-a/base.png",
]);

console.log("fitt-canvas core contract tests passed");
