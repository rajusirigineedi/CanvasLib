export type ZoomPreset = "upper" | "lower" | "middle" | "none";
export type OptionId = string | number;
export type OptionRules = Record<string, OptionId[]>;

export type CustomizerMaterial = {
  id: OptionId;
  price: number;
  disabledSubElementIndices: OptionRules;
};

export type CustomizerSubElement = {
  id: OptionId;
  images?: (string | null)[];
  price?: number;
  defaultView?: number;
  disabledSubElementIndices: OptionRules;
  record?: Record<string, string>;
};

export type CustomizerSubElementGroup = {
  id: string;
  category: "custom" | "global" | "unique" | "text";
  subElements: CustomizerSubElement[];
  selectedSubElementId?: number;
  zPos?: number;
  zoom: ZoomPreset;
};

export type CustomizerMeasurement = {
  id: string;
  selectedIndex?: number;
};

export type CustomizerProduct = {
  id?: string;
  basePrice: number;
  fabrics: CustomizerMaterial[];
  shades: CustomizerMaterial[];
  defaultFabricId: number;
  defaultShadeId: number;
  currentView?: number;
  currentZoom?: ZoomPreset;
  measurements: CustomizerMeasurement[];
  subElementGroups: CustomizerSubElementGroup[];
};

export type CreationSelection = {
  groupId: string;
  selectedSubElementId: number;
};

export type CustomizerCreation = {
  id?: string;
  pantId?: string;
  basePrice?: number;
  addOnsPrice?: number;
  selectedSubElements: CreationSelection[];
  selectedMeasurements: CreationSelection[];
  selectedFabricId: number;
  selectedShadeId: number;
  selectedMonogram: Record<string, string>;
  creationImage?: string;
};

export const zoomPresets: Record<
  ZoomPreset,
  { zoom: number; focusX: number; focusY: number }
> = {
  none: { zoom: 1, focusX: 0.5, focusY: 0.5 },
  upper: { zoom: 1.6, focusX: 0.5, focusY: -0.25 },
  lower: { zoom: 1.2, focusX: 0.5, focusY: 2 },
  middle: { zoom: 2, focusX: 0.5, focusY: 0.5 },
};

function selectedRules(product: CustomizerProduct): OptionRules[] {
  const groupRules = product.subElementGroups.map((group) => {
    const selected = group.subElements[group.selectedSubElementId ?? 0];
    return selected?.disabledSubElementIndices ?? {};
  });
  return [
    ...groupRules,
    product.fabrics[product.defaultFabricId]?.disabledSubElementIndices ?? {},
    product.shades[product.defaultShadeId]?.disabledSubElementIndices ?? {},
  ];
}

export function getDisabledOptions(product: CustomizerProduct): OptionRules {
  return selectedRules(product).reduce<OptionRules>((result, rules) => {
    Object.entries(rules).forEach(([groupId, optionIds]) => {
      result[groupId] = Array.from(
        new Set([...(result[groupId] ?? []), ...optionIds]),
      );
    });
    return result;
  }, {});
}

export function getAddOnTotal(product: CustomizerProduct): number {
  const groupsTotal = product.subElementGroups.reduce((total, group) => {
    if (typeof group.selectedSubElementId !== "number") return total;
    const option = group.subElements[group.selectedSubElementId];
    return total + (option?.price ?? 0);
  }, 0);
  return (
    groupsTotal +
    (product.fabrics[product.defaultFabricId]?.price ?? 0) +
    (product.shades[product.defaultShadeId]?.price ?? 0)
  );
}

export function getCustomizerTotal(product: CustomizerProduct): number {
  return product.basePrice + getAddOnTotal(product);
}

