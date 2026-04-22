// ============================================================
// ARC NEXUS — GLOBAL CONTEXT PROVIDER
// Global navigation, status, and per-module persistent state.
// ============================================================

import React, { createContext, useState, useEffect } from "react";

export const ArcNContext = createContext();

export const ArcNProvider = ({ children }) => {

  // ============================================================
  // SYSTEM STATUS / NAVIGATION (PERSISTENT)
  // ============================================================
  const [statusMessage, setStatusMessage] = useState("NEXUS ONLINE");
  const [activePage, setActivePage] = useState("Landing");
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    const storedPage = localStorage.getItem("arcn_active_page");
    const storedModule = localStorage.getItem("arcn_active_module");
    if (storedPage) setActivePage(storedPage);
    if (storedModule) setActiveModule(storedModule);
  }, []);

  useEffect(() => {
    if (activePage) localStorage.setItem("arcn_active_page", activePage);
  }, [activePage]);

  useEffect(() => {
    if (activeModule !== null)
      localStorage.setItem("arcn_active_module", activeModule);
  }, [activeModule]);

  // ============================================================
  // GLOBAL LOADING SPINNER (NEW)
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
  // SAFETY RESET — prevents permanent UI lock
useEffect(() => {
  setGlobalLoading(false);
}, []);


  // ============================================================
  // ASSIMILATION — WORKING STATE (PERSISTENT)
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
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "arcn_assimilation_state",
      JSON.stringify(assimilationState)
    );
  }, [assimilationState]);

  // ============================================================
  // ASSIMILATION — SAVED RESULTS (PERSISTENT)
  // ============================================================
  const [savedAssimilations, setSavedAssimilations] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("arcn_saved_assimilations");
    if (stored) {
      try {
        setSavedAssimilations(JSON.parse(stored));
      } catch {}
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
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...data,
      },
    ]);
  };

  // ============================================================
  // RECONSTRUCTION — WORKING STATE (PERSISTENT)
  // ============================================================
  const [reconstructionState, setReconstructionState] = useState({
    input: "",
    output: "",
    selectedTool: "",
    selectedOption: "",

    refinementText: "",
    originalOutputBeforeRefine: null,
    refining: false,
    error: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem("arcn_reconstruction_state");
    if (stored) {
      try {
        setReconstructionState(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "arcn_reconstruction_state",
      JSON.stringify(reconstructionState)
    );
  }, [reconstructionState]);

  // ============================================================
  // RECONSTRUCTION — SAVED ITEMS (PERSISTENT)
  // ============================================================
  const [savedReconstructions, setSavedReconstructions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("arcn_saved_reconstructions");
    if (stored) {
      try {
        setSavedReconstructions(JSON.parse(stored));
      } catch {}
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
  // RECONSTRUCTION — REFINEMENT HELPERS
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
      refining: true,
      error: null,
      originalOutputBeforeRefine:
        prev.originalOutputBeforeRefine ?? prev.output,
    }));

    try {
      const res = await fetch("http://localhost:8000/reconstruction/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: reconstructionState.output,
          instruction: reconstructionState.refinementText,
        }),
      });

      if (!res.ok) throw new Error("Refinement failed");

      const data = await res.json();

      setReconstructionState((prev) => ({
        ...prev,
        output: data.refinedText,
        refining: false,
      }));
    } catch (err) {
      setReconstructionState((prev) => ({
        ...prev,
        refining: false,
        error: err.message || "Refinement error",
      }));
    }
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
  // CREATE — WORKING STATE (PERSISTENT)
  // ============================================================
  const [createState, setCreateState] = useState({
    input: "",
    output: "",
    template: "",
    style: "",
    savedCreations: [],
  });

  useEffect(() => {
    const stored = localStorage.getItem("arcn_create_state");
    if (stored) {
      try {
        setCreateState(JSON.parse(stored));
      } catch {}
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

        // GLOBAL LOADING (NEW)
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
