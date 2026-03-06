import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TwoCirclePage from "./pages/TwoCirclePage";
import ThreeCirclePage from "./pages/ThreeCirclePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/2-circle" replace />} />
      <Route path="/2-circle" element={<TwoCirclePage />} />
      <Route path="/3-circle" element={<ThreeCirclePage />} />
    </Routes>
  );
}