export function substituteMaterial(
  url: string | null | undefined,
  shadeId?: OptionId,
  fabricId?: OptionId,
): string | null {
  if (!url) return null;
  const parts = url.replace(/\/v\d+\//, "/").split("/");
  if (parts.length >= 3) {
    if (shadeId !== undefined) parts[parts.length - 3] = String(shadeId);
    if (fabricId !== undefined) parts[parts.length - 2] = String(fabricId);
  }
  return parts.join("/").replace(/^http:\/\//, "https://");
}

export type DeriveImageListOptions = {
  applyMaterials?: boolean;
  fabricIndex?: number;
  shadeIndex?: number;
  view?: number;
};

export function deriveImageList(
  product: CustomizerProduct,
  options: DeriveImageListOptions = {},
): string[] {
  const view = options.view ?? product.currentView ?? 0;
  const fabricId =
    product.fabrics[options.fabricIndex ?? product.defaultFabricId]?.id;
  const shadeId =
    product.shades[options.shadeIndex ?? product.defaultShadeId]?.id;
  const applyMaterials = options.applyMaterials ?? true;

  return product.subElementGroups
    .map((group) => {
      const selectedIndex = group.selectedSubElementId;
      if (selectedIndex === undefined || selectedIndex === -1) return null;
      const option = group.subElements[selectedIndex];
      return {
        image: applyMaterials
          ? substituteMaterial(
              option?.images?.[view],
              group.category === "global" ? undefined : shadeId,
              group.category === "global" ? undefined : fabricId,
            )
          : option?.images?.[view] ?? null,
        zPos: group.zPos ?? 1,
      };
    })
    .filter((layer): layer is { image: string; zPos: number } =>
      Boolean(layer?.image),
    )
    .sort((left, right) => left.zPos - right.zPos)
    .map((layer) => layer.image);
}

export function getViewCount(product: CustomizerProduct): number {
  return Math.max(
    1,
    ...product.subElementGroups.flatMap((group) =>
      group.subElements.map((option) => option.images?.length ?? 0),
    ),
  );
}

export function applyCreation<T extends CustomizerProduct>(
  product: T,
  creation?: CustomizerCreation,
): T {
  if (!creation) return product;

  return {
    ...product,
    defaultFabricId: creation.selectedFabricId ?? product.defaultFabricId,
    defaultShadeId: creation.selectedShadeId ?? product.defaultShadeId,
    measurements: product.measurements.map((measurement) => {
      const selected = creation.selectedMeasurements.find(
        (item) => item.groupId === measurement.id,
      );
      return selected
        ? { ...measurement, selectedIndex: selected.selectedSubElementId }
        : measurement;
    }),
    subElementGroups: product.subElementGroups.map((group) => {
      const selected = creation.selectedSubElements.find(
        (item) => item.groupId === group.id,
      );
      if (!selected) return group;
      if (group.category !== "text") {
        return {
          ...group,
          selectedSubElementId: selected.selectedSubElementId,
        };
      }
      return {
        ...group,
        selectedSubElementId: selected.selectedSubElementId,
        subElements: group.subElements.map((option, index) =>
          index === selected.selectedSubElementId
            ? {
                ...option,
                record: { ...option.record, ...creation.selectedMonogram },
              }
            : option,
        ),
      };
    }),
  } as T;
}

export function selectGroupOption<T extends CustomizerProduct>(
  product: T,
  groupId: string,
  optionIndex: number,
  record?: Record<string, string>,
): T {
  const selectedGroup = product.subElementGroups.find(
    (group) => group.id === groupId,
  );
  if (!selectedGroup) return product;
  return {
    ...product,
    subElementGroups: product.subElementGroups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        selectedSubElementId: optionIndex,
        subElements: group.subElements.map((option, index) =>
          index === optionIndex && record ? { ...option, record } : option,
        ),
      };
    }),
    currentView: selectedGroup.subElements[optionIndex]?.defaultView,
    currentZoom: selectedGroup.zoom,
  } as T;
}

export function selectedMonogram(
  groups: CustomizerSubElementGroup[],
): Record<string, string> {
  const group = groups.find((item) => item.category === "text");
  return group?.subElements[group.selectedSubElementId ?? 0]?.record ?? {};
}

export function buildCreationPayload(
  product: CustomizerProduct,
  creationImage: string,
  existingId?: string,
): CustomizerCreation & { creationImage: string } {
  const monogram = selectedMonogram(product.subElementGroups);
  return {
    id: existingId,
    pantId: product.id,
    basePrice: product.basePrice,
    addOnsPrice: getAddOnTotal(product),
    creationImage,
    selectedFabricId: product.defaultFabricId,
    selectedShadeId: product.defaultShadeId,
    selectedMonogram: {
      text: monogram.text,
      font: monogram.font,
      color: monogram.color,
    },
    selectedSubElements: product.subElementGroups.map((group) => ({
      groupId: group.id,
      selectedSubElementId: group.selectedSubElementId ?? 0,
    })),
    selectedMeasurements: product.measurements.map((measurement) => ({
      groupId: measurement.id,
      selectedSubElementId: measurement.selectedIndex ?? 0,
    })),
  };
}
