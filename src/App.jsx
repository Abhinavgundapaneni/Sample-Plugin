import React, { useState, useMemo, useEffect } from "react";
import { extractSets, generateCombinations, VennDiagram } from "@upsetjs/react";
import {
  useEditorPanelConfig,
  useConfig,
  useElementData,
  useLoadingState,
} from "@sigmacomputing/plugin";
import Papa from "papaparse";

// ─── Editor Panel Configuration ───────────────────────────────────────────────
// Declares the inputs that appear in Sigma's right-hand editor panel.
// Users map their Sigma table columns to these fields.
const EDITOR_PANEL = [
  {
    name: "source",
    type: "element",
    label: "Data Source",
  },
  {
    name: "nameColumn",
    type: "column",
    source: "source",
    label: "Name Column",
    allowedTypes: ["text"],
  },
  {
    name: "setsColumn",
    type: "column",
    source: "source",
    label: "Sets Column (pipe-separated)",
    allowedTypes: ["text"],
  },
  {
    name: "title",
    type: "text",
    label: "Chart Title",
    placeholder: "Venn Diagram",
    defaultValue: "Customer Segment Overlap",
  },
];

// ─── CSV fallback (dev only) ───────────────────────────────────────────────────
const CSV_URL = "/data.csv";

function parseCsvToElems(csvText) {
  const result = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true });
  return result.data.map((row) => ({
    name: row.name,
    sets: row.sets
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
  }));
}

export default function App() {
  // Register editor panel inputs with Sigma
  useEditorPanelConfig(EDITOR_PANEL);

  // Read user's column selections from Sigma config
  const nameColumnId = useConfig("nameColumn");
  const setsColumnId = useConfig("setsColumn");
  const chartTitle = useConfig("title") || "Customer Segment Overlap";
  const sourceConfigured = !!useConfig("source");

  // Subscribe to live data Sigma pushes for the mapped source element
  const sigmaData = useElementData("source");

  const [, setLoading] = useLoadingState(true);
  const [selection, setSelection] = useState(null);
  const [csvElems, setCsvElems] = useState([]);
  const [csvLoaded, setCsvLoaded] = useState(false);

  // ── Dev fallback: load CSV when not running inside Sigma ──────────────────
  useEffect(() => {
    if (sourceConfigured) return; // Sigma is providing data, skip CSV
    fetch(CSV_URL)
      .then((r) => r.text())
      .then((text) => {
        setCsvElems(parseCsvToElems(text));
        setCsvLoaded(true);
        setLoading(false);
      })
      .catch(() => {
        setCsvLoaded(true);
        setLoading(false);
      });
  }, [sourceConfigured]);

  // ── Build elements array from whichever data source is active ─────────────
  const elems = useMemo(() => {
    // Running inside Sigma with columns mapped
    if (sourceConfigured && nameColumnId && setsColumnId && sigmaData) {
      const names = sigmaData[nameColumnId] ?? [];
      const setsValues = sigmaData[setsColumnId] ?? [];
      const result = [];
      for (let i = 0; i < names.length; i++) {
        const name = String(names[i] ?? "").trim();
        const rawSets = String(setsValues[i] ?? "");
        const sets = rawSets
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        if (name && sets.length > 0) result.push({ name, sets });
      }
      setLoading(false);
      return result;
    }
    // Dev fallback
    return csvElems;
  }, [sourceConfigured, nameColumnId, setsColumnId, sigmaData, csvElems]);

  const sets = useMemo(() => extractSets(elems), [elems]);
  const combinations = useMemo(() => generateCombinations(sets), [sets]);

  const isReady = sourceConfigured ? !!sigmaData : csvLoaded;

  if (!isReady) {
    return <div style={styles.center}>Loading data...</div>;
  }

  if (sourceConfigured && (!nameColumnId || !setsColumnId)) {
    return (
      <div style={styles.center}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <p>👈 Configure columns in the editor panel on the right.</p>
          <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Select a <strong>Name Column</strong> and a <strong>Sets Column</strong> (pipe-separated values like <code>Premium|Newsletter</code>).
          </p>
        </div>
      </div>
    );
  }

  if (elems.length === 0) {
    return <div style={styles.center}>No data to display.</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{chartTitle} — Venn Diagram</h2>
      {!sourceConfigured && (
        <p style={styles.devBadge}>⚙ Dev mode — using sample CSV data</p>
      )}
      <div style={styles.chartWrapper}>
        <VennDiagram
          sets={sets}
          combinations={combinations}
          width={780}
          height={420}
          selection={selection}
          onHover={setSelection}
        />
      </div>
      {selection && (
        <div style={styles.selectionBox}>
          <strong>Selected:</strong> {selection.name} — {selection.cardinality} member(s)
        </div>
      )}
      <details style={styles.details}>
        <summary>View raw elements ({elems.length})</summary>
        <table style={styles.table}>
          <thead>
            <tr><th>Name</th><th>Sets</th></tr>
          </thead>
          <tbody>
            {elems.map((e) => (
              <tr key={e.name}>
                <td>{e.name}</td>
                <td>{e.sets.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

const styles = {
  container: { padding: "24px", maxWidth: "860px", margin: "0 auto" },
  title: { fontSize: "1.4rem", marginBottom: "6px", color: "#1a1a2e" },
  devBadge: {
    fontSize: "0.8rem", color: "#888", marginBottom: "16px",
    background: "#fffbe6", display: "inline-block", padding: "4px 10px",
    borderRadius: "4px", border: "1px solid #ffe58f",
  },
  chartWrapper: {
    background: "#fff", borderRadius: "8px", padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "inline-block",
  },
  selectionBox: {
    marginTop: "16px", padding: "10px 16px", background: "#e8f4fd",
    borderRadius: "6px", fontSize: "0.9rem",
  },
  center: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", fontSize: "1.1rem",
  },
  details: { marginTop: "24px" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "0.85rem" },
};
