import { Languages, ArrowLeftRight } from "lucide-react";
import languages from "../../data/languages";

export default function DocTopBar({ doc, activePage, onBack, onChangeLanguages, onOpenShare }) {
  // Only show language controls for translation pages
  const isTranslationPage = activePage?.kind === "translation";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={onBack}
        className="px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
      >
        ← Back to All Docs
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenShare}
          className="px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          Share this document
        </button>

        {isTranslationPage && (
          <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 shadow-sm px-2 py-1">
            <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
              <Languages className="h-4 w-4" />
              Language
            </span>

            {/* From */}
            <select
              value={activePage.from_language || doc.from_language}
              onChange={(e) => onChangeLanguages({ from_language: e.target.value })}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {languages.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>

            <ArrowLeftRight className="h-4 w-4 text-gray-400" />

            {/* To */}
            <select
              value={activePage.to_language || doc.to_language}
              onChange={(e) => onChangeLanguages({ to_language: e.target.value })}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {languages.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
