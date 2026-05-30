// ============================================================
// ARC-NEXUS — WIKIPEDIA SIGNAL CARDS
// File: src/components/WikipediaSignalCard.jsx
// ============================================================
//
// Public no-key Wikimedia API cards for the NEXIS dashboard.
//   WikipediaMostViewed    — yesterday's most viewed en.wikipedia pages
//   WikipediaWatchlist     — per-article daily views for tracked topics
//   WikipediaCurrentEvents — link to the Wikipedia Current Events portal
//   WikipediaAegisTopics   — placeholder (future AEGIS topic linkage)
//
// All endpoints are CORS-enabled by the Wikimedia Foundation.
// No API key, no login, no configuration required.
// ============================================================

import React, { useEffect, useState } from "react";
import { fetchConsensus } from "../api/aegis.js";

// ── Shared helpers ────────────────────────────────────────────

function StatusDot({ status }) {
  const color =
    status === "ready"   ? "#4ade80" :
    status === "loading" ? "#94a3b8" :
    status === "empty"   ? "#f59e0b" :
    status === "info"    ? "#38bdf8" :
                           "#ef4444";
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function CardHeader({ title, status, statusLabel }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}
    >
      <h3 style={{ margin: 0, padding: 0, border: "none" }}>{title}</h3>
      <StatusDot status={status} />
      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
        {statusLabel}
      </span>
    </div>
  );
}

// ── Date helpers ──────────────────────────────────────────────

function yesterdayParts() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return {
    yyyy: d.getFullYear(),
    mm:   String(d.getMonth() + 1).padStart(2, "0"),
    dd:   String(d.getDate()).padStart(2, "0"),
  };
}

function yesterdayDateStr() {
  const { yyyy, mm, dd } = yesterdayParts();
  return `${yyyy}${mm}${dd}`;
}

// ── System page filter ────────────────────────────────────────

const WIKI_SKIP = /^(Main_Page|Special:|Wikipedia:|Portal:|Help:|File:|Template:|Category:)/i;

// ── WikipediaMostViewed ───────────────────────────────────────
// Endpoint: https://wikimedia.org/api/rest_v1/metrics/pageviews/top/
//           en.wikipedia/all-access/{YYYY}/{MM}/{DD}
// Returns top 5 viewed pages filtered of system/meta pages.

