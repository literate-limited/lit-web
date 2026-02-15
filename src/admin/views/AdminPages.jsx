import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePageRegistry } from "../../context/PageRegistryContext";
import { AdminContext } from "../../context/AdminContextProvider";
import ImagePickerModal from "../modals/ImagePickerModal";

const GLOBAL_STYLE_KEY = "global";
const COMMON_CATEGORIES = new Set(["public", "auth", "policy", "access", "onboarding"]);

const makeRowId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `row-${Math.random().toString(16).slice(2)}`;

const getTabForPage = (page) => {
  if (!page) return "user";
  if (
    page.category === "admin" ||
    page.id?.includes("admin") ||
    page.route?.includes("admin") ||
    page.route?.includes("dashboard")
  ) {
    return "admin";
  }
  if (COMMON_CATEGORIES.has(page.category)) return "common";
  return "user";
};

const matchesQuery = (page, query) => {
  if (!query) return true;
  const target = [
    page.name,
    page.route,
    page.layout,
    page.category,
    page.component,
    ...(page.components || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return target.includes(query);
};

const formatCategory = (value) =>
  value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export default function AdminPages() {
  const {
    pages,
    loading,
    error,
    palette,
    globalTokens,
    globalCustomCss,
    savePageBackground,
    savePageStyle,
    refreshPageStyles,
  } = usePageRegistry();
  const { fetchImages } = useContext(AdminContext);
  const [picker, setPicker] = useState(null); // { pageId, variant }
  const [savingPageId, setSavingPageId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [activeTab, setActiveTab] = useState("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const [globalDraft, setGlobalDraft] = useState({
    palette: palette || {},
    labels: globalTokens?.labels || {},
    colors: globalTokens?.colors || {},
    css: globalTokens?.css || {},
    customCss: globalCustomCss || "",
  });

  useEffect(() => {
    fetchImages?.();
  }, [fetchImages]);

  const pagesByTab = useMemo(() => {
    const grouped = { common: [], user: [], admin: [] };
    pages.forEach((page) => {
      grouped[getTabForPage(page)].push(page);
    });
    return grouped;
  }, [pages]);

  const tabCounts = useMemo(
    () => ({
      common: pagesByTab.common.length,
      user: pagesByTab.user.length,
      admin: pagesByTab.admin.length,
    }),
    [pagesByTab]
  );

  const tabs = useMemo(
    () => [
      {
        id: "common",
        label: "Common",
        hint: "Shared pages, global styling, and onboarding.",
        count: tabCounts.common,
      },
      {
        id: "user",
        label: "User",
        hint: "Learner and consumer-facing experiences.",
        count: tabCounts.user,
      },
      {
        id: "admin",
        label: "Admin",
        hint: "Staff-only tools and dashboards.",
        count: tabCounts.admin,
      },
    ],
    [tabCounts]
  );

  const filteredPages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = pagesByTab[activeTab] || [];
    return list.filter((page) => matchesQuery(page, query));
  }, [activeTab, pagesByTab, searchQuery]);

  const groupedPages = useMemo(() => {
    const groups = {};
    filteredPages.forEach((page) => {
      const key = page.category || "uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(page);
    });
    Object.values(groups).forEach((list) => {
      list.sort((a, b) => {
        if (a.layout === b.layout) return a.name.localeCompare(b.name);
        return a.layout.localeCompare(b.layout);
      });
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPages]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) || null,
    [pages, selectedPageId]
  );
  const selectedPageTab = useMemo(
    () => (selectedPage ? getTabForPage(selectedPage) : null),
    [selectedPage]
  );

  const currentBackground = useMemo(() => {
    if (!picker) return null;
    const page = pages.find((p) => p.id === picker.pageId);
    return picker.variant === "desktop"
      ? page?.backgrounds?.desktop
      : page?.backgrounds?.mobile;
  }, [picker, pages]);

  const globalDraftSnapshot = useMemo(
    () => ({
      palette: palette || {},
      labels: globalTokens?.labels || {},
      colors: globalTokens?.colors || {},
      css: globalTokens?.css || {},
      customCss: globalCustomCss || "",
    }),
    [palette, globalTokens, globalCustomCss]
  );

  useEffect(() => {
    setGlobalDraft(globalDraftSnapshot);
  }, [globalDraftSnapshot]);

  useEffect(() => {
    if (!selectedPage) return;
    setDrafts((prev) =>
      prev[selectedPage.id]
        ? prev
        : {
            ...prev,
            [selectedPage.id]: {
              labels: selectedPage.tokens?.labels || {},
              colors: selectedPage.tokens?.colors || {},
              css: selectedPage.tokens?.css || {},
              palette: selectedPage.palette || {},
              customCss: selectedPage.customCss || "",
            },
          }
    );
  }, [selectedPage]);

  const updateDraft = (pageId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        ...patch,
      },
    }));
  };

  const handleSaveStyle = async (pageId, draft) => {
    setSavingPageId(pageId);
    try {
      await savePageStyle(pageId, {
        palette: draft.palette || {},
        tokens: {
          labels: draft.labels || {},
          colors: draft.colors || {},
          css: draft.css || {},
        },
        customCss: draft.customCss || "",
      });
      await refreshPageStyles();
      toast.success(
        pageId === GLOBAL_STYLE_KEY
          ? "Saved global styles"
          : `Saved styles for ${pageId}`
      );
    } catch (err) {
      console.error("Failed to save styles", err);
      toast.error("Could not save styles. Please try again.");
    } finally {
      setSavingPageId(null);
    }
  };

  const resetDraft = (pageId) => {
    if (pageId === GLOBAL_STYLE_KEY) {
      setGlobalDraft(globalDraftSnapshot);
      return;
    }
    if (!selectedPage) return;
    updateDraft(pageId, {
      labels: selectedPage.tokens?.labels || {},
      colors: selectedPage.tokens?.colors || {},
      css: selectedPage.tokens?.css || {},
      palette: selectedPage.palette || {},
      customCss: selectedPage.customCss || "",
    });
  };

  const handleSelect = async (image) => {
    if (!picker) return;
    setSavingPageId(picker.pageId);
    try {
      const payload =
        picker.variant === "desktop"
          ? { desktopImageId: image?._id ?? null }
          : { mobileImageId: image?._id ?? null };

      await savePageBackground(picker.pageId, payload);
      await refreshPageStyles();
      toast.success(
        image
          ? `Saved ${picker.variant} background for ${picker.pageId}`
          : `Cleared ${picker.variant} background`
      );
      setPicker(null);
    } catch (err) {
      console.error("Failed to save background", err);
      toast.error("Could not save background. Please try again.");
    } finally {
      setSavingPageId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="lit-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2a1c0f]">UI</h1>
            <p className="text-sm text-[#2a1c0f]/80">
              Tune global tokens, then dive into page-level styling, labels, and backdrops.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="lit-badge">Total pages: {pages.length}</span>
            {loading && <span className="lit-badge">Loading backgrounds…</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#2a1c0f] text-[#f7efd8]"
                    : "border border-[#2a1c0f]/20 text-[#2a1c0f] hover:bg-[#2a1c0f]/10"
                }`}
              >
                {tab.label} <span className="ml-1 text-xs">({tab.count})</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search pages, routes, layouts…"
            className="min-w-[240px] rounded-full border border-[#2a1c0f]/20 bg-white/70 px-4 py-2 text-sm text-[#2a1c0f] focus:outline-none"
          />
        </div>

        <p className="text-xs text-[#2a1c0f]/70">
          {tabs.find((tab) => tab.id === activeTab)?.hint}
        </p>
      </div>

      {error && (
        <div className="lit-panel p-3 text-sm text-red-700">
          {error}. Backgrounds will use the default ember skin until this loads.
        </div>
      )}

      {activeTab === "common" && (
        <div className="lit-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#2a1c0f]">Global design tokens</h2>
              <p className="text-xs text-[#2a1c0f]/70">
                Applies across every page. Keys map to CSS variables like{" "}
                <span className="font-semibold">--lit-key</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => resetDraft(GLOBAL_STYLE_KEY)}
                className="px-4 py-2 text-sm rounded-full border border-[#2a1c0f]/20 text-[#2a1c0f] hover:bg-[#2a1c0f]/10"
                disabled={savingPageId === GLOBAL_STYLE_KEY}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleSaveStyle(GLOBAL_STYLE_KEY, globalDraft)}
                className="px-4 py-2 text-sm lit-cta"
                disabled={savingPageId === GLOBAL_STYLE_KEY}
              >
                {savingPageId === GLOBAL_STYLE_KEY ? "Saving…" : "Save global tokens"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <KeyValueEditor
              title="Palette"
              description="Core palette tokens used by the ember skin."
              value={globalDraft.palette}
              onChange={(next) => setGlobalDraft((prev) => ({ ...prev, palette: next }))}
              keyPlaceholder="background"
              valuePlaceholder="#0b0703"
            />
            <KeyValueEditor
              title="Labels"
              description="Text overrides keyed by translation IDs."
              value={globalDraft.labels}
              onChange={(next) => setGlobalDraft((prev) => ({ ...prev, labels: next }))}
              keyPlaceholder="header.welcome"
              valuePlaceholder="Welcome back"
            />
            <KeyValueEditor
              title="Colors"
              description="Additional color tokens (stored as CSS variables)."
              value={globalDraft.colors}
              onChange={(next) => setGlobalDraft((prev) => ({ ...prev, colors: next }))}
              keyPlaceholder="accentBright"
              valuePlaceholder="#ffcc66"
            />
            <KeyValueEditor
              title="CSS tokens"
              description="CSS variable overrides for global layout or effects."
              value={globalDraft.css}
              onChange={(next) => setGlobalDraft((prev) => ({ ...prev, css: next }))}
              keyPlaceholder="card-radius"
              valuePlaceholder="18px"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-[#2a1c0f]/60">
              Global custom CSS
            </label>
            <textarea
              value={globalDraft.customCss}
              onChange={(event) =>
                setGlobalDraft((prev) => ({ ...prev, customCss: event.target.value }))
              }
              placeholder=".lit-panel { box-shadow: ... }"
              className="min-h-[120px] w-full rounded-xl border border-[#2a1c0f]/15 bg-white/70 px-3 py-2 text-sm text-[#2a1c0f] focus:outline-none"
            />
          </div>
        </div>
      )}

      {groupedPages.length === 0 && (
        <div className="lit-panel p-4 text-sm text-[#2a1c0f]/70">
          No pages match this tab and search filter.
        </div>
      )}

      {groupedPages.map(([category, categoryPages]) => (
        <div key={category} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#2a1c0f]">
              {formatCategory(category)}
            </h2>
            <span className="lit-badge">{categoryPages.length} pages</span>
          </div>

          <div className="overflow-x-auto rounded-xl shadow-lg lit-panel">
            <table className="lit-table min-w-full">
              <thead>
                <tr>
                  <th className="w-32">Layout</th>
                  <th className="w-96">Page</th>
                  <th className="w-40 text-right">Manage</th>
                  <th className="text-right">Components</th>
                </tr>
              </thead>
              <tbody>
                {categoryPages.map((page) => (
                  <tr
                    key={page.id}
                    className={selectedPageId === page.id ? "bg-[#f3e7c3]/60" : ""}
                  >
                    <td className="font-semibold">{page.layout}</td>
                    <td>
                      <div className="font-semibold">{page.name}</div>
                      <div className="text-sm text-[#2a1c0f]/70">{page.route}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <BackgroundBadge label="Desktop" background={page.backgrounds?.desktop} />
                        <BackgroundBadge label="Mobile" background={page.backgrounds?.mobile} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setPicker({ pageId: page.id, variant: "desktop" })}
                          className="px-4 py-2 text-sm lit-cta"
                          disabled={savingPageId === page.id}
                        >
                          {savingPageId === page.id && picker?.variant === "desktop"
                            ? "Saving…"
                            : "Set desktop background"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPicker({ pageId: page.id, variant: "mobile" })}
                          className="px-4 py-2 text-sm lit-cta"
                          disabled={savingPageId === page.id}
                        >
                          {savingPageId === page.id && picker?.variant === "mobile"
                            ? "Saving…"
                            : "Set mobile background"}
                        </button>
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPageId(page.id)}
                        className="px-4 py-2 text-sm rounded-full border border-[#2a1c0f]/20 text-[#2a1c0f] hover:bg-[#2a1c0f]/10"
                      >
                        {selectedPageId === page.id ? "Editing" : "Edit styles"}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap gap-2 justify-end">
                        {(page.components || []).map((comp) => (
                          <span key={comp} className="lit-chip text-sm">
                            {comp}
                          </span>
                        ))}
                        {(!page.components || page.components.length === 0) && (
                          <span className="text-sm text-[#2a1c0f]/60">
                            No specific components listed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {selectedPage &&
        drafts[selectedPage.id] &&
        selectedPageTab === activeTab && (
          <div className="lit-panel p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#2a1c0f]">
                  {selectedPage.name} tokens
                </h2>
                <p className="text-xs text-[#2a1c0f]/70">
                  Overrides apply only to this page ({selectedPage.route}).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => resetDraft(selectedPage.id)}
                  className="px-4 py-2 text-sm rounded-full border border-[#2a1c0f]/20 text-[#2a1c0f] hover:bg-[#2a1c0f]/10"
                  disabled={savingPageId === selectedPage.id}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStyle(selectedPage.id, drafts[selectedPage.id])}
                  className="px-4 py-2 text-sm lit-cta"
                  disabled={savingPageId === selectedPage.id}
                >
                  {savingPageId === selectedPage.id ? "Saving…" : "Save page tokens"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <KeyValueEditor
                title="Labels"
                description="Text overrides keyed by translation IDs."
                value={drafts[selectedPage.id].labels}
                onChange={(next) => updateDraft(selectedPage.id, { labels: next })}
                keyPlaceholder="header.welcome"
                valuePlaceholder="Welcome back"
              />
              <KeyValueEditor
                title="Colors"
                description="Page-only color tokens (stored as CSS variables)."
                value={drafts[selectedPage.id].colors}
                onChange={(next) => updateDraft(selectedPage.id, { colors: next })}
                keyPlaceholder="accentBright"
                valuePlaceholder="#ffcc66"
              />
              <KeyValueEditor
                title="CSS tokens"
                description="CSS variable overrides for page layout or effects."
                value={drafts[selectedPage.id].css}
                onChange={(next) => updateDraft(selectedPage.id, { css: next })}
                keyPlaceholder="card-radius"
                valuePlaceholder="18px"
              />
              <KeyValueEditor
                title="Palette overrides"
                description="Optional palette overrides for this page."
                value={drafts[selectedPage.id].palette}
                onChange={(next) => updateDraft(selectedPage.id, { palette: next })}
                keyPlaceholder="background"
                valuePlaceholder="#0b0703"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[#2a1c0f]/60">
                Page custom CSS
              </label>
              <textarea
                value={drafts[selectedPage.id].customCss}
                onChange={(event) =>
                  updateDraft(selectedPage.id, { customCss: event.target.value })
                }
                placeholder={`[data-page-id="${selectedPage.id}"] .lit-panel { ... }`}
                className="min-h-[120px] w-full rounded-xl border border-[#2a1c0f]/15 bg-white/70 px-3 py-2 text-sm text-[#2a1c0f] focus:outline-none"
              />
            </div>
          </div>
        )}

      <ImagePickerModal
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        onSelect={handleSelect}
        currentImageId={currentBackground?.imageId}
        title={picker ? `Choose ${picker.variant} background` : "Choose background"}
        subtitle="Tap an image to use it as the backdrop for this page."
      />
    </div>
  );
}

function BackgroundBadge({ label, background }) {
  if (!background) {
    return (
      <div className="text-xs text-[#2a1c0f]/70">
        {label}: <span className="font-semibold">default skin</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold">{label}:</span>
      <span className="lit-chip">
        <span className="inline-block w-10 h-6 rounded overflow-hidden bg-black/10">
          <img
            src={background.url}
            alt={background.title || "background"}
            className="w-full h-full object-cover"
          />
        </span>
        <span className="text-xs">{background.title || "Image"}</span>
      </span>
    </div>
  );
}

function KeyValueEditor({
  title,
  description,
  value,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}) {
  const internalUpdateRef = useRef(false);
  const [rows, setRows] = useState(() =>
    Object.entries(value || {}).map(([key, val]) => ({
      id: makeRowId(),
      key,
      value: val,
    }))
  );

  useEffect(() => {
    if (internalUpdateRef.current) {
      internalUpdateRef.current = false;
      return;
    }
    setRows(
      Object.entries(value || {}).map(([key, val]) => ({
        id: makeRowId(),
        key,
        value: val,
      }))
    );
  }, [value]);

  const commit = (nextRows) => {
    internalUpdateRef.current = true;
    setRows(nextRows);
    const nextValue = {};
    nextRows.forEach((row) => {
      if (!row.key) return;
      nextValue[row.key] = row.value;
    });
    onChange(nextValue);
  };

  const updateRow = (id, patch) => {
    commit(
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    commit([...rows, { id: makeRowId(), key: "", value: "" }]);
  };

  const removeRow = (id) => {
    commit(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-[#2a1c0f]">{title}</p>
        {description && (
          <p className="text-xs text-[#2a1c0f]/70">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-xs text-[#2a1c0f]/60">No entries yet.</p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={row.key}
              onChange={(event) => updateRow(row.id, { key: event.target.value })}
              placeholder={keyPlaceholder}
              className="min-w-[180px] flex-1 rounded-lg border border-[#2a1c0f]/15 bg-white/80 px-3 py-2 text-xs text-[#2a1c0f] focus:outline-none"
            />
            <input
              type="text"
              value={row.value}
              onChange={(event) => updateRow(row.id, { value: event.target.value })}
              placeholder={valuePlaceholder}
              className="min-w-[160px] flex-1 rounded-lg border border-[#2a1c0f]/15 bg-white/80 px-3 py-2 text-xs text-[#2a1c0f] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="rounded-full border border-[#2a1c0f]/20 px-3 py-1 text-[11px] text-[#2a1c0f] hover:bg-[#2a1c0f]/10"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="rounded-full border border-[#2a1c0f]/20 px-3 py-1 text-[11px] text-[#2a1c0f] hover:bg-[#2a1c0f]/10"
      >
        Add entry
      </button>
    </div>
  );
}
