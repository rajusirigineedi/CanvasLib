export type ZoomPreset = "upper" | "lower" | "middle" | "none";
export type OptionId = string | number;
export type OptionRules = Record<string, OptionId[]>;

export type CustomizerMaterial = {
  id: OptionId;
  price: number;
  disabledSubElementIndices: OptionRules;
};

export type RenderLayer = {
  requiresChoices?: Record<string, string>;
  id: string;
  view: number;
  zPos: number;
  fabricId: string;
  shadeId: string;
  image: string;
};

export type CustomizerSubElement = {
  renderLayers?: RenderLayer[];
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
  revision?: number;
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
  optionId?: string;
  groupId: string;
  selectedSubElementId: number;
};

export type CustomizerCreation = {
  builderRevision?: number;
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
      const candidates =
        groupId === "fabrics"
          ? product.fabrics
          : groupId === "shades"
            ? product.shades
            : (product.subElementGroups.find((group) => group.id === groupId)
                ?.subElements ?? []);
      const normalized = optionIds.map(
        (id) =>
          candidates.find((option) => String(option.id) === String(id))?.id ??
          id,
      );
      result[groupId] = Array.from(
        new Set([...(result[groupId] ?? []), ...normalized]),
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
    .flatMap((group) => {
      const selectedIndex = group.selectedSubElementId;
      if (selectedIndex === undefined || selectedIndex === -1) return [];
      const option = group.subElements[selectedIndex];
      if (option?.renderLayers !== undefined) {
        return option.renderLayers
          .filter(
            (layer) =>
              Object.entries(layer.requiresChoices ?? {}).every(([groupId, optionId]) => {
                const dependency = product.subElementGroups.find((g) => String(g.id) === groupId);
                const selected = dependency?.selectedSubElementId;
                return selected !== undefined && selected >= 0 && String(dependency?.subElements[selected]?.id) === String(optionId);
              }) &&
              layer.view === view &&
              layer.fabricId === String(fabricId) &&
              layer.shadeId === String(shadeId),
          )
          .map((layer) => ({ image: layer.image, zPos: layer.zPos }));
      }
      const image = applyMaterials
        ? substituteMaterial(
            option?.images?.[view],
            group.category === "global" ? undefined : shadeId,
            group.category === "global" ? undefined : fabricId,
          )
        : (option?.images?.[view] ?? null);
      return image ? [{ image, zPos: group.zPos ?? 1 }] : [];
    })
    .sort((left, right) => left.zPos - right.zPos)
    .map((layer) => layer.image);
}

export function getViewCount(product: CustomizerProduct): number {
  return Math.max(
    1,
    ...product.subElementGroups.flatMap((group) =>
      group.subElements.map((option) =>
        Math.max(
          option.images?.length ?? 0,
          ...(option.renderLayers ?? []).map((layer) => layer.view + 1),
        ),
      ),
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
      const selectedIndex =
        selected.optionId !== undefined
          ? group.subElements.findIndex(
              (option) => String(option.id) === selected.optionId,
            )
          : selected.selectedSubElementId;
      if (selectedIndex < 0) return group;
      if (group.category !== "text") {
        return {
          ...group,
          selectedSubElementId: selectedIndex,
        };
      }
      return {
        ...group,
        selectedSubElementId: selectedIndex,
        subElements: group.subElements.map((option, index) =>
          index === selectedIndex
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
  if (!selectedGroup || !selectedGroup.subElements[optionIndex]) return product;
  const candidate = selectedGroup.subElements[optionIndex];
  const otherProduct = {
    ...product,
    subElementGroups: product.subElementGroups.map((group) =>
      group.id === groupId ? { ...group, selectedSubElementId: -1 } : group,
    ),
  };
  if (
    (getDisabledOptions(otherProduct)[groupId] ?? []).some(
      (id) => String(id) === String(candidate.id),
    )
  )
    return product;
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
    currentView: optionPreviewView(candidate) ?? product.currentView,
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
    builderRevision: product.revision,
    selectedFabricId: product.defaultFabricId,
    selectedShadeId: product.defaultShadeId,
    selectedMonogram: {
      text: monogram.text,
      font: monogram.font,
      color: monogram.color,
    },
    selectedSubElements: product.subElementGroups.map((group) => ({
      groupId: group.id,
      optionId: String(
        group.subElements[group.selectedSubElementId ?? 0]?.id ?? "",
      ),
      selectedSubElementId: group.selectedSubElementId ?? 0,
    })),
    selectedMeasurements: product.measurements.map((measurement) => ({
      groupId: measurement.id,
      selectedSubElementId: measurement.selectedIndex ?? 0,
    })),
  };
}

/** Preview navigation is independent of the saved selection. */
export function optionPreviewView(option: CustomizerSubElement): number | undefined {
  if (Number.isInteger(option.defaultView) && option.defaultView! >= 0) return option.defaultView;
  const views = Array.from(new Set((option.renderLayers ?? []).map(layer => layer.view)));
  return views.length === 1 ? views[0] : undefined;
}
export function focusGroupPreview<T extends CustomizerProduct>(product: T, groupId: string): T {
  const group = product.subElementGroups.find(g => g.id === groupId);
  const option = group?.subElements[group.selectedSubElementId ?? 0];
  if (!group || !option) return product;
  return { ...product, currentView: optionPreviewView(option) ?? product.currentView, currentZoom: group.zoom };
}
