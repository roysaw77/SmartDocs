import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);

  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const debounceTimer = useRef(null);

  // ── Mirror textarea scroll so ghost text stays aligned ──────────────────
  const syncScroll = () => {
    if (mirrorRef.current && textareaRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // ── Fetch suggestion (debounced, fires after space) ──────────────────────
  const fetchSuggestion = useCallback(async (currentText) => {
    if (!currentText || !currentText.endsWith(" ")) return;
    setIsFetchingSuggestion(true);
    try {
      const res = await fetch("http://localhost:8000/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText.slice(-200) }),
      });
      const data = await res.json();
      setSuggestion(data.result || "");
    } catch (err) {
      console.error(err);
      setSuggestion("");
    } finally {
      setIsFetchingSuggestion(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    if (!text || !text.endsWith(" ")) {
      setSuggestion("");
      return;
    }
    debounceTimer.current = setTimeout(() => fetchSuggestion(text), 420);
    return () => clearTimeout(debounceTimer.current);
  }, [text, fetchSuggestion]);

  // ── Tab → accept ghost text ───────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setText((prev) => prev + suggestion + " ");
      setSuggestion("");
    }
    if (e.key === "Escape") {
      setSuggestion("");
    }
  };

  // ── Summarise ────────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSummary("");
    try {
      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setSummary(data.result || "No result returned.");
    } catch (err) {
      setSummary("❌ Error: " + err.message);
    }
    setLoading(false);
  };

  // ── Escape HTML for the mirror div ──────────────────────────────────────
  const escape = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

  const mirrorHTML =
    escape(text) +
    (suggestion
      ? `<span class="ghost-suggestion">${escape(suggestion)}</span>`
      : "");

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="logo-badge">✦</div>
        <div>
          <h1 className="app-title">SmartDoc</h1>
          <p className="app-subtitle">AI-powered writing assistant</p>
        </div>
      </header>

      <main className="app-main">
        {/* ── Editor card ── */}
        <section className="card editor-card">
          <div className="card-header">
            <span className="card-label">✍️ Document Editor</span>
            {suggestion && (
              <span className="hint-badge">
                <kbd>Tab</kbd> to accept · <kbd>Esc</kbd> to dismiss
              </span>
            )}
            {isFetchingSuggestion && (
              <span className="hint-badge fetching">✦ thinking…</span>
            )}
          </div>

          {/* Ghost-text wrapper */}
          <div className="ghost-wrapper">
            {/* Mirror layer — shows text + faded suggestion */}
            <div
              ref={mirrorRef}
              className="ghost-mirror"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: mirrorHTML }}
            />
            {/* Actual editable textarea on top */}
            <textarea
              ref={textareaRef}
              id="doc-editor"
              className="ghost-textarea"
              placeholder="Start typing your document…"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                syncScroll();
              }}
              onKeyDown={handleKeyDown}
              onScroll={syncScroll}
              spellCheck
            />
          </div>

          <div className="editor-footer">
            <span className="word-count">
              {text.trim() ? text.trim().split(/\s+/).length : 0} words
            </span>
            <button
              id="summarize-btn"
              className="btn btn-primary"
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Summarising…
                </>
              ) : (
                <>✦ Summarise</>
              )}
            </button>
          </div>
        </section>

        {/* ── Summary card ── */}
        {(summary || loading) && (
          <section className="card summary-card">
            <div className="card-header">
              <span className="card-label">📋 Summary</span>
            </div>
            {loading ? (
              <div className="skeleton-wrap">
                <div className="skeleton" />
                <div className="skeleton" style={{ width: "80%" }} />
                <div className="skeleton" style={{ width: "60%" }} />
              </div>
            ) : (
              <p className="summary-text">{summary}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;