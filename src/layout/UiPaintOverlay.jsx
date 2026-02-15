import { useEffect, useMemo, useState } from "react";
import { FiPenTool, FiX } from "react-icons/fi";
import { usePageRegistry } from "../context/PageRegistryContext";
import { useUser } from "../context/UserContext";

const STYLE_FIELDS = [
  { key: "color", label: "Text color", css: "color", isColor: true },
  { key: "backgroundColor", label: "Background", css: "background-color", isColor: true },
  { key: "fontSize", label: "Font size", css: "font-size" },
  { key: "fontWeight", label: "Font weight", css: "font-weight" },
  { key: "padding", label: "Padding", css: "padding" },
  { key: "borderRadius", label: "Border radius", css: "border-radius" },
];

const escapeCss = (value) => {
  if (typeof window !== "undefined" && window.CSS?.escape) {
    return window.CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
};

const findPageId = (element) => {
  let node = element;
  while (node) {
    if (node.dataset?.pageId) return node.dataset.pageId;
    node = node.parentElement;
  }
  return "unknown";
};

const buildSelector = (element, pageId) => {
  const id = element.getAttribute("id");
  if (id) {
    return {
      selector: `[data-page-id="${pageId}"] #${escapeCss(id)}`,
      label: `#${id}`,
    };
  }
  const classes = Array.from(element.classList || []).filter(Boolean);
  if (classes.length) {
    const classSelector = classes.slice(0, 2).map((cls) => `.${escapeCss(cls)}`).join("");
    return {
      selector: `[data-page-id="${pageId}"] ${classSelector}`,
      label: classes.slice(0, 2).join(" "),
    };
  }
  const tag = element.tagName?.toLowerCase() || "element";
  return {
    selector: `[data-page-id="${pageId}"] ${tag}`,
    label: tag,
  };
};

const readStyles = (element) => {
  const computed = window.getComputedStyle(element);
  return STYLE_FIELDS.reduce((acc, field) => {
    acc[field.key] = computed[field.key] || "";
    return acc;
  }, {});
};

const buildCssRule = (selection, draftStyles) => {
  const cssLines = STYLE_FIELDS.map((field) => {
    const value = draftStyles[field.key];
    if (!value) return null;
    return `  ${field.css}: ${value};`;
  }).filter(Boolean);
  if (!cssLines.length) return null;
  return `${selection.selector} {\n${cssLines.join("\n")}\n}`;
};

const expandHex = (value) => {
  if (!value || value.length !== 4) return value;
  return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
};

const toHexColor = (value) => {
  if (!value) return "#000000";
  if (value.startsWith("#")) {
    if (value.length === 4) return expandHex(value);
    if (value.length === 7) return value;
    if (value.length === 9) return value.slice(0, 7);
  }
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return "#000000";
  const [r, g, b] = match[1]
    .split(",")
    .map((part) => parseFloat(part.trim()))
    .map((num) => Math.max(0, Math.min(255, Math.round(num))));
  if ([r, g, b].some((num) => Number.isNaN(num))) return "#000000";
  return `#${[r, g, b].map((num) => num.toString(16).padStart(2, "0")).join("")}`;
};

export default function UiPaintOverlay() {
  const { userRole, userRoles } = useUser();
  const isAdmin = (userRoles || []).includes("admin") || userRole === "admin";
  const { pages, palette, savePageStyle, refreshPageStyles } = usePageRegistry();

  const [paintMode, setPaintMode] = useState(false);
  const [selection, setSelection] = useState(null);
  const [draftStyles, setDraftStyles] = useState(null);
  const [saving, setSaving] = useState(false);

  const currentPage = useMemo(
    () => pages.find((page) => page.id === selection?.pageId) || null,
    [pages, selection?.pageId]
  );

  const paletteSwatches = useMemo(() => {
    const values = Object.values(palette || {}).filter(
      (value) => typeof value === "string"
    );
    const colors = values
      .map((value) => value.trim())
      .filter((value) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value))
      .map((value) => {
        if (value.length === 4) return expandHex(value).toLowerCase();
        if (value.length === 9) return value.slice(0, 7).toLowerCase();
        return value.toLowerCase();
      });
    return Array.from(new Set(colors));
  }, [palette]);

  const setFieldValue = (key, value) => {
    setDraftStyles((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (!paintMode) return;
    const handleClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-ui-overlay]")) return;

      event.preventDefault();
      event.stopPropagation();

      const pageId = findPageId(target);
      const selectorInfo = buildSelector(target, pageId);
      setSelection({ pageId, ...selectorInfo });
      setDraftStyles(readStyles(target));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [paintMode]);

  const closeModal = () => {
    setSelection(null);
    setDraftStyles(null);
  };

  const togglePaintMode = () => {
    setPaintMode((prev) => !prev);
    closeModal();
  };

  const handleSave = async () => {
    if (!selection || !draftStyles || !selection.pageId || selection.pageId === "unknown") {
      return;
    }
    const rule = buildCssRule(selection, draftStyles);
    if (!rule) return;
    const nextCss = [currentPage?.customCss, rule].filter(Boolean).join("\n\n");

    setSaving(true);
    try {
      await savePageStyle(selection.pageId, { customCss: nextCss });
      await refreshPageStyles();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={togglePaintMode}
        data-ui-overlay="true"
        className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition ${
          paintMode ? "bg-orange-500 text-white" : "bg-white text-slate-800"
        }`}
      >
        <FiPenTool />
        {paintMode ? "Paint mode on" : "Edit UI"}
      </button>

      {selection && draftStyles && (
        <div
          data-ui-overlay="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Edit UI
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selection.label || "Selected element"}
                </h2>
                <p className="text-xs text-slate-500 break-all">{selection.selector}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            {selection.pageId === "unknown" && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                This element is not inside a page shell yet. Scroll to a normal app
                page and try again.
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {STYLE_FIELDS.map((field) => (
                <label key={field.key} className="text-xs text-slate-600 space-y-1">
                  <span className="font-semibold">{field.label}</span>
                  {field.isColor && paletteSwatches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {paletteSwatches.map((swatch) => (
                        <button
                          key={`${field.key}-${swatch}`}
                          type="button"
                          onClick={() => setFieldValue(field.key, swatch)}
                          className="h-5 w-5 rounded-full border border-slate-200 shadow-sm"
                          style={{ backgroundColor: swatch }}
                          title={swatch}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draftStyles[field.key] || ""}
                      onChange={(event) => setFieldValue(field.key, event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                    />
                    {field.isColor && (
                      <input
                        type="color"
                        value={toHexColor(draftStyles[field.key])}
                        onChange={(event) => setFieldValue(field.key, event.target.value)}
                        className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                        aria-label={`${field.label} picker`}
                      />
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || selection.pageId === "unknown"}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save styles"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
