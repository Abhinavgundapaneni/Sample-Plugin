import React, { useState, useEffect } from "react";
import {
  useEditorPanelConfig,
  useConfig,
  useElementData,
  useLoadingState,
} from "@sigmacomputing/plugin";
import Papa from "papaparse";
import ThreeCircleChart from "../components/ThreeCircleChart";
import { readCount } from "../utils/vennUtils";

// ─── Editor Panel (3-circle fields only) ──────────────────────────────────────
const EDITOR_PANEL = [
  { name: "source", type: "element", label: "Data Source" },
  { name: "labelA", type: "text", label: "Set A Label", defaultValue: "Set A" },
  { name: "labelB", type: "text", label: "Set B Label", defaultValue: "Set B" },
  { name: "labelC", type: "text", label: "Set C Label", defaultValue: "Set C" },
  { name: "onlyA", type: "column", source: "source", label: "Only A Count", allowedTypes: ["number", "integer"] },
  { name: "onlyB", type: "column", source: "source", label: "Only B Count", allowedTypes: ["number", "integer"] },
  { name: "onlyC", type: "column", source: "source", label: "Only C Count", allowedTypes: ["number", "integer"] },
  { name: "aAndB", type: "column", source: "source", label: "A ∩ B Count", allowedTypes: ["number", "integer"] },
  { name: "aAndC", type: "column", source: "source", label: "A ∩ C Count", allowedTypes: ["number", "integer"] },
  { name: "bAndC", type: "column", source: "source", label: "B ∩ C Count", allowedTypes: ["number", "integer"] },
  { name: "allThree", type: "column", source: "source", label: "A ∩ B ∩ C Count", allowedTypes: ["number", "integer"] },
];

const DEFAULT = {
  labelA: "Premium", labelB: "Newsletter", labelC: "Beta",
  onlyA: 28, onlyB: 22, onlyC: 18, aAndB: 14, aAndC: 10, bAndC: 8, allThree: 6,
};

function parseCsv(text) {
  const rows = Papa.parse(text.trim(), { header: true, skipEmptyLines: true }).data;
  const r = rows[0] || {};
  return {
    onlyA: Number(r.only_a) || 0,
    onlyB: Number(r.only_b) || 0,
    onlyC: Number(r.only_c) || 0,
    aAndB: Number(r.a_and_b) || 0,
    aAndC: Number(r.a_and_c) || 0,
    bAndC: Number(r.b_and_c) || 0,
    allThree: Number(r.all_three) || 0,
  };
}

export default function ThreeCirclePage() {
  useEditorPanelConfig(EDITOR_PANEL);

  const sourceId = useConfig("source");
  const labelA = useConfig("labelA") || "Set A";
  const labelB = useConfig("labelB") || "Set B";
  const labelC = useConfig("labelC") || "Set C";
  const onlyACol = useConfig("onlyA");
  const onlyBCol = useConfig("onlyB");
  const onlyCCol = useConfig("onlyC");
  const aAndBCol = useConfig("aAndB");
  const aAndCCol = useConfig("aAndC");
  const bAndCCol = useConfig("bAndC");
  const allThreeCol = useConfig("allThree");

  const sourceConfigured = !!(sourceId && onlyACol && onlyBCol && onlyCCol && aAndBCol && aAndCCol && bAndCCol && allThreeCol);
  const sigmaData = useElementData(sourceId);
  const [, setLoading] = useLoadingState(true);

  const [csvData, setCsvData] = useState(DEFAULT);
  const [devReady, setDevReady] = useState(false);

  // Signal Sigma that data is loaded when sigmaData arrives
  useEffect(() => {
    if (sourceConfigured && sigmaData) setLoading(false);
  }, [sourceConfigured, sigmaData]);

  useEffect(() => {
    if (sourceConfigured) return;
    fetch("/data_3circle.csv")
      .then((r) => r.text())
      .then(parseCsv)
      .catch(() => DEFAULT)
      .then((d) => {
        setCsvData(d);
        setDevReady(true);
        setLoading(false);
      });
  }, [sourceConfigured]);

  const chartProps = sourceConfigured && sigmaData
    ? {
        labelA, labelB, labelC,
        onlyA: readCount(sigmaData, onlyACol),
        onlyB: readCount(sigmaData, onlyBCol),
        onlyC: readCount(sigmaData, onlyCCol),
        aAndB: readCount(sigmaData, aAndBCol),
        aAndC: readCount(sigmaData, aAndCCol),
        bAndC: readCount(sigmaData, bAndCCol),
        allThree: readCount(sigmaData, allThreeCol),
      }
    : { ...csvData, labelA: DEFAULT.labelA, labelB: DEFAULT.labelB, labelC: DEFAULT.labelC };

  const ready = sourceConfigured ? sigmaData != null : devReady;

  if (!ready) return <div style={styles.center}>Loading...</div>;

  const isFromSigma = sourceConfigured && sigmaData != null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={isFromSigma ? styles.badgeSigma : styles.badgeCsv}>
          {isFromSigma ? "⬡ Data from Sigma" : "📄 Data from CSV (Demo)"}
        </span>
      </div>
      <ThreeCircleChart {...chartProps} />
    </div>
  );
}

const styles = {
  container: { padding: "20px", maxWidth: "900px", margin: "0 auto" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "20px", flexWrap: "wrap", gap: "10px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  title: { fontSize: "1.3rem", color: "#1a1a2e", margin: 0 },
  badgeSigma: {
    fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: "12px",
    background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb",
  },
  badgeCsv: {
    fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: "12px",
    background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba",
  },
  nav: { display: "flex", gap: "4px" },
  navLink: {
    padding: "6px 16px", border: "1px solid #d1d5db", borderRadius: "6px",
    background: "#fff", cursor: "pointer", fontSize: "0.85rem", color: "#555",
    textDecoration: "none",
  },
  navActive: {
    padding: "6px 16px", border: "1px solid #4c8bf5", borderRadius: "6px",
    background: "#4c8bf5", cursor: "pointer", fontSize: "0.85rem",
    color: "#fff", fontWeight: 600, textDecoration: "none",
  },
  center: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", fontSize: "1rem", color: "#666",
  },
};
