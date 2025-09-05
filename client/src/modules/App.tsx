/**
 * App.tsx — Main React Application Shell
 * -----------------------------------------------------------------------------
 * WHAT:
 *   - Root component orchestrating the entire YouTube Sentiment Analyzer app.
 *   - Wires together input bar, filters, summary, charts, metrics, and tables.
 *
 * WHY:
 *   - Centralizes state management: comments, filters, progress, model, API key.
 *   - Provides data orchestration: fetching comments, computing scores, summaries.
 *   - Layout scaffold: header → analyze bar → filters → summary → dashboards → tables.
 *
 * NOTES:
 *   - Auto-summarization: triggered after comments load (via useEffect).
 *   - Progress API polled during comment fetch for realtime feedback.
 *   - Summary can be retriggered manually if needed.
 */

import React, { useMemo, useState, useEffect } from "react";

// Top bar + major panels
import { AnalyzeBar } from "./components/AnalyzeBar";
import { WeightsPanel } from "./components/WeightsPanel";
import { CommentsTable } from "./components/CommentsTable";
import { MetricsPanel } from "./components/MetricsPanel";
import { SentimentChart } from "./components/SentimentChart";
import { SentimentPie } from "./components/SentimentPie";
import { SummaryPanel } from "./components/SummaryPanel";
import { ExportPanel } from "./components/ExportPanel";
import { TimeSeriesChart } from "./components/TimeSeriesChart";
import { VideoMetaCard } from "./components/VideoMetaCard";
import { ThemeToggle } from "./components/ThemeToggle";
import { TopWords } from "./components/TopWords";
import { Leaderboard } from "./components/Leaderboard";
import { EvidenceModal } from "./components/EvidenceModal";

// Unified global filters (date/country/subs/likes/replies)
import { UnifiedFilters, type UnifiedFiltersState } from "./components/UnifiedFilters";

