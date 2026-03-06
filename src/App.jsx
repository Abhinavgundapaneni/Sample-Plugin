import React, { useState, useEffect } from "react";
import {
  useEditorPanelConfig,
  useConfig,
  useElementData,
  useLoadingState,
} from "@sigmacomputing/plugin";
import Papa from "papaparse";
import TwoCircleChart from "./components/TwoCircleChart";
import ThreeCircleChart from "./components/ThreeCircleChart";
import { readCount } from "./utils/vennUtils";

// ─── Sigma Editor Panel ────────────────────────────────────────────────────────
// All fields for both 2-circle and 3-circle modes.
// The "Chart Type" dropdown controls which page is shown.
const EDITOR_PANEL = [
  {
    name: "chartType",
    type: "dropdown",
    label: "Chart Type",
    values: ["2-Circle", "3-Circle"],
    defaultValue: "2-Circle",
  },
  { name: "source", type: "element", label: "Data Source" },
  // Set labels
  { name: "labelA", type: "text", label: "Set A Label", defaultValue: "Set A" },
  { name: "labelB", type: "text", label: "Set B Label", defaultValue: "Set B" },
  { name: "labelC", type: "text", label: "Set C Label  (3-circle only)", defaultValue: "Set C" },
  // 2-circle columns
  { name: "onlyA", type: "column", source: "source", label: "Only A Count", allowedTypes: ["number", "integer"] },
  { name: "onlyB", type: "column", source: "source", label: "Only B Count", allowedTypes: ["number", "integer"] },
  { name: "aAndB", type: "column", source: "source", label: "A ∩ B Count", allowedTypes: ["number", "integer"] },
  // Additional 3-circle columns
  { name: "onlyC", type: "column", source: "source", label: "Only C Count  (3-circle only)", allowedTypes: ["number", "integer"] },
  { name: "aAndC", type: "column", source: "source", label: "A ∩ C Count  (3-circle only)", allowedTypes: ["number", "integer"] },
  { name: "bAndC", type: "column", source: "source", label: "B ∩ C Count  (3-circle only)", allowedTypes: ["number", "integer"] },
  { name: "allThree", type: "column", source: "source", label: "A ∩ B ∩ C Count  (3-circle only)", allowedTypes: ["number", "integer"] },
];

// ─── Dev CSV defaults ──────────────────────────────────────────────────────────
const DEFAULT_2 = { labelA: "Premium", labelB: "Newsletter", onlyA: 45, onlyB: 30, both: 25 };
const DEFAULT_3 = {
  labelA: "Premium", labelB: "Newsletter", labelC: "Beta",
  onlyA: 28, onlyB: 22, onlyC: 18, aAndB: 14, aAndC: 10, bAndC: 8, allThree: 6,
};

function parseCsv2(text) {
  const rows = Papa.parse(text.trim(), { header: true, skipEmptyLines: true }).data;
  const r = rows[0] || {};
  return {
    onlyA: Number(r.only_a) || 0,
    onlyB: Number(r.only_b) || 0,
    both: Number(r.both) || Number(r.a_and_b) || 0,
  };
}

function parseCsv3(text) {
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

export default function App() {
  useEditorPanelConfig(EDITOR_PANEL);

  // Sigma config values
  const sigmaChartType = useConfig("chartType");
  const sourceId = useConfig("source");
  const labelA = useConfig("labelA") || "Set A";
  const labelB = useConfig("labelB") || "Set B";
  const labelC = useConfig("labelC") || "Set C";
  const onlyACol = useConfig("onlyA");
  const onlyBCol = useConfig("onlyB");
  const aAndBCol = useConfig("aAndB");
  const onlyCCol = useConfig("onlyC");
  const aAndCCol = useConfig("aAndC");
  const bAndCCol = useConfig("bAndC");
  const allThreeCol = useConfig("allThree");

  const sourceConfigured = !!sourceId;
  const sigmaData = useElementData(sourceId);
  const [, setLoading] = useLoadingState(true);

  // Local tab state (dev mode) — syncs with Sigma chartType when configured
  const [activeTab, setActiveTab] = useState("2-Circle");

  // Dev CSV fallback data
  const [csv2, setCsv2] = useState(DEFAULT_2);
  const [csv3, setCsv3] = useState(DEFAULT_3);
  const [devReady, setDevReady] = useState(false);

  useEffect(() => {
    if (sourceConfigured) return;
    Promise.all([
      fetch("/data_2circle.csv").then((r) => r.text()).then(parseCsv2).catch(() => DEFAULT_2),
      fetch("/data_3circle.csv").then((r) => r.text()).then(parseCsv3).catch(() => DEFAULT_3),
    ]).then(([d2, d3]) => {
      setCsv2(d2);
      setCsv3(d3);
      setDevReady(true);
      setLoading(false);
    });
  }, [sourceConfigured]);

  // Determine active view
  const activeView = sourceConfigured ? (sigmaChartType || "2-Circle") : activeTab;

  // Build props from Sigma data or CSV fallback
  const twoProps = sourceConfigured && sigmaData
    ? {
        labelA, labelB,
        onlyA: readCount(sigmaData, onlyACol),
        onlyB: readCount(sigmaData, onlyBCol),
        both: readCount(sigmaData, aAndBCol),
      }
    : { ...csv2, labelA: DEFAULT_2.labelA, labelB: DEFAULT_2.labelB };

  const threeProps = sourceConfigured && sigmaData
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
    : { ...csv3, labelA: DEFAULT_3.labelA, labelB: DEFAULT_3.labelB, labelC: DEFAULT_3.labelC };

  const sigmaReady = sourceConfigured ? (sigmaData != null) : devReady;

  if (!sigmaReady) {
    return <div style={styles.center}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>Venn Diagram</h2>
          <span style={sourceConfigured ? styles.badgeSigma : styles.badgeCsv}>
            {sourceConfigured ? "⚡ Sigma API" : "📄 Sample CSV"}
          </span>
        </div>
        {/* Only show manual tab switcher in dev mode; Sigma controls it via editor panel */}
        {!sourceConfigured && (
          <div style={styles.tabs}>
            <Tab label="2-Circle" active={activeTab === "2-Circle"} onClick={() => setActiveTab("2-Circle")} />
            <Tab label="3-Circle" active={activeTab === "3-Circle"} onClick={() => setActiveTab("3-Circle")} />
          </div>
        )}
      </div>

      {/* Page content */}
      {activeView === "2-Circle" ? (
        <TwoCircleChart {...twoProps} />
      ) : (
        <ThreeCircleChart {...threeProps} />
      )}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={active ? styles.tabActive : styles.tab}>
      {label}
    </button>
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
  tabs: { display: "flex", gap: "4px" },
  tab: {
    padding: "6px 16px", border: "1px solid #d1d5db", borderRadius: "6px",
    background: "#fff", cursor: "pointer", fontSize: "0.85rem", color: "#555",
  },
  tabActive: {
    padding: "6px 16px", border: "1px solid #4c8bf5", borderRadius: "6px",
    background: "#4c8bf5", cursor: "pointer", fontSize: "0.85rem",
    color: "#fff", fontWeight: 600,
  },
  center: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", fontSize: "1rem", color: "#666",
  },
};
