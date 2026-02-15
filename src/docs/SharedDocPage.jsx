// SharedDocPage.jsx — DROP-IN replacement
// ✅ Renders the SAME multi-page editor UI as DualDocEditor
// ✅ Loads via public share token: GET  {API_URL}/docs/shared/:token
// ✅ Saves via public share token:  PUT {API_URL}/docs/shared/:token  (editor role only)
// ✅ Works in iframe embed (?embed=1) and full page

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";

import DocTopBar from "./components/DocTopBar";
import DocTitleRow from "./components/DocTitleRow";
import PageTabs from "./components/PageTabs";
import TextPageEditor from "./components/TextPageEditor";
import TranslationPageEditor from "./components/TranslationPageEditor";
import AddPageModal from "./components/AddPageModal";

const API_URL = import.meta.env.VITE_API_URL;

// small helper so font sizes stay in a comfy range
const clamp = (v, min = 12, max = 56) => Math.max(min, Math.min(max, v));

function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function computePreview(pages, legacyContent) {
  let text = "";

  if (Array.isArray(pages) && pages.length) {
    const firstTranslation = pages.find((p) => p.kind === "translation");
    const firstText = pages.find((p) => p.kind === "text");

    if (firstTranslation) {
      text =
        firstTranslation.content?.native ||
        firstTranslation.content?.target ||
        "";
    } else if (firstText) {
      text = firstText.content?.text || "";
    }
  }

  if (!text && legacyContent) {
    text = legacyContent.native || legacyContent.target || "";
  }

  return (text || "").substring(0, 200);
}

function normalizeDoc(docData) {
  const docLevelFromLanguage = docData.from_language || "English";
  const docLevelToLanguage = docData.to_language || "French";

  // New format
  if (Array.isArray(docData.pages) && docData.pages.length > 0) {
    const normalizedPages = docData.pages.map((p) => {
      const kind = p.kind || p.type || "text";
      const normalized = {
        id: p.id || safeUUID(),
        kind,
        title: p.title || (kind === "translation" ? "Translation" : "Page"),
        content: p.content || {},
      };

      // For translation pages: preserve page-level languages (migrate from doc-level if needed)
      if (kind === "translation") {
        normalized.from_language = p.from_language || docLevelFromLanguage;
        normalized.to_language = p.to_language || docLevelToLanguage;
      }

      return normalized;
    });

    return {
      ...docData,
      from_language: docLevelFromLanguage,
      to_language: docLevelToLanguage,
      pages: normalizedPages,
      preview: computePreview(normalizedPages, docData.content),
    };
  }

  // Back-compat (old dual editor stored in doc.content.native/target)
  const oldNative = docData.content?.native || "";
  const oldTarget = docData.content?.target || "";
  const hasOld = (oldNative + oldTarget).trim().length > 0;

  if (hasOld) {
    const pages = [
      {
        id: safeUUID(),
        kind: "translation",
        title: "Translation 1",
        from_language: docLevelFromLanguage,
        to_language: docLevelToLanguage,
        content: { native: oldNative, target: oldTarget },
      },
    ];

    return {
      ...docData,
      from_language: docLevelFromLanguage,
      to_language: docLevelToLanguage,
      pages,
      preview: computePreview(pages, docData.content),
    };
  }

  // Default: single page
  const pages = [
    {
      id: safeUUID(),
      kind: "text",
      title: "Page 1",
      content: { text: "" },
    },
  ];

  return {
    ...docData,
    from_language: docLevelFromLanguage,
    to_language: docLevelToLanguage,
    pages,
    preview: computePreview(pages, docData.content),
  };
}

function buildPayloadForSave(doc) {
  // Keep old `content` in sync for backward compatibility / older backends
  const firstTranslation = doc.pages?.find((p) => p.kind === "translation");
  const compatContent = firstTranslation
    ? {
        native: firstTranslation.content?.native || "",
        target: firstTranslation.content?.target || "",
      }
    : { native: "", target: "" };

  return {
    _id: doc._id,
    id: doc.id,
    title: doc.title,
    from_language: doc.from_language,
    to_language: doc.to_language,
    pages: doc.pages,
    content: compatContent,
  };
}

