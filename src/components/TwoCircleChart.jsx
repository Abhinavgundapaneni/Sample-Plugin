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
  const [colorA, setColorA] = useState("#4c8bf5");
  const [colorB, setColorB] = useState("#f5a623");
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

  const sets = useMemo(() => {
    const s = extractSets(elems);
    s.forEach((set) => {
      set.color = set.name === labelA ? colorA : colorB;
    });
    return s;
  }, [elems, labelA, colorA, colorB]);
  const combinations = useMemo(() => generateCombinations(sets), [sets]);

  const total = Number(onlyA) + Number(onlyB) + Number(both);

  if (total === 0) {
    return <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No data — all counts are zero.</p>;
  }

  const totalA = Number(onlyA) + Number(both);
  const totalB = Number(onlyB) + Number(both);

  return (
    <div style={styles.outer}>
      <div
        ref={wrapperRef}
        style={{ position: "relative" }}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setSelection(null)}
      >
        <div style={styles.chartWrapper} ref={chartRef}>
          <VennDiagram
            sets={sets}
            combinations={combinations}
            width={620}
            height={360}
            selection={selection}
            onHover={setSelection}
            filled
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

      {/* Color picker panel */}
      <div style={styles.colorPanel}>
        <p style={styles.colorPanelTitle}>Colors</p>
        <ColorSwatch label={labelA} color={colorA} onChange={setColorA} />
        <ColorSwatch label={labelB} color={colorB} onChange={setColorB} />
      </div>
    </div>
  );
}

function ColorSwatch({ label, color, onChange }) {
  return (
    <div style={styles.swatch}>
      <label style={styles.swatchLabel}>{label}</label>
      <div style={styles.swatchRow}>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          style={styles.colorInput}
        />
        <span style={styles.swatchHex}>{color.toUpperCase()}</span>
      </div>
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
  outer: {
    display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap",
  },
  chartWrapper: {
    background: "#fff", borderRadius: "8px", padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "inline-block",
  },
  colorPanel: {
    background: "#fff", borderRadius: "8px", padding: "16px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: "150px",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  colorPanelTitle: {
    margin: 0, fontSize: "0.8rem", fontWeight: 700,
    textTransform: "uppercase", color: "#888", letterSpacing: "0.05em",
  },
  swatch: { display: "flex", flexDirection: "column", gap: "6px" },
  swatchLabel: { fontSize: "0.8rem", fontWeight: 600, color: "#333" },
  swatchRow: { display: "flex", alignItems: "center", gap: "8px" },
  colorInput: {
    width: "36px", height: "36px", border: "1px solid #d1d5db",
    borderRadius: "6px", cursor: "pointer", padding: "2px", background: "none",
  },
  swatchHex: { fontSize: "0.75rem", color: "#666", fontFamily: "monospace" },
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
