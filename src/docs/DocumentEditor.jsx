import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import DocTopBar from "./components/DocTopBar";
import DocTitleRow from "./components/DocTitleRow";
import PageTabs from "./components/PageTabs";
import TextPageEditor from "./components/TextPageEditor";
import TranslationPageEditor from "./components/TranslationPageEditor";
import AddPageModal from "./components/AddPageModal";
import ShareDocModal from "./components/ShareDocModal";

const API_URL = import.meta.env.VITE_API_URL;

// small helper so font sizes stay in a comfy range
const clamp = (v, min = 12, max = 56) => Math.max(min, Math.min(max, v));

function safeUUID() {
  // crypto.randomUUID() is widely supported, but this keeps us safe in odd environments
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

  // Avoid sending any accidental UI-only props
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

export default function DualDocEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [activePageId, setActivePageId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  // modals
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // font sizes (global-ish)
  const [fontText, setFontText] = useState(22);
  const [fontNative, setFontNative] = useState(22);
  const [fontTarget, setFontTarget] = useState(22);

  const saveTimer = useRef(null);

  const activePage = useMemo(() => {
    if (!doc?.pages?.length) return null;
    return doc.pages.find((p) => p.id === activePageId) || doc.pages[0];
  }, [doc, activePageId]);

  const scheduleSave = (nextDoc) => {
    if (!nextDoc) return;
    clearTimeout(saveTimer.current);

    const payload = buildPayloadForSave(nextDoc);

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/docs/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const updated = await res.json();
        const updatedDoc = normalizeDoc(updated.document || updated);

        setDoc((prev) => {
          // Preserve current active page if possible
          const prevActive = prev?.pages?.find((p) => p.id === activePageId);
          const stillExists = updatedDoc.pages?.some((p) => p.id === prevActive?.id);
          if (!stillExists && updatedDoc.pages?.length) {
            setActivePageId(updatedDoc.pages[0].id);
          }
          return updatedDoc;
        });
      } catch (e) {
        console.error("❌ Error saving doc:", e);
      } finally {
        setSaving(false);
      }
    }, 350);
  };

  // ---------- fetch ----------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/docs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch doc (${res.status})`);
        const data = await res.json();
        const docData = normalizeDoc(data.document || data);

        if (cancelled) return;
        setDoc(docData);
        setActivePageId(docData.pages?.[0]?.id || null);
      } catch (e) {
        console.error("❌ Error fetching doc:", e);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(saveTimer.current);
    };
  }, [id]);

  // ---------- page ops ----------
  const addNewPage = (kind) => {
    if (!doc) return;

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
    if (!doc) return;
    const next = {
      ...doc,
      pages: doc.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
    };
    setDoc(next);
    scheduleSave(next);
  };

  // ---------- translate (native → target) for active translation page ----------
  const translateActivePage = async () => {
    if (!doc || !activePage || activePage.kind !== "translation") return;

    const input = activePage.content?.native?.trim() || "";
    if (!input) return;

    setTranslating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    if (!doc || !activePage || activePage.kind !== "translation") return;

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
    if (!doc) return;
    setDoc((prev) => ({ ...prev, title }));
  };

  const saveNow = () => {
    if (!doc) return;
    scheduleSave(doc);
  };

  // ---------- update page content ----------
  const updateActiveText = (text) => {
    if (!doc || !activePage) return;
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
    if (!doc || !activePage) return;
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

  if (!doc) return <p className="p-6">Loading…</p>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <DocTopBar
        doc={doc}
        activePage={activePage}
        onBack={() => navigate("/docs")}
        onChangeLanguages={updatePageLanguages}
        onOpenShare={() => setShareOpen(true)}
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
        onRenamePage={renamePage}
        onOpenAddPage={() => setAddPageOpen(true)}
      />

      {/* Main editor */}
      <div className="mt-5">
        {activePage?.kind === "translation" ? (
          <TranslationPageEditor
            fromLanguage={activePage.from_language || doc.from_language}
            toLanguage={activePage.to_language || doc.to_language}
            nativeValue={activePage.content?.native || ""}
            targetValue={activePage.content?.target || ""}
            onChangeNative={(native) => updateActiveTranslation({ native })}
            onChangeTarget={(target) => updateActiveTranslation({ target })}
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
            onChange={updateActiveText}
            fontSize={fontText}
            onDec={() => setFontText((f) => clamp(f - 2))}
            onInc={() => setFontText((f) => clamp(f + 2))}
          />
        )}
      </div>

      {/* Action row */}
      <div className="mt-4 flex items-center gap-3">
        {activePage?.kind === "translation" ? (
          <button
            onClick={translateActivePage}
            disabled={translating}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 disabled:bg-gray-300"
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
          Updated {new Date(doc.updatedAt || Date.now()).toLocaleString()}
        </span>
      </div>

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

      <ShareDocModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        docId={id}
        apiUrl={API_URL}
      />
    </div>
  );
}
