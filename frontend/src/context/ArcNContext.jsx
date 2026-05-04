// ============================================================
// ARC-NEXUS - GLOBAL CONTEXT PROVIDER
// File: src/context/ArcNContext.jsx
// Version: 002 (Disable Legacy Refinement + Stabilize Context)
// ============================================================

import React, { createContext, useState, useEffect } from "react";

export const ArcNContext = createContext();

export const ArcNProvider = ({ children }) => {
  // ============================================================
  // SYSTEM STATUS / NAVIGATION
  // ============================================================
  const [statusMessage, setStatusMessage] = useState("NEXIS ONLINE");
  const [activePage, setActivePage] = useState("nexus");
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    const storedPage = localStorage.getItem("arcn_active_page");
    const storedModule = localStorage.getItem("arcn_active_module");

    if (storedPage) setActivePage(storedPage);
    if (storedModule) setActiveModule(storedModule);
  }, []);

  useEffect(() => {
    if (activePage) {
      localStorage.setItem("arcn_active_page", activePage);
    }
  }, [activePage]);

  useEffect(() => {
    if (activeModule !== null) {
      localStorage.setItem("arcn_active_module", activeModule);
    }
  }, [activeModule]);

  // ============================================================
  // GLOBAL LOADING
  // ============================================================
  const [globalLoading, setGlobalLoading] = useState(false);

  const runWithGlobalLoading = async (fn) => {
    setGlobalLoading(true);

    try {
      await fn();
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    setGlobalLoading(false);
  }, []);

  // ============================================================
  // ASSIMILATION / COLLECT STATE
  // ============================================================
  const [assimilationState, setAssimilationState] = useState({
    inputType: "url",
    url: "",
    file: null,
    result: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem("arcn_assimilation_state");

    if (stored) {
      try {
        setAssimilationState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("arcn_assimilation_state");
      }
    }
  }, []);

  useEffect(() => {
    const safeState = {
      ...assimilationState,
      file: null,
    };

    localStorage.setItem(
      "arcn_assimilation_state",
      JSON.stringify(safeState)
    );
  }, [assimilationState]);

  // ============================================================
  // SAVED ASSIMILATIONS
  // ============================================================
  const [savedAssimilations, setSavedAssimilations] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("arcn_saved_assimilations");

    if (stored) {
      try {
        setSavedAssimilations(JSON.parse(stored));
      } catch {
        localStorage.removeItem("arcn_saved_assimilations");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "arcn_saved_assimilations",
      JSON.stringify(savedAssimilations)
    );
  }, [savedAssimilations]);

  const saveAssimilation = (data) => {
    setSavedAssimilations((prev) => [
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...data,
      },
      ...prev,
    ]);
  };

  // ============================================================
  // RECONSTRUCTION / UNDERSTAND STATE
  // ============================================================
  const [reconstructionState, setReconstructionState] = useState({
    input: "",
    output: "",

    preset: "explained",
    action: "summarize",
    selectedOption: "Short",

    refinementText: "",
    originalOutputBeforeRefine: null,
    refining: false,
    error: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem("arcn_reconstruction_state");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        setReconstructionState((prev) => ({
          ...prev,
          ...parsed,
          preset: parsed.preset || "explained",
          action: parsed.action || "summarize",
          selectedOption: parsed.selectedOption || parsed.option || "Short",
        }));
      } catch {
        localStorage.removeItem("arcn_reconstruction_state");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "arcn_reconstruction_state",
      JSON.stringify(reconstructionState)
    );
  }, [reconstructionState]);

  // ============================================================
  // SAVED RECONSTRUCTIONS
  // ============================================================
  const [savedReconstructions, setSavedReconstructions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("arcn_saved_reconstructions");

    if (stored) {
      try {
        setSavedReconstructions(JSON.parse(stored));
      } catch {
        localStorage.removeItem("arcn_saved_reconstructions");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "arcn_saved_reconstructions",
      JSON.stringify(savedReconstructions)
    );
  }, [savedReconstructions]);

  const saveReconstruction = (item) => {
    setSavedReconstructions((prev) => [
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...item,
      },
      ...prev,
    ]);
  };

  // ============================================================
  // REFINEMENT HELPERS
  // Disabled until refinement is rebuilt under the NEXIS route model.
  // ============================================================
  const setReconstructionRefinementText = (text) => {
    setReconstructionState((prev) => ({
      ...prev,
      refinementText: text,
    }));
  };

  const refineReconstructionOutput = async () => {
    setReconstructionState((prev) => ({
      ...prev,
      refining: false,
      error: "Refinement is not available in this version.",
    }));
  };

  const keepRefinedReconstructionOutput = () => {
    setReconstructionState((prev) => ({
      ...prev,
      originalOutputBeforeRefine: null,
      refinementText: "",
    }));
  };

  const revertReconstructionOutput = () => {
    setReconstructionState((prev) => ({
      ...prev,
      output: prev.originalOutputBeforeRefine ?? prev.output,
      originalOutputBeforeRefine: null,
      refinementText: "",
    }));
  };

  // ============================================================
  // CREATE STATE
  // ============================================================
  const [createState, setCreateState] = useState({
    input: "",
    output: "",
    mode: "script",
    option: "Medium",
    savedCreations: [],
  });

  useEffect(() => {
    const stored = localStorage.getItem("arcn_create_state");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        setCreateState((prev) => ({
          ...prev,
          ...parsed,
          mode: parsed.mode || parsed.template || "script",
          option: parsed.option || parsed.style || "Medium",
        }));
      } catch {
        localStorage.removeItem("arcn_create_state");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("arcn_create_state", JSON.stringify(createState));
  }, [createState]);

  // ============================================================
  // PROVIDER EXPORT
  // ============================================================
  return (
    <ArcNContext.Provider
      value={{
        statusMessage,
        setStatusMessage,

        activePage,
        setActivePage,

        activeModule,
        setActiveModule,

        globalLoading,
        setGlobalLoading,
        runWithGlobalLoading,

        assimilationState,
        setAssimilationState,
        savedAssimilations,
        setSavedAssimilations,
        saveAssimilation,

        reconstructionState,
        setReconstructionState,
        savedReconstructions,
        setSavedReconstructions,
        saveReconstruction,

        setReconstructionRefinementText,
        refineReconstructionOutput,
        keepRefinedReconstructionOutput,
        revertReconstructionOutput,

        createState,
        setCreateState,
      }}
    >
      {children}
    </ArcNContext.Provider>
  );
};