import { computeAdjustedScores, type ThreadItem } from "../utils/scoring";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Weights = { wComment: number; wLikes: number; wReplies: number };

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function App() {
  /* ----------------------------- Global State ----------------------------- */
  const [items, setItems] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string>("");

  // progress polling (pages, texts, scoring completion)
  const [progress, setProgress] = useState<{
    totalPages: number;
    fetchedPages: number;
    totalTexts: number;
    scoredTexts: number;
  } | null>(null);

  // summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // scoring weights + model settings
  const [weights, setWeights] = useState<Weights>({
    wComment: 1.0,
    wLikes: 0.7,
    wReplies: 1.0,
  });
  const [model, setModel] = useState<string>("vader");
  const [lastModelUsed, setLastModelUsed] = useState<string>("vader");
  const [apiKey, setApiKey] = useState<string>("");

  const [lastQuery, setLastQuery] = useState<string>("");

  // evidence modal for sample comments
  const [evidence, setEvidence] = useState<{
    open: boolean;
    title: string;
    items: Array<{ author: string; text: string; score?: number }>;
  }>({ open: false, title: "", items: [] });

  // modelDirty: tracks if a different model has been selected since scoring
  const modelDirty = !!items.length && model !== lastModelUsed;

  /* ------------------------------- Dates/Filters ------------------------------- */
  const allDates = useMemo(
    () =>
      items
        .map((i) => (i.publishedAt || "").slice(0, 10))
        .filter(Boolean)
        .sort(),
    [items]
  );
  const minDate = allDates[0] || "2006-01-01";
  const maxDate =
    allDates[allDates.length - 1] || new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState<UnifiedFiltersState>({
    from: minDate,
    to: maxDate,
    country: null,
    countryOptions: [],
    minSubs: "",
    maxSubs: "",
    minLikes: "",
    maxLikes: "",
    minReplies: "",
    maxReplies: "",
  });

  // update country filter options whenever items change
  useEffect(() => {
    const countries = Array.from(
      new Set(
        items
          .flatMap((i) => [
            i.authorCountry,
            ...(i.replies || []).map((r) => r.authorCountry),
          ])
          .filter(Boolean) as string[]
      )
    );
    setFilters((s) => ({ ...s, from: minDate, to: maxDate, countryOptions: countries }));
  }, [items, minDate, maxDate]);

  /* -------------------------- Progress Polling --------------------------- */
  useEffect(() => {
    if (!loading || !jobId) return;
    const t = setInterval(async () => {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE || "http://localhost:5177";
        const r = await fetch(
          `${API_BASE}/api/progress?jobId=${encodeURIComponent(jobId)}`
        );
        const p = await r.json();
        setProgress(p);
      } catch {
        // swallow network errors, continue polling
      }
    }, 500);
    return () => clearInterval(t);
  }, [loading, jobId]);

  /* ----------------------------- Data Fetching ----------------------------- */
  async function fetchComments(videoIdOrUrl: string) {
    setLoading(true);
    setError(null);
    setSummary(null); // reset summary for new video
    try {
      setLastQuery(videoIdOrUrl);
      const jid = Math.random().toString(36).slice(2);
      setJobId(jid);
      setProgress({
        totalPages: 0,
        fetchedPages: 0,
        totalTexts: 0,
        scoredTexts: 0,
      });

      const API_BASE =
        import.meta.env.VITE_API_BASE || "http://localhost:5177";
      const url = `${API_BASE}/api/comments_scored?videoId=${encodeURIComponent(
        videoIdOrUrl
      )}&model=${encodeURIComponent(model)}&jobId=${encodeURIComponent(jid)}`;

      const res = await fetch(url, {
        headers: apiKey ? { "X-API-Key": apiKey } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setItems(data.items);
      setLastModelUsed(model);
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary(texts: string[]) {
    if (!texts.length) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE || "http://localhost:5177";
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
        },
        body: JSON.stringify({ texts, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to summarize");
      setSummary(data.summary || "");
    } catch (e: any) {
      setSummaryError(e.message || "Failed to summarize");
    } finally {
      setSummaryLoading(false);
    }
  }

  /* -------------------------- Derived Data --------------------------- */
  const scoredAll = useMemo(
    () => computeAdjustedScores(items, weights),
    [items, weights]
  );

  const scoredWindowed = useMemo(() => {
    // apply date filters first
    const dateFiltered = scoredAll.filter((r) => {
      const d = (r.publishedAt || "").slice(0, 10);
      return (!filters.from || d >= filters.from) && (!filters.to || d <= filters.to);
    });

    // numeric filters
    const minSubs = filters.minSubs === "" ? -Infinity : Number(filters.minSubs);
    const maxSubs = filters.maxSubs === "" ? Infinity : Number(filters.maxSubs);
    const minLikes = filters.minLikes === "" ? -Infinity : Number(filters.minLikes);
    const maxLikes = filters.maxLikes === "" ? Infinity : Number(filters.maxLikes);
    const minReplies =
      filters.minReplies === "" ? -Infinity : Number(filters.minReplies);
    const maxReplies =
      filters.maxReplies === "" ? Infinity : Number(filters.maxReplies);

    return dateFiltered.filter((r) => {
      const passCountry = !filters.country || r.authorCountry === filters.country;

      const subs = r.authorSubscriberCount ?? -1;
      const passSubs =
        (subs === -1 && filters.minSubs === "" && filters.maxSubs === "") ||
        (subs >= minSubs && subs <= maxSubs);

      const likes = (r as any).likeCount ?? -1;
      const passLikes =
        (likes === -1 && filters.minLikes === "" && filters.maxLikes === "") ||
        (likes >= minLikes && likes <= maxLikes);

      const replies = (r as any).totalReplyCount ?? -1;
      const passReplies =
        (replies === -1 && filters.minReplies === "" && filters.maxReplies === "") ||
        (replies >= minReplies && replies <= maxReplies);

      return passCountry && passSubs && passLikes && passReplies;
    });
  }, [scoredAll, filters]);

  const allTexts = useMemo(
    () => [
      ...items.map((i) => i.textOriginal),
      ...items.flatMap((i) => i.replies?.map((r) => r.textOriginal) || []),
    ],
    [items]
  );

  // auto-trigger summary when comments finish loading
  useEffect(() => {
    if (!loading && items.length) {
      fetchSummary(allTexts);
    }
  }, [loading, items, allTexts]);

  // progress % for progress bar
  const progressPct =
    progress && progress.totalTexts > 0
      ? Math.floor((progress.scoredTexts / progress.totalTexts) * 100)
      : 0;
  const pageMsg = progress?.totalPages
    ? `page ${Math.min(progress.fetchedPages || 0, progress.totalPages)}/${progress.totalPages}`
    : progress?.fetchedPages
    ? `page ${progress.fetchedPages}`
    : "";

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="rounded-2xl p-6 header-grad text-white shadow flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          YouTube Comment Sentiment
        </h1>
        <div className="opacity-90">
          <ThemeToggle />
        </div>
      </header>

      {/* Input bar */}
      <AnalyzeBar
        model={model}
        onModelChange={setModel}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onAnalyze={fetchComments}
        loading={loading}
        modelDirty={modelDirty}
      />

      {/* Video metadata + filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        <div className="md:col-span-5">
          <div className="h-full">
            <VideoMetaCard videoIdOrUrl={lastQuery} />
          </div>
        </div>
        <div className="md:col-span-7">
          <UnifiedFilters
            className="h-full"
            value={filters}
            onDateChange={(from, to) => setFilters((s) => ({ ...s, from, to }))}
            onCountryChange={(country) => setFilters((s) => ({ ...s, country }))}
            onSubsChange={(min, max) =>
              setFilters((s) => ({ ...s, minSubs: min, maxSubs: max }))
            }
            onLikesChange={(min, max) =>
              setFilters((s) => ({ ...s, minLikes: min, maxLikes: max }))
            }
            onRepliesChange={(min, max) =>
              setFilters((s) => ({ ...s, minReplies: min, maxReplies: max }))
            }
            onClear={() =>
              setFilters((s) => ({
                ...s,
                from: minDate,
                to: maxDate,
                country: null,
                minSubs: "",
                maxSubs: "",
                minLikes: "",
                maxLikes: "",
                minReplies: "",
                maxReplies: "",
              }))
            }
          />
        </div>
      </div>

      {/* AI Summary — only show when not loading */}
      {!loading && (
        <SummaryPanel
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
          hasData={items.length > 0}
          onResummarize={() => fetchSummary(allTexts)}
        />
      )}

      {/* Main dashboard */}
      {loading ? (
        <>
          {/* Ghost loaders for skeleton state */}
          <div className="card card-ghost h-16 flex items-center px-4">
            {pageMsg ? (
              <span className="text-sm text-gray-200">Fetching {pageMsg}…</span>
            ) : null}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card card-ghost h-40"></div>
            <div className="card card-ghost h-40"></div>
            <div className="card card-ghost h-40"></div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="card card-ghost h-64"></div>
          </div>
          <div className="w-full h-2 bg-gray-800/40 rounded">
            <div
              className="h-2 bg-gradient-to-r from-red-500 via-fuchsia-500 to-indigo-600 rounded"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </>
      ) : (
        <>
          {/* KPIs and charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MetricsPanel
              rows={scoredWindowed as any}
              onEvidence={(type) => {
                const sample = scoredWindowed.slice(0, 10).map(r => ({
                  author: r.authorDisplayName,
                  text: r.textOriginal,
                  score: r.adjusted,
                }))
                setEvidence({ open: true, title: `Evidence: ${type}`, items: sample })
              }}
            />
            <SentimentPie rows={scoredWindowed as any} />
            <SentimentChart rows={scoredWindowed as any} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <TimeSeriesChart rows={scoredWindowed as any} />
          </div>
          <WeightsPanel weights={weights} onChange={setWeights} disabled={!items.length} />

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Comments + word analytics */}
          <CommentsTable rows={scoredWindowed as any} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopWords rows={scoredWindowed as any} />
            <Leaderboard rows={scoredWindowed as any} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExportPanel rows={scoredWindowed as any} />
          </div>
        </>
      )}

      {/* Evidence modal (sample comments) */}
      <EvidenceModal
        open={evidence.open}
        onClose={() => setEvidence({ ...evidence, open: false })}
        title={evidence.title}
        items={evidence.items}
      />
    </div>
  );
}