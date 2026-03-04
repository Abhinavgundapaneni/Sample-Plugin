import React, { useState, useMemo, useEffect } from "react";
import { extractSets, generateCombinations, VennDiagram } from "@upsetjs/react";
import Papa from "papaparse";

/**
 * Sigma Plugin Integration
 * -------------------------
 * When embedded as a Sigma plugin, Sigma passes data via its Plugin API.
 * The "sigmaData" prop (array of { name, sets[] } objects) replaces the CSV.
 *
 * Sigma plugin setup steps:
 *   1. Build: `npm run build`
 *   2. Host the `dist/` folder (Netlify, etc.)
 *   3. In Sigma > Administration > Plugins, register the URL
 *   4. Add the plugin to a workbook and map columns to "name" and "sets"
 */

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
  const [elems, setElems] = useState([]);
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load sample CSV data (replace this block with Sigma plugin data when embedded)
  useEffect(() => {
    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load data.csv");
        return res.text();
      })
      .then((text) => {
        setElems(parseCsvToElems(text));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const sets = useMemo(() => extractSets(elems), [elems]);
  const combinations = useMemo(() => generateCombinations(sets), [sets]);

  if (loading) return <div style={styles.center}>Loading data...</div>;
  if (error) return <div style={{ ...styles.center, color: "red" }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Customer Segment Overlap — Venn Diagram</h2>
      <p style={styles.subtitle}>
        Hover over a region to highlight it. Data loaded from <code>data.csv</code>.
      </p>
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
          <strong>Selected:</strong> {selection.name} &mdash; {selection.cardinality} member(s)
        </div>
      )}
      <details style={styles.details}>
        <summary>View raw elements ({elems.length})</summary>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sets</th>
            </tr>
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
  container: {
    padding: "24px",
    maxWidth: "860px",
    margin: "0 auto",
  },
  title: {
    fontSize: "1.4rem",
    marginBottom: "6px",
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#555",
    marginBottom: "20px",
  },
  chartWrapper: {
    background: "#fff",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "inline-block",
  },
  selectionBox: {
    marginTop: "16px",
    padding: "10px 16px",
    background: "#e8f4fd",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "1.1rem",
  },
  details: {
    marginTop: "24px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    fontSize: "0.85rem",
  },
};
