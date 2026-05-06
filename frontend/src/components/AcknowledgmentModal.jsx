import React, { useState, useEffect, useRef } from "react";

const ACK_VERSION = "1.0.7";
const STORAGE_KEY = "arcn_ack_version";

export default function AcknowledgmentModal({ onAcknowledge }) {
  const [canAcknowledge, setCanAcknowledge] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      if (atBottom) setCanAcknowledge(true);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAcknowledge = () => {
    // If user checked the box -> store version -> hide until updated
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, ACK_VERSION);
    }
    // If user did NOT check the box -> remove version -> always show next restart
    else {
      localStorage.removeItem(STORAGE_KEY);
    }

    onAcknowledge();
  };

  return (
    <div className="ack-overlay">
      <div className="ack-modal">
        <div className="ack-scroll" ref={scrollRef}>
          <h2>Welcome to NEXIS</h2>

          <p>
            NEXIS is a workspace for collecting, organizing, converting, and refining
            information into usable content.
          </p>
          <p>
            Use NEXIS to bring raw sources into one project, select what matters, and
            create structured outputs you can review, copy, refine, and reuse.
          </p>

          <hr />

          <h3>Important Notes</h3>

          <h4>Collect</h4>
          <ul>
            <li>Add URLs, files, or images as raw sources.</li>
            <li>Extraction quality depends on the source format and file quality.</li>
            <li>Large or unusual files may take longer to process.</li>
          </ul>

          <h4>Create &amp; Refine</h4>
          <ul>
            <li>NEXIS helps structure and transform your selected information.</li>
            <li>Outputs should be reviewed for accuracy before use.</li>
            <li>AI-generated content can contain mistakes.</li>
          </ul>

          <h4>Models &amp; API Use</h4>
          <ul>
            <li>NEXIS can be configured to use a local model or your own API key.</li>
            <li>You control the model connection you choose.</li>
            <li>Performance depends on your selected model, hardware, and input size.</li>
          </ul>

          <h4>Saved Work</h4>
          <ul>
            <li>Projects, raw inputs, and outputs are saved to your account/workspace.</li>
            <li>Plan limits may apply to projects, saved items, and monthly actions.</li>
          </ul>

          <h4>General</h4>
          <ul>
            <li>
              Do not upload sensitive information unless you are comfortable using it
              with your selected model or API provider.
            </li>
            <li>Check important work before relying on it.</li>
          </ul>

          <hr />

          <h3>Version &amp; Build Info</h3>
          <ul>
            <li>Product: NEXIS</li>
            <li>Version: {ACK_VERSION}</li>
            <li>Build: Beta</li>
          </ul>

          <p>
            <strong>
              By clicking Acknowledge, you confirm you have read and understand these notes.
            </strong>
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            Don't show again until updated
          </label>
        </div>

        <button
          className="ack-button"
          disabled={!canAcknowledge}
          onClick={handleAcknowledge}
        >
          Acknowledge
        </button>
      </div>

      <style>{`
        .ack-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .ack-modal {
          width: min(62vw, 560px);
          max-height: 80vh;
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: rgba(255, 255, 255, 0.85);
          padding: 32px 28px 24px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
        }

        .ack-modal h2 {
          margin: 0 0 16px;
          font-size: 1.25rem;
          font-weight: 700;
          color: #e2e8f0;
        }

        .ack-modal h3 {
          margin: 20px 0 10px;
          font-size: 0.95rem;
          font-weight: 700;
          color: rgba(56, 189, 248, 0.85);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ack-modal h4 {
          margin: 14px 0 6px;
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .ack-modal p {
          margin: 0 0 12px;
          font-size: 0.88rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.65);
        }

        .ack-modal ul {
          margin: 0 0 8px;
          padding-left: 20px;
        }

        .ack-modal li {
          margin-bottom: 5px;
          font-size: 0.86rem;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.6);
        }

        .ack-modal strong {
          color: rgba(255, 255, 255, 0.8);
        }

        .ack-modal hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin: 20px 0;
        }

        .ack-modal label {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ack-modal input[type="checkbox"] {
          accent-color: #38bdf8;
          flex-shrink: 0;
        }

        .ack-scroll {
          overflow-y: auto;
          padding-right: 10px;
          margin-bottom: 20px;
          flex: 1;
        }

        .ack-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .ack-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .ack-scroll::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.25);
          border-radius: 4px;
        }

        .ack-button {
          all: unset;
          cursor: not-allowed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.18);
          color: rgba(125, 211, 252, 0.35);
          transition: opacity 0.15s, background 0.15s, color 0.15s, border-color 0.15s;
          box-sizing: border-box;
          width: 100%;
        }

        .ack-button:enabled {
          cursor: pointer;
          background: rgba(56, 189, 248, 0.18);
          border-color: rgba(56, 189, 248, 0.45);
          color: #7dd3fc;
        }

        .ack-button:enabled:hover {
          background: rgba(56, 189, 248, 0.26);
        }
      `}</style>
    </div>
  );
}