import React, { useState } from "react";

import TopBar from "./TopBar";
import NavBar from "./NavBar";

import NexusDashboard from "../pages/NexusDashboard";
import Assimilation from "../pages/Assimilation";
import Creation from "../pages/Creation";
import Reconstruction from "../pages/Reconstruction";
import Settings from "../pages/Settings";
import Help from "../pages/Help";

import "./layout.css";

export default function AppLayout() {
  const [activePage, setActivePage] = useState("nexus");

  return (
    <div className="app-shell">
      <TopBar setActivePage={setActivePage} />
      <NavBar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-content">
        {activePage === "nexus" && <NexusDashboard />}
        {activePage === "assimilation" && <Assimilation />}
        {activePage === "creation" && <Creation />}
        {activePage === "reconstruction" && <Reconstruction />}
        {activePage === "settings" && <Settings />}
        {activePage === "help" && <Help />}
      </main>
    </div>
  );
}
