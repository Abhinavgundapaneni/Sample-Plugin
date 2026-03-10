import React, { useMemo, useState } from "react";
import { extractSets, generateCombinations, VennDiagram } from "@upsetjs/react";
import { buildThreeCircleElems } from "../utils/vennUtils";

/**
 * ThreeCircleChart
 *
 * Props (from Sigma config or CSV dev data):
 *   labelA, labelB, labelC               — set names
 *   onlyA, onlyB, onlyC                  — exclusive counts
 *   aAndB, aAndC, bAndC                  — pairwise intersection counts
 *   allThree                             — triple intersection count
 */
export default function ThreeCircleChart({
  labelA, labelB, labelC,
  onlyA, onlyB, onlyC,
  aAndB, aAndC, bAndC,
  allThree,
}) {
  const [selection, setSelection] = useState(null);

  const elems = useMemo(
    () => buildThreeCircleElems(
      labelA, labelB, labelC,
      onlyA, onlyB, onlyC,
      aAndB, aAndC, bAndC,
      allThree
    ),
    [labelA, labelB, labelC, onlyA, onlyB, onlyC, aAndB, aAndC, bAndC, allThree]
  );

  const sets = useMemo(() => extractSets(elems), [elems]);
  const combinations = useMemo(() => generateCombinations(sets), [sets]);

  const total =
    Number(onlyA) + Number(onlyB) + Number(onlyC) +
    Number(aAndB) + Number(aAndC) + Number(bAndC) +
    Number(allThree);

  if (total === 0) {
    return <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No data — all counts are zero.</p>;
  }

  const sizeA = Number(onlyA) + Number(aAndB) + Number(aAndC) + Number(allThree);
  const sizeB = Number(onlyB) + Number(aAndB) + Number(bAndC) + Number(allThree);
  const sizeC = Number(onlyC) + Number(aAndC) + Number(bAndC) + Number(allThree);

  return (
    <div>
      <div style={styles.statsGrid}>
        <Stat label={labelA} value={sizeA} sub="total in set" color="#4c8bf5" />
        <Stat label={labelB} value={sizeB} sub="total in set" color="#f5a623" />
        <Stat label={labelC} value={sizeC} sub="total in set" color="#7ed321" />
        <Stat label={`${labelA} ∩ ${labelB}`} value={Number(aAndB) + Number(allThree)} sub="overlap" color="#e8a0c8" />
        <Stat label={`${labelA} ∩ ${labelC}`} value={Number(aAndC) + Number(allThree)} sub="overlap" color="#a0c8e8" />
        <Stat label={`${labelB} ∩ ${labelC}`} value={Number(bAndC) + Number(allThree)} sub="overlap" color="#c8e8a0" />
        <Stat label="All Three" value={Number(allThree)} sub="triple overlap" color="#b39ddb" />
        <Stat label="Total" value={total} sub="unique items" color="#546e7a" />
      </div>
      <div style={styles.chartWrapper}>
        <VennDiagram
          sets={sets}
          combinations={combinations}
          width={720}
          height={420}
          selection={selection}
          onHover={setSelection}
        />
      </div>
      {selection && (
        <div style={styles.tooltip}>
          <strong>{selection.name}</strong> — {selection.cardinality} item{selection.cardinality !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ ...styles.stat, borderTop: `3px solid ${color}` }}>
      <div style={{ ...styles.statValue, color }}>{value.toLocaleString()}</div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  );
}

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },
  stat: {
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: "8px", padding: "10px 12px", textAlign: "center",
  },
  statValue: { fontSize: "1.4rem", fontWeight: 700 },
  statLabel: { fontSize: "0.75rem", fontWeight: 600, color: "#555", marginTop: 2 },
  statSub: { fontSize: "0.65rem", color: "#999" },
  chartWrapper: {
    background: "#fff", borderRadius: "8px", padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "inline-block",
  },
  tooltip: {
    marginTop: "12px", padding: "8px 14px", background: "#e8f4fd",
    borderRadius: "6px", fontSize: "0.9rem", display: "inline-block",
  },
};
