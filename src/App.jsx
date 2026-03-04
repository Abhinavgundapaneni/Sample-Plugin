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

  // Ready as soon as Sigma has responded (even with empty data).
  // Waiting for specific column keys causes infinite loading when data is empty.
  const sigmaDataReady = sigmaData != null && nameColumnId != null && setsColumnId != null;

  const isReady = sourceConfigured ? sigmaDataReady : csvLoaded;

  // Debug info — always visible when Sigma source is configured to help diagnose issues
  const debugInfo = sourceConfigured ? (
    <details style={styles.debugDetails}>
      <summary style={styles.debugSummary}>🔍 Debug info</summary>
      <pre style={styles.debugPre}>
        {JSON.stringify(
          {
            sourceConfigured,
            nameColumnId,
            setsColumnId,
            sigmaDataKeys: sigmaData ? Object.keys(sigmaData) : null,
            nameColumnSample: sigmaData && nameColumnId ? (sigmaData[nameColumnId] || []).slice(0, 3) : null,
            setsColumnSample: sigmaData && setsColumnId ? (sigmaData[setsColumnId] || []).slice(0, 3) : null,
          },
          null,
          2
        )}
      </pre>
    </details>
  ) : null;

  if (!isReady) {
    return (
      <div style={styles.center}>
        <div style={{ textAlign: "center" }}>
          <p>Loading data from Sigma...</p>
          {debugInfo}
        </div>
      </div>
    );
  }

  if (sourceConfigured && (!nameColumnId || !setsColumnId)) {
    return (
      <div style={styles.center}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <p>👈 Configure columns in the editor panel on the right.</p>
          <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Select a <strong>Name Column</strong> and a <strong>Sets Column</strong> (pipe-separated values like <code>Premium|Newsletter</code>).
          </p>
          {debugInfo}
        </div>
      </div>
    );
  }

  if (elems.length === 0) {
    const keysEmpty = sigmaData && Object.keys(sigmaData).length === 0;
    return (
      <div style={{ ...styles.center, flexDirection: "column", gap: "16px" }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <p style={{ fontSize: "1.1rem" }}>No data to display.</p>
          {keysEmpty && (
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Sigma returned an empty data response. Make sure the connected table
              has rows and that the <strong>Sets Column</strong> contains
              pipe-separated values (e.g. <code>Premium|Newsletter</code>).
            </p>
          )}
        </div>
        {debugInfo}
      </div>
    );
  }

  const dataSource = sourceConfigured && sigmaData ? "sigma" : "csv";

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>{chartTitle} — Venn Diagram</h2>
        <span style={dataSource === "sigma" ? styles.badgeSigma : styles.badgeCsv}>
          {dataSource === "sigma" ? "⚡ Sigma API" : "📄 Sample CSV"}
        </span>
      </div>
      {debugInfo}
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
  titleRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" },
  title: { fontSize: "1.4rem", color: "#1a1a2e", margin: 0 },
  badgeSigma: {
    fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px",
    borderRadius: "12px", background: "#d4edda", color: "#155724",
    border: "1px solid #c3e6cb", whiteSpace: "nowrap",
  },
  badgeCsv: {
    fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px",
    borderRadius: "12px", background: "#fff3cd", color: "#856404",
    border: "1px solid #ffeeba", whiteSpace: "nowrap",
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
  debugDetails: { marginTop: "16px", textAlign: "left" },
  debugSummary: { cursor: "pointer", fontSize: "0.8rem", color: "#888", userSelect: "none" },
  debugPre: {
    marginTop: "8px", padding: "12px", background: "#f4f4f4", borderRadius: "6px",
    fontSize: "0.75rem", overflowX: "auto", border: "1px solid #ddd", whiteSpace: "pre-wrap",
  },
};