export default function SharedDocPage() {
  const { token: shareToken } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const qs = new URLSearchParams(location.search);
  const isEmbed = qs.get("embed") === "1";

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("viewer");
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");

  const [activePageId, setActivePageId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  // modals
  const [addPageOpen, setAddPageOpen] = useState(false);

  // font sizes (global-ish)
  const [fontText, setFontText] = useState(22);
  const [fontNative, setFontNative] = useState(22);
  const [fontTarget, setFontTarget] = useState(22);

  const saveTimer = useRef(null);

  const canEdit = role === "editor";

  const activePage = useMemo(() => {
    if (!doc?.pages?.length) return null;
    return doc.pages.find((p) => p.id === activePageId) || doc.pages[0];
  }, [doc, activePageId]);

  // ---------- fetch via share token ----------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/docs/shared/${shareToken}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Failed (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;

        const docData = normalizeDoc(data.document || data);
        setDoc(docData);
        setRole(data.role || "viewer");
        setActivePageId(docData.pages?.[0]?.id || null);
      } catch (e) {
        console.error("❌ Shared doc fetch error:", e);
        if (!cancelled) setError(e.message || "Failed to load shared doc");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(saveTimer.current);
    };
  }, [shareToken]);

  // ---------- save via share token (editor only) ----------
  const scheduleSave = (nextDoc) => {
    if (!nextDoc) return;
    if (!canEdit) return;

    clearTimeout(saveTimer.current);
    const payload = buildPayloadForSave(nextDoc);

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`${API_URL}/docs/shared/${shareToken}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const updated = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(updated?.error || updated?.message || "Save failed");

        const updatedDoc = normalizeDoc(updated.document || updated);

        setDoc((prev) => {
          const prevActive = prev?.pages?.find((p) => p.id === activePageId);
          const stillExists = updatedDoc.pages?.some((p) => p.id === prevActive?.id);
          if (!stillExists && updatedDoc.pages?.length) {
            setActivePageId(updatedDoc.pages[0].id);
          }
          return updatedDoc;
        });
      } catch (e) {
        console.error("❌ Error saving shared doc:", e);
      } finally {
        setSaving(false);
      }
    }, 350);
  };

  // ---------- page ops ----------
  const addNewPage = (kind) => {
    if (!doc || !canEdit) return;

    const textCount = doc.pages.filter((p) => p.kind === "text").length;
    const transCount = doc.pages.filter((p) => p.kind === "translation").length;

    const page =
      kind === "translation"
        ? {
            id: safeUUID(),
            kind: "translation",
            title: `Translation ${transCount + 1}`,
            from_language: doc.from_language,
            to_language: doc.to_language,
            content: { native: "", target: "" },
          }
        : {
            id: safeUUID(),
            kind: "text",
            title: `Page ${textCount + 1}`,
            content: { text: "" },
          };

    const next = { ...doc, pages: [...doc.pages, page] };
    setDoc(next);
    setActivePageId(page.id);
    scheduleSave(next);
  };

  const renamePage = (pageId, title) => {
    if (!doc || !canEdit) return;
    const next = {
      ...doc,
      pages: doc.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
    };
    setDoc(next);
    scheduleSave(next);
  };

  // ---------- translate (requires AUTH token; guests can still view) ----------
  const translateActivePage = async () => {
    if (!doc || !activePage || activePage.kind !== "translation") return;

    const input = activePage.content?.native?.trim() || "";
    if (!input) return;

    const authToken = localStorage.getItem("token");
    if (!authToken) return; // silently no-op if guest

    setTranslating(true);
    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          input_text: input,
          from_language: activePage.from_language || doc.from_language,
          to_language: activePage.to_language || doc.to_language,
          registers: [],
        }),
      });

      if (!res.ok) throw new Error("Translation failed");
      const translatedText = await res.text();

      const next = {
        ...doc,
        pages: doc.pages.map((p) =>
          p.id === activePage.id
            ? { ...p, content: { ...p.content, target: translatedText } }
            : p
        ),
      };

      setDoc(next);
      scheduleSave(next);
    } catch (e) {
      console.error("❌ Translate error:", e);
    } finally {
      setTranslating(false);
    }
  };

  // ---------- update page-level languages (translation pages only) ----------
  const updatePageLanguages = (patch) => {
    if (!doc || !activePage || activePage.kind !== "translation" || !canEdit) return;

    const next = {
      ...doc,
      pages: doc.pages.map((p) =>
        p.id === activePage.id
          ? { ...p, ...patch }
          : p
      ),
    };
    setDoc(next);
    scheduleSave(next);
  };

  // ---------- update title ----------
  const updateTitle = (title) => {
    if (!doc || !canEdit) return;
    setDoc((prev) => ({ ...prev, title }));
  };

  const saveNow = () => {
    if (!doc || !canEdit) return;
    scheduleSave(doc);
  };

  // ---------- update page content ----------
  const updateActiveText = (text) => {
    if (!doc || !activePage || !canEdit) return;
    const next = {
      ...doc,
      pages: doc.pages.map((p) =>
        p.id === activePage.id ? { ...p, content: { ...p.content, text } } : p
      ),
    };
    setDoc(next);
    scheduleSave(next);
  };

  const updateActiveTranslation = (patch) => {
    if (!doc || !activePage || !canEdit) return;
    const next = {
      ...doc,
      pages: doc.pages.map((p) =>
        p.id === activePage.id
          ? { ...p, content: { ...p.content, ...patch } }
          : p
      ),
    };
    setDoc(next);
    scheduleSave(next);
  };

  if (loading) return <div className="p-6">Loading shared doc…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!doc) return <Navigate to="/welcome" replace />;

  return (
    <div className={isEmbed ? "w-full h-[100dvh] p-4" : "mx-auto max-w-6xl p-6"}>
      {/* Top bar: share button disabled for token viewers */}
      <DocTopBar
        doc={doc}
        activePage={activePage}
        onBack={() => navigate(isEmbed ? "/welcome" : "/welcome")}
        onChangeLanguages={updatePageLanguages}
        onOpenShare={() => {}} // no-op: token viewers shouldn't generate new share links
      />

      <DocTitleRow
        title={doc.title || ""}
        onChangeTitle={updateTitle}
        onBlurSave={saveNow}
        fontSummary={Math.round(
          activePage?.kind === "translation"
            ? (fontNative + fontTarget) / 2
            : fontText
        )}
        onDecAll={() => {
          if (activePage?.kind === "translation") {
            setFontNative((f) => clamp(f - 2));
            setFontTarget((f) => clamp(f - 2));
          } else {
            setFontText((f) => clamp(f - 2));
          }
        }}
        onIncAll={() => {
          if (activePage?.kind === "translation") {
            setFontNative((f) => clamp(f + 2));
            setFontTarget((f) => clamp(f + 2));
          } else {
            setFontText((f) => clamp(f + 2));
          }
        }}
      />

      <PageTabs
        pages={doc.pages}
        activePageId={activePage?.id}
        onSelectPage={setActivePageId}
        onRenamePage={canEdit ? renamePage : () => {}}
        onOpenAddPage={canEdit ? () => setAddPageOpen(true) : undefined}
      />

      <div className="mt-5">
        {activePage?.kind === "translation" ? (
          <TranslationPageEditor
            fromLanguage={activePage.from_language || doc.from_language}
            toLanguage={activePage.to_language || doc.to_language}
            nativeValue={activePage.content?.native || ""}
            targetValue={activePage.content?.target || ""}
            onChangeNative={canEdit ? (native) => updateActiveTranslation({ native }) : () => {}}
            onChangeTarget={canEdit ? (target) => updateActiveTranslation({ target }) : () => {}}
            fontNative={fontNative}
            fontTarget={fontTarget}
            onDecNative={() => setFontNative((f) => clamp(f - 2))}
            onIncNative={() => setFontNative((f) => clamp(f + 2))}
            onDecTarget={() => setFontTarget((f) => clamp(f - 2))}
            onIncTarget={() => setFontTarget((f) => clamp(f + 2))}
          />
        ) : (
          <TextPageEditor
            title={activePage?.title}
            value={activePage?.content?.text || ""}
            onChange={canEdit ? updateActiveText : () => {}}
            fontSize={fontText}
            onDec={() => setFontText((f) => clamp(f - 2))}
            onInc={() => setFontText((f) => clamp(f + 2))}
          />
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {activePage?.kind === "translation" ? (
          <button
            onClick={translateActivePage}
            disabled={translating || !localStorage.getItem("token")}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 disabled:bg-gray-300"
            title={!localStorage.getItem("token") ? "Login required for translate" : ""}
          >
            {translating ? (
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
            ) : null}
            Translate →
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            This is a normal page. Add a translation page with the “+” button.
          </span>
        )}

        {saving && <span className="text-sm text-gray-500">Saving…</span>}

        <span className="ml-auto text-xs text-gray-400">
          Access: {role} • Updated {new Date(doc.updatedAt || Date.now()).toLocaleString()}
        </span>
      </div>

      {canEdit && (
        <AddPageModal
          open={addPageOpen}
          onClose={() => setAddPageOpen(false)}
          onAddPage={() => {
            addNewPage("text");
            setAddPageOpen(false);
          }}
          onAddTranslationPage={() => {
            addNewPage("translation");
            setAddPageOpen(false);
          }}
        />
      )}
    </div>
  );
}