export function WikipediaMostViewed() {
  const [status, setStatus]       = useState("loading");
  const [pages, setPages]         = useState([]);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { yyyy, mm, dd } = yesterdayParts();
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${yyyy}/${mm}/${dd}`;
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const raw = json?.items?.[0]?.articles || [];
        const filtered = raw
          .filter((a) => !WIKI_SKIP.test(a.article))
          .slice(0, 5)
          .map((a) => ({
            title: a.article.replace(/_/g, " "),
            views: a.views ?? 0,
            url:   `https://en.wikipedia.org/wiki/${encodeURIComponent(a.article)}`,
          }));
        if (!cancelled) {
          setPages(filtered);
          setDateLabel(`${yyyy}-${mm}-${dd}`);
          setStatus(filtered.length > 0 ? "ready" : "empty");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statusLabel =
    status === "ready"   ? `en.wikipedia · ${dateLabel}` :
    status === "loading" ? "Loading…"                     :
    status === "empty"   ? "No data"                      :
                           "Unavailable";

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
      <CardHeader title="WIKIPEDIA MOST VIEWED" status={status} statusLabel={statusLabel} />
      {status === "loading" && (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>Fetching most viewed pages…</p>
      )}
      {status === "error" && (
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
          Could not reach Wikimedia API.
        </p>
      )}
      {status === "empty" && (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>No page data returned.</p>
      )}
      {status === "ready" && (
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {pages.map((p, i) => (
            <div key={i} style={{ borderLeft: "2px solid rgba(160,160,255,0.45)", paddingLeft: 8 }}>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--arc-text)",
                  textDecoration: "none",
                  display: "block",
                  wordBreak: "break-word",
                  lineHeight: 1.35,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--arc-accent, #00FF41)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--arc-text)")}
              >
                {p.title}
              </a>
              <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.3)" }}>
                {p.views.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WikipediaWatchlist ────────────────────────────────────────
// Tracks a built-in list of globally-relevant Wikipedia articles.
// Fetches per-article daily view counts in parallel for yesterday.
// Endpoint: https://wikimedia.org/api/rest_v1/metrics/pageviews/
//   per-article/en.wikipedia/all-access/all-agents/{article}/daily/{date}/{date}
// Uses Promise.allSettled — individual article failures degrade gracefully.

const WATCHLIST = [
  { key: "Iran",                       label: "Iran" },
  { key: "Israel",                     label: "Israel" },
  { key: "Taiwan",                     label: "Taiwan" },
  { key: "Ukraine",                    label: "Ukraine" },
  { key: "China",                      label: "China" },
  { key: "Ebola_virus_disease",        label: "Ebola" },
  { key: "Donald_Trump",               label: "Donald Trump" },
  { key: "World_Health_Organization",  label: "World Health Org." },
];

export function WikipediaWatchlist() {
  const [status, setStatus] = useState("loading");
  const [items, setItems]   = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const dateStr = yesterdayDateStr();
      const results = await Promise.allSettled(
        WATCHLIST.map(({ key }) =>
          fetch(
            `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(key)}/daily/${dateStr}/${dateStr}`,
            { headers: { Accept: "application/json" } }
          ).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        )
      );

      if (cancelled) return;

      const mapped = WATCHLIST.map(({ key, label }, i) => {
        const result = results[i];
        const views =
          result.status === "fulfilled"
            ? (result.value?.items?.[0]?.views ?? 0)
            : null;
        return { key, label, views };
      });

      // Sort by views descending; nulls (fetch failed) at the bottom
      mapped.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
      setItems(mapped);
      setStatus("ready");
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="WIKIPEDIA WATCHLIST"
        status={status}
        statusLabel={status === "loading" ? "Loading…" : "yesterday · views"}
      />
      {status === "loading" && (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>Fetching watchlist views…</p>
      )}
      {status === "ready" && (
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {items.map(({ key, label, views }) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
            >
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(key)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.82rem",
                  color: "var(--arc-text)",
                  textDecoration: "none",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--arc-accent, #00FF41)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--arc-text)")}
              >
                {label}
              </a>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: views != null ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              >
                {views != null ? views.toLocaleString() : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WikipediaCurrentEvents ────────────────────────────────────
// The Wikipedia Current Events portal is updated daily by editors.
// No structured no-scrape API exists for this portal — this card
// provides a direct link and description.

export function WikipediaCurrentEvents() {
  return (
    <div className="panel">
      <CardHeader
        title="WIKIPEDIA CURRENT EVENTS"
        status="info"
        statusLabel="portal link"
      />
      <p style={{ fontSize: "0.85rem", marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>
        Wikipedia's Current Events portal is updated daily with news summaries, sourced article links, and ongoing story threads — covering politics, conflicts, science, and world events.
      </p>
      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: 0, marginBottom: 14 }}>
        No structured API is available for this portal. Data is only accessible through the wiki page directly.
      </p>
      <a
        href="https://en.wikipedia.org/wiki/Portal:Current_events"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          padding: "5px 14px",
          background: "rgba(160,160,255,0.12)",
          border: "1px solid rgba(160,160,255,0.3)",
          color: "#a0a0ff",
          borderRadius: 5,
          textDecoration: "none",
          fontSize: "0.82rem",
          fontWeight: 600,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(160,160,255,0.22)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(160,160,255,0.12)"; }}
      >
        Open Current Events →
      </a>
    </div>
  );
}

// ── WikipediaAegisTopics ──────────────────────────────────────

// Sanitize an AEGIS topic label into a Wikipedia article key.
// e.g. "united states election" → "United_States_Election"
function topicToWikiKey(topic) {
  return topic
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("_");
}

export function WikipediaAegisTopics() {
  const [status, setStatus] = useState("loading");
  const [items, setItems]   = useState([]);
  const [aegisErr, setAegisErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // 1. Fetch latest AEGIS consensus
      const consensus = await fetchConsensus();
      if (cancelled) return;

      if (!consensus || !consensus.clusters || consensus.clusters.length === 0) {
        if (!cancelled) {
          setAegisErr(consensus === null ? "AEGIS unavailable" : "No scan data yet");
          setStatus("empty");
        }
        return;
      }

      // 2. Extract top 5 cluster topics (use `topic` field)
      const topTopics = consensus.clusters
        .slice(0, 5)
        .map((c) => c.topic || c.label || "")
        .filter(Boolean);

      if (topTopics.length === 0) {
        if (!cancelled) { setAegisErr("No topics in scan"); setStatus("empty"); }
        return;
      }

      // 3. Fetch Wikimedia pageviews for each topic in parallel
      const dateStr = yesterdayDateStr();
      const results = await Promise.allSettled(
        topTopics.map((topic) => {
          const key = topicToWikiKey(topic);
          return fetch(
            `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(key)}/daily/${dateStr}/${dateStr}`,
            { headers: { Accept: "application/json" } }
          ).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
        })
      );

      if (cancelled) return;

      const mapped = topTopics.map((topic, i) => {
        const result  = results[i];
        const wikiKey = topicToWikiKey(topic);
        const views   =
          result.status === "fulfilled"
            ? (result.value?.items?.[0]?.views ?? null)
            : null;
        return {
          topic,
          wikiKey,
          views,
          matched: result.status === "fulfilled",
        };
      });

      setItems(mapped);
      setStatus("ready");
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statusLabel =
    status === "loading" ? "Loading…"         :
    status === "empty"   ? (aegisErr || "No data") :
    status === "error"   ? "Error"             :
                           "yesterday · views";

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="WIKIPEDIA · AEGIS TOPICS"
        status={status === "ready" ? "ready" : status === "loading" ? "loading" : "empty"}
        statusLabel={statusLabel}
      />
      {status === "loading" && (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>Fetching AEGIS topics…</p>
      )}
      {status === "empty" && (
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {aegisErr === "AEGIS unavailable"
            ? "AEGIS is not running. Start AEGIS to see topic data here."
            : aegisErr || "No AEGIS scan data available."}
        </p>
      )}
      {status === "ready" && (
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(({ topic, wikiKey, views, matched }) => (
            <div
              key={wikiKey}
              style={{ borderLeft: `2px solid ${matched ? "rgba(160,160,255,0.45)" : "rgba(255,255,255,0.12)"}`, paddingLeft: 8 }}
            >
              {matched ? (
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(wikiKey)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--arc-text)",
                    textDecoration: "none",
                    display: "block",
                    wordBreak: "break-word",
                    lineHeight: 1.35,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--arc-accent, #00FF41)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--arc-text)")}
                >
                  {topic}
                </a>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", wordBreak: "break-word", lineHeight: 1.35, display: "block" }}>
                  {topic}
                </span>
              )}
              <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.3)" }}>
                {matched && views != null
                  ? `${views.toLocaleString()} views`
                  : "No Wikipedia match"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
