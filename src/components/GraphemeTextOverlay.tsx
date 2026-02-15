import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loadAlphabet, LANG_CATEGORY } from "../utils/alphabets";
import Graphemer from "graphemer";

const HEB_FINAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

const HIRA_VOICED: Record<string, string> = {
  "が": "か", "ぎ": "き", "ぐ": "く", "げ": "け", "ご": "こ",
  "ざ": "さ", "じ": "し", "ず": "す", "ぜ": "せ", "ぞ": "そ",
  "だ": "た", "ぢ": "ち", "づ": "つ", "で": "て", "ど": "と",
  "ば": "は", "び": "ひ", "ぶ": "ふ", "べ": "へ", "ぼ": "ほ",
  "ぱ": "は", "ぴ": "ひ", "ぷ": "ふ", "ぺ": "へ", "ぽ": "ほ",
};

const RTL = new Set(["ar", "he", "yi", "fa", "ur", "ku", "ckb", "ps", "sd", "ug", "dv"]);
const isRTL = (c: string) => RTL.has(c.split("-")[0].toLowerCase());

function Tooltip({ d, category }: { d: any; category?: string }) {
  const idx = d.position ?? d.index;
  const showName = d.name && d.name !== d.letter && d.name.trim() !== "" ? d.name : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-3xl font-extrabold tracking-wide text-indigo-700">
        {d.letter || d.character}
      </div>

      {category && (
        <div className="text-xs font-semibold text-gray-700">{category}</div>
      )}

      {showName && (
        <div className="text-xs text-gray-600">
          <span className="font-medium">Romanisation:</span> {showName}
        </div>
      )}

      {d.sounds && (
        <div className="text-xs">
          <span className="font-medium">Sounds:</span> {d.sounds.join(", ")}
        </div>
      )}

      {d.pronunciation && (
        <div className="text-xs">
          <span className="font-medium">Readings:</span> {d.pronunciation.join(", ")}
        </div>
      )}

      {d.translation && (
        <div className="text-xs">
          <span className="font-medium">Meaning:</span> {d.translation}
        </div>
      )}

      {d.description && (
        <div className="text-[10px] leading-snug whitespace-pre-line">
          {d.description}
        </div>
      )}

      {d.articulation && (
        <div className="text-[10px] text-gray-600">
          <span className="font-medium">Artic:</span> {d.articulation}
        </div>
      )}

      {idx !== undefined && (
        <div className="text-[10px] text-gray-500">No. {idx}</div>
      )}
    </div>
  );
}

export default function GraphemeTextOverlay({
  sentence = "",
  className = "",
}: {
  sentence?: string;
  className?: string;
}) {
  const [lang, setLang] = useState(() =>
    (localStorage.getItem("gameLanguage") || "en").split("-")[0]
  );

  const [alpha, setAlpha] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const onStorage = () =>
      setLang((localStorage.getItem("gameLanguage") || "en").split("-")[0]);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (lang === "ja") {
          const [hira, kata, kanji] = await Promise.all([
            loadAlphabet("ja"),
            loadAlphabet("ja_kana"),
            loadAlphabet("ka"),
          ]);
          if (!cancelled) setAlpha({ ...hira, ...kata, ...kanji });
        } else {
          const data = await loadAlphabet(lang);
          if (!cancelled) setAlpha(data);
        }
      } catch {
        const fallback = await loadAlphabet("en");
        if (!cancelled) setAlpha(fallback);
      }
    }

    setAlpha(null);
    load();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const rtl = isRTL(lang);
  const clusters = new Graphemer().splitGraphemes(sentence);

  const wrapRef = useRef<HTMLParagraphElement>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const [boxes, setBoxes] = useState<{ left: number; top: number; width: number }[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [place, setPlace] = useState<"up" | "down">("up");

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const parent = wrapRef.current.getBoundingClientRect();
    const rects = Array.from(
      wrapRef.current.querySelectorAll("span[data-g]")
    ).map((r) => ({
      left: r.getBoundingClientRect().left - parent.left,
      top: r.getBoundingClientRect().top - parent.top,
      width: r.getBoundingClientRect().width,
    }));
    setBoxes(rects);
  }, [sentence, lang]);

  if (!alpha) return null;

  const infoFor = (g: string) => {
    const base =
      lang === "he" && HEB_FINAL[g] ? HEB_FINAL[g] : HIRA_VOICED[g] || g;
    const norm = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return (
      alpha[g] ??
      alpha[base] ??
      alpha[norm.toLowerCase?.() || norm] ??
      alpha[norm.toUpperCase?.() || norm] ??
      alpha[norm] ??
      Object.values(alpha).find(
        (e: any) => e.character === norm || e.letter === norm
      ) ??
      null
    );
  };

  const enter = (i: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHover(i);
    setPlace(boxes[i]?.top < 120 ? "down" : "up");
  };

  const leave = () => {
    hideTimer.current = setTimeout(() => setHover(null), 120);
  };

  return (
    <div className={`relative flex justify-center mt-4 min-h-[4rem] ${className}`}>
      <p
        dir={rtl ? "rtl" : "ltr"}
        ref={wrapRef}
        className="text-4xl font-bold whitespace-pre-wrap relative cursor-pointer"
      >
        {clusters.map((g, i) => (
          <span key={i} data-g>
            {g}
          </span>
        ))}
      </p>

      {boxes.map(({ left, width }, i) =>
        clusters[i] === " " ? null : (
          <div
            key={i}
            style={{ position: "absolute", top: 0, left, width, height: "100%" }}
            onMouseEnter={() => enter(i)}
            onMouseLeave={leave}
          />
        )
      )}

      <AnimatePresence>
        {hover !== null && infoFor(clusters[hover]) && (
          <motion.div
            key={hover}
            initial={{ opacity: 0, scale: 0.7, y: place === "up" ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: place === "up" ? -4 : 4 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onMouseEnter={() =>
              hideTimer.current && clearTimeout(hideTimer.current)
            }
            onMouseLeave={() => setHover(null)}
            className="absolute z-50 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md bg-white/80 ring-1 ring-gray-300 text-left"
            style={{
              left: boxes[hover].left + boxes[hover].width / 2,
              transform: "translateX(-50%)",
              maxWidth: "20rem",
              minWidth: "8rem",
              width: "max-content",
              ...(place === "up"
                ? { bottom: "100%", marginBottom: "0.25rem" }
                : { top: "100%", marginTop: "0.25rem" }),
            }}
          >
            <Tooltip
              d={infoFor(clusters[hover])}
              category={LANG_CATEGORY[lang] || "Unknown Alphabet"}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
