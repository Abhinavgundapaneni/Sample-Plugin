import React, { useMemo, useState, useRef, useEffect } from "react";
import { extractSets, generateCombinations, VennDiagram } from "@upsetjs/react";
import { usePlugin } from "@sigmacomputing/plugin";
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [colorA, setColorA] = useState("#4c8bf5");
  const [colorB, setColorB] = useState("#f5a623");
  const [colorC, setColorC] = useState("#7ed321");
  const [filled, setFilled] = useState(true);
  const chartRef = useRef(null);
  const wrapperRef = useRef(null);
  const { sigmaEnv } = usePlugin();
  const isAuthor = !sigmaEnv || sigmaEnv === 'author';

  // Remove UpSet.js <title> elements and strip N/M fraction labels
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const clean = () => {
      el.querySelectorAll("title").forEach((t) => t.remove());
      el.querySelectorAll('tspan, text[class*="valueTextStyle"]').forEach((t) => {
        if (t.childElementCount > 0) return;
        const m = t.textContent && t.textContent.match(/^(\d[\d,]*)\/(\d[\d,]*)$/);
        if (m) t.textContent = m[1];
      });
    };
    const observer = new MutationObserver(clean);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    clean();
    return () => observer.disconnect();
  }, []);

  // Apply per-set stroke color and thickness
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const applyStrokes = () => {
      const circles = el.querySelectorAll('[class*="stroke-circle"]');
      const colors = [colorA, colorB, colorC];
      circles.forEach((circle, i) => {
        circle.style.stroke = filled ? "#000" : (colors[i] ?? colors[colors.length - 1]);
        circle.style.strokeWidth = filled ? "1" : "3";
      });
    };
    applyStrokes();
    const observer = new MutationObserver(applyStrokes);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [colorA, colorB, colorC, filled]);

  const elems = useMemo(
    () => buildThreeCircleElems(
      labelA, labelB, labelC,
      onlyA, onlyB, onlyC,
      aAndB, aAndC, bAndC,
      allThree
    ),
    [labelA, labelB, labelC, onlyA, onlyB, onlyC, aAndB, aAndC, bAndC, allThree]
  );

  const sets = useMemo(() => {
    const s = extractSets(elems);
    s.forEach((set) => {
      if (!filled) { set.color = undefined; return; }
      if (set.name === labelA) set.color = colorA;
      else if (set.name === labelB) set.color = colorB;
      else set.color = colorC;
    });
    return s;
  }, [elems, labelA, labelB, colorA, colorB, colorC, filled]);
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
            width={660}
            height={420}
            selection={selection}
            onHover={setSelection}
            selectionColor={filled ? "" : "white"}
            filled={filled}
            valueFormat={(v) => v.toLocaleString()}
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

      {/* Color picker panel — author only */}
      {isAuthor && (
        <div style={styles.colorPanel}>
          <p style={styles.colorPanelTitle}>Colors</p>
          <FillToggle filled={filled} onChange={setFilled} />
          <ColorSwatch label={labelA} color={colorA} onChange={setColorA} />
          <ColorSwatch label={labelB} color={colorB} onChange={setColorB} />
          <ColorSwatch label={labelC} color={colorC} onChange={setColorC} />
        </div>
      )}
    </div>
  );
}

function FillToggle({ filled, onChange }) {
  return (
    <div style={styles.toggleRow}>
      <span style={styles.swatchLabel}>Fill</span>
      <label style={styles.toggleSwitch}>
        <input
          type="checkbox"
          checked={filled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ display: "none" }}
        />
        <span style={{
          ...styles.toggleTrack,
          background: filled ? "#4c8bf5" : "#ccc",
        }}>
          <span style={{
            ...styles.toggleThumb,
            transform: filled ? "translateX(16px)" : "translateX(0px)",
          }} />
        </span>
      </label>
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
  outer: {
    display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "nowrap",
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
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  toggleSwitch: { cursor: "pointer", display: "inline-block" },
  toggleTrack: {
    display: "inline-flex", width: "36px", height: "20px",
    borderRadius: "10px", padding: "2px", transition: "background 0.2s",
    alignItems: "center",
  },
  toggleThumb: {
    width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "transform 0.2s",
    display: "block",
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
