import React, { useState, useEffect, useRef } from "react";

const ACK_VERSION = "1.0.6";
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
    // If user checked the box → store version → hide until updated
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, ACK_VERSION);
    } 
    // If user did NOT check the box → remove version → always show next restart
    else {
      localStorage.removeItem(STORAGE_KEY);
    }

    onAcknowledge();
  };

  return (
    <div className="ack-overlay">
      <div className="ack-modal">
        <div className="ack-scroll" ref={scrollRef}>
          <h2>Welcome! And thank you for trying ARC NEXUS.</h2>

          <p>
            What began as a small personal tool gradually grew into a more capable
            workspace for information in a cleaner, more intentional way.
            ARC NEXUS wasn’t built from a master plan; it evolved step by step into
            something I hope you’ll find useful.
          </p>

          <p>Before you begin, here are a few notes to help you get oriented.</p>

          <p><strong>~Unit</strong></p>

          <hr />

          <h3>Important Notes</h3>

          <h4>Assimilation</h4>
          <ul>
            <li>Runs locally and saves each result as a card in your browser.</li>
            <li>
              Extraction is generally fast. Some files may need to be re‑saved before
              uploading, especially older PDFs or documents with unusual formatting.
            </li>
            <li>OCR accuracy depends on image quality.</li>
          </ul>

          <h4>Reconstruction</h4>
          <ul>
            <li>
              Uses a local language model and is optimized for GPU acceleration; it will
              still run on CPU, but processing will be slower, especially with larger
              inputs or complex transformations.
            </li>
            <li>
              If Reconstruction returns an empty result, try reducing the input size or
              removing unusual characters.
            </li>
            <li>Very large documents may need to be processed in smaller sections.</li>
          </ul>

          <h4>Creation</h4>
          <ul>
            <li>Accepts manually copied and pasted content from your saved items or any other source.</li>
            <li>Performance depends on the size and complexity of the text you provide.</li>
          </ul>

          <h4>General</h4>
          <ul>
            <li>ARC NEXUS runs entirely on your device. Nothing is transmitted externally.</li>
            <li>Saved items remain in your browser until you delete them.</li>
            <li>Review all outputs for accuracy.</li>
          </ul>

          <hr />

          <h3>Version & Build Info</h3>
          <ul>
            <li>Version: 1.0.6</li>
            <li>Build Date: [04/20/26]</li>
            <li>Model: Local LLM (GPU‑optimized)</li>
          </ul>

          <p>
            <strong>
              By clicking Acknowledge, you confirm you’ve read and understood the notes above.
            </strong>
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            Don’t show again until updated
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
          background: rgba(91, 206, 14, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .ack-modal {
          width: 60vw;
          max-height: 80vh;
          background: #111;
          color: #eee;
          padding: 24px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }

        .ack-scroll {
          overflow-y: auto;
          padding-right: 12px;
          margin-bottom: 16px;
        }

        .ack-button {
          padding: 12px 20px;
          background: #444;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          opacity: 0.5;
        }

        .ack-button:enabled {
          opacity: 1;
          background: #0af;
        }
      `}</style>
    </div>
  );
}
