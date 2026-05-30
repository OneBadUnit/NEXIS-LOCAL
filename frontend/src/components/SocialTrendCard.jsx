// ============================================================
// ARC-NEXUS — SOCIAL TREND CARD
// File: src/components/SocialTrendCard.jsx
// ============================================================
//
// Live no-key public sources:
//   RedditCard    — Reddit public JSON API (r/<subreddit>.json)
//   WikipediaCard — Wikimedia pageviews REST API (no key)
// ============================================================

import React, { useEffect, useState } from "react";

// ── Shared helpers ────────────────────────────────────────────

function StatusDot({ status }) {
  const color =
    status === "ready"   ? "#4ade80" :
    status === "loading" ? "#94a3b8" :
    status === "empty"   ? "#f59e0b" :
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <h3 style={{ margin: 0, padding: 0, border: "none" }}>{title}</h3>
      <StatusDot status={status} />
      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
        {statusLabel}
      </span>
    </div>
  );
}

// ── Reddit ────────────────────────────────────────────────────
// Props:
//   subreddit — e.g. "popular", "news", "worldnews"
//   label     — display name shown in the header (uppercased)

export function RedditCard({ subreddit = "popular", label = "Popular" }) {
  const [status, setStatus] = useState("loading");
  const [posts, setPosts]   = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `https://www.reddit.com/r/${subreddit}.json?limit=5&raw_json=1`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = (json?.data?.children || []).map((c) => ({
          title:    c.data?.title || "Untitled",
          sub:      c.data?.subreddit_name_prefixed || "",
          score:    c.data?.score ?? 0,
          comments: c.data?.num_comments ?? 0,
          url:      c.data?.permalink
                      ? `https://www.reddit.com${c.data.permalink}`
                      : null,
        }));
        if (!cancelled) {
          setPosts(items);
          setStatus(items.length > 0 ? "ready" : "empty");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [subreddit]);

  const statusLabel =
    status === "ready"   ? `r/${subreddit}` :
    status === "loading" ? "Loading…"        :
    status === "empty"   ? "No data"         :
                           "Unavailable";

  return (
    <div className="panel">
      <CardHeader
        title={`REDDIT — ${label.toUpperCase()}`}
        status={status}
        statusLabel={statusLabel}
      />

      {status === "loading" && (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>Fetching posts…</p>
      )}
      {status === "error" && (
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
          Could not reach Reddit.
        </p>
      )}
      {status === "empty" && (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>No posts returned.</p>
      )}
      {status === "ready" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((p, i) => (
            <div
              key={i}
              style={{ borderLeft: "2px solid rgba(255,120,60,0.5)", paddingLeft: 8 }}
            >
              {p.url ? (
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
              ) : (
                <span style={{ fontSize: "0.8rem", wordBreak: "break-word", lineHeight: 1.35 }}>
                  {p.title}
                </span>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: "0.67rem", color: "rgba(255,120,60,0.7)" }}>{p.sub}</span>
                <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.3)" }}>
                  ▲ {p.score.toLocaleString()} · {p.comments.toLocaleString()} comments
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wikipedia Most Viewed ─────────────────────────────────────
// Endpoint: https://wikimedia.org/api/rest_v1/metrics/pageviews/top/
//           en.wikipedia/all-access/{YYYY}/{MM}/{DD}
// No key required. CORS enabled by the Wikimedia Foundation.
// Uses yesterday's date (today's data is typically not yet available).

const WIKI_SKIP = /^(Main_Page|Special:|Wikipedia:|Portal:|Help:|File:)/i;

function yesterdayParts() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return { yyyy, mm, dd };
}

export function WikipediaCard() {
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
    <div className="panel">
      <CardHeader title="WIKIPEDIA TRENDING" status={status} statusLabel={statusLabel} />

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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pages.map((p, i) => (
            <div
              key={i}
              style={{ borderLeft: "2px solid rgba(160,160,255,0.45)", paddingLeft: 8 }}
            >
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
