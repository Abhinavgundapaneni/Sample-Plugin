import React, { useMemo, useState, useRef, useEffect } from "react";
import { extractSets, generateCombinations, VennDiagram } from "@upsetjs/react";
import { buildTwoCircleElems } from "../utils/vennUtils";

/**
 * TwoCircleChart
 *
 * Props (from Sigma config or CSV dev data):
 *   labelA, labelB          — set names
 *   onlyA, onlyB, both      — pre-computed cardinalities
 */
export default function TwoCircleChart({ labelA, labelB, onlyA, onlyB, both }) {
  const [selection, setSelection] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);
  const wrapperRef = useRef(null);

  // Remove UpSet.js <title> elements that cause "Premium ∩ Premium" native browser tooltips
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const clean = () => el.querySelectorAll("title").forEach((t) => t.remove());
    const observer = new MutationObserver(clean);
    observer.observe(el, { childList: true, subtree: true });
    clean();
    return () => observer.disconnect();
  }, []);

  const elems = useMemo(
    () => buildTwoCircleElems(labelA, labelB, onlyA, onlyB, both),
    [labelA, labelB, onlyA, onlyB, both]
  );

  const sets = useMemo(() => extractSets(elems), [elems]);
  const combinations = useMemo(() => generateCombinations(sets), [sets]);

  const total = Number(onlyA) + Number(onlyB) + Number(both);

  if (total === 0) {
    return <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No data — all counts are zero.</p>;
  }

  const totalA = Number(onlyA) + Number(both);
  const totalB = Number(onlyB) + Number(both);

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative" }}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setSelection(null)}
    >
      <div style={styles.statsRow}>
        <Stat label={labelA} value={totalA} sub="total in set" />
        <Stat label={labelB} value={totalB} sub="total in set" />
        <Stat label={`${labelA} ∩ ${labelB}`} value={Number(both)} sub="intersection" />
        <Stat label="Total" value={total} sub="unique items" />
      </div>
      <div style={styles.chartWrapper} ref={chartRef}>
        <VennDiagram
          sets={sets}
          combinations={combinations}
          width={680}
          height={360}
          selection={selection}
          onHover={setSelection}
        />
      </div>
      {selection && (
        <div style={{
          ...styles.tooltip,
          position: "fixed",
          left: mousePos.x + 14,
          top: mousePos.y - 36,
          pointerEvents: "none",
        }}>
          <strong>
            {selection.sets
              ? Array.from(selection.sets).map((s) => s.name).join(" ∩ ")
              : selection.name}
          </strong>
          {" — "}{selection.cardinality.toLocaleString()} item{selection.cardinality !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value.toLocaleString()}</div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  );
}

const styles = {
  statsRow: {
    display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px",
  },
  stat: {
    flex: "1 1 100px", background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: "8px", padding: "12px 16px", textAlign: "center",
  },
  statValue: { fontSize: "1.6rem", fontWeight: 700, color: "#1a1a2e" },
  statLabel: { fontSize: "0.8rem", fontWeight: 600, color: "#555", marginTop: 2 },
  statSub: { fontSize: "0.7rem", color: "#999" },
  chartWrapper: {
    background: "#fff", borderRadius: "8px", padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "inline-block",
  },
  tooltip: {
    padding: "7px 12px",
    background: "rgba(30,30,40,0.88)",
    color: "#fff",
    borderRadius: "6px",
    fontSize: "0.85rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
    zIndex: 100,
  },
};
