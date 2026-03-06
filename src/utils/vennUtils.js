/**
 * Builds a dummy element array for UpSet.js from pre-computed 2-circle cardinalities.
 * UpSet.js works with elements, so we synthesize them from the counts.
 *
 * @param {string} labelA  - Name of Set A
 * @param {string} labelB  - Name of Set B
 * @param {number} onlyA   - Count exclusive to A
 * @param {number} onlyB   - Count exclusive to B
 * @param {number} both    - Count in both A and B
 */
export function buildTwoCircleElems(labelA, labelB, onlyA, onlyB, both) {
  const n = (v) => Math.max(0, Math.round(Number(v) || 0));
  return [
    ...Array.from({ length: n(onlyA) }, (_, i) => ({ name: `a${i}`, sets: [labelA] })),
    ...Array.from({ length: n(both) }, (_, i) => ({ name: `ab${i}`, sets: [labelA, labelB] })),
    ...Array.from({ length: n(onlyB) }, (_, i) => ({ name: `b${i}`, sets: [labelB] })),
  ];
}

/**
 * Builds a dummy element array for UpSet.js from pre-computed 3-circle cardinalities.
 *
 * @param {string} labelA, labelB, labelC   - Names of each set
 * @param {number} onlyA, onlyB, onlyC      - Exclusive counts
 * @param {number} aAndB, aAndC, bAndC      - Pairwise intersection counts
 * @param {number} allThree                 - Triple intersection count
 */
export function buildThreeCircleElems(
  labelA, labelB, labelC,
  onlyA, onlyB, onlyC,
  aAndB, aAndC, bAndC,
  allThree
) {
  const n = (v) => Math.max(0, Math.round(Number(v) || 0));
  return [
    ...Array.from({ length: n(onlyA) }, (_, i) => ({ name: `a${i}`, sets: [labelA] })),
    ...Array.from({ length: n(onlyB) }, (_, i) => ({ name: `b${i}`, sets: [labelB] })),
    ...Array.from({ length: n(onlyC) }, (_, i) => ({ name: `c${i}`, sets: [labelC] })),
    ...Array.from({ length: n(aAndB) }, (_, i) => ({ name: `ab${i}`, sets: [labelA, labelB] })),
    ...Array.from({ length: n(aAndC) }, (_, i) => ({ name: `ac${i}`, sets: [labelA, labelC] })),
    ...Array.from({ length: n(bAndC) }, (_, i) => ({ name: `bc${i}`, sets: [labelB, labelC] })),
    ...Array.from({ length: n(allThree) }, (_, i) => ({ name: `abc${i}`, sets: [labelA, labelB, labelC] })),
  ];
}

/** Reads a count value from sigmaData. Returns the numeric value of the first row. */
export function readCount(sigmaData, colId) {
  if (!sigmaData || !colId) return 0;
  const vals = sigmaData[colId];
  if (!vals || vals.length === 0) return 0;
  return Number(vals[0]) || 0;
}
