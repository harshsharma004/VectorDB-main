export const state = {
  allItems: [],
  pcaPoints: [],
  hitIds: new Set(),
  queryPt: null,
  hoverItem: null,
  pulse: 0,
  selAlgo: 'hnsw',
  searchResults: [],
  bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 }
};

export function setState(key, value) {
  state[key] = value;
}
