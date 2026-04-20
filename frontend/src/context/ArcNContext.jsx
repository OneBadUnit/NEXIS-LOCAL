import React, { createContext, useState, useEffect } from "react";

export const ArcNContext = createContext();

export const ArcNProvider = ({ children }) => {
  const [statusMessage, setStatusMessage] = useState("NEXUS ONLINE");
  const [activePage, setActivePage] = useState("Landing");
  const [activeModule, setActiveModule] = useState(null);

  // Persistent Assimilation state
  const [assimilationState, setAssimilationState] = useState({
    inputType: "url",
    url: "",
    file: null,
    loading: false,
    result: null,
  });

  // Saved assimilations (persistent)
  const [savedAssimilations, setSavedAssimilations] = useState([]);

  // Load saved assimilations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("arcn_saved_assimilations");
    if (stored) {
      setSavedAssimilations(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever savedAssimilations changes
  useEffect(() => {
    localStorage.setItem(
      "arcn_saved_assimilations",
      JSON.stringify(savedAssimilations)
    );
  }, [savedAssimilations]);

  // Save assimilation helper
  const saveAssimilation = (data) => {
    setSavedAssimilations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...data,
      },
    ]);
  };

  return (
    <ArcNContext.Provider
      value={{
        statusMessage,
        setStatusMessage,
        activePage,
        setActivePage,
        activeModule,
        setActiveModule,

        assimilationState,
        setAssimilationState,

        savedAssimilations,
        setSavedAssimilations,
        saveAssimilation,
      }}
    >
      {children}
    </ArcNContext.Provider>
  );
};
