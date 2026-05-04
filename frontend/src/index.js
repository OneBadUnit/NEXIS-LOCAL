// ============================================================
// ARC-NEXUS - FRONTEND ENTRY POINT
// File: src/index.js
// Version: 002 (Clean Global Style Order)
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./ArcNexusApp.jsx";

import "./index.css";
import "./layout/layout.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);