// import english from "./2English/english.json";
// import hebrew from "./2English/hebrew.json";
// import arabic from "./2English/arabic.json";
// import hindi from "./2English/hindi.json";
// import tamil from "./2English/tamil.json";
// import russian from "./2English/russian.json";
// import hiragana from "./2English/hiragana.json";
// import katakana from "./2English/katakana.json";
// import kanji from "./2English/kanji.json";
// import korean from "./2English/korean.json";
// import french from "./2English/french.json";
// import greek from "./2English/greek.json";
// import finnish from "./2English/finnish.json";
// import german from "./2English/german.json";
// import romanian from "./2English/romanian.json";
// import swedish from "./2English/swedish.json";

// export const ALPHABETS = {
//   en: english,
//   he: hebrew,
//   ar: arabic,
//   hi: hindi,
//   ta: tamil,
//   ru: russian,
//   ja: hiragana,
//   ja_kana: katakana,
//   ka: kanji,
//   ko: korean,
//   fr: french,
//   el: greek,
//   fi: finnish,
//   de: german,
//   ro: romanian,
//   sv: swedish,
// };

// export const LANG_CATEGORY = {
//   en: "Latin",
//   he: "Hebrew",
//   ar: "Arabic",
//   hi: "Devanagari (Hindi)",
//   ta: "Tamil",
//   ru: "Cyrillic (Russian)",
//   ja: "Hiragana (Japanese)",
//   ja_kana: "Katakana (Japanese)",
//   ka: "Kanji (Japanese)",
//   ko: "Hangul (Korean)",
//   fr: "Latin (French)",
//   el: "Greek",
//   fi: "Finnish",
//   de: "German",
//   ro: "Romanian",
//   sv: "Swedish",
// };

// src/utils/alphabets/index.js

const alphabetLoaders = {
  en: () => import("./2English/english.json"),
  he: () => import("./2English/hebrew.json"),
  ar: () => import("./2English/arabic.json"),
  hi: () => import("./2English/hindi.json"),
  ta: () => import("./2English/tamil.json"),
  ru: () => import("./2English/russian.json"),
  ja: () => import("./2English/hiragana.json"),
  ja_kana: () => import("./2English/katakana.json"),
  ka: () => import("./2English/kanji.json"),
  ko: () => import("./2English/korean.json"),
  fr: () => import("./2English/french.json"),
  el: () => import("./2English/greek.json"),
  fi: () => import("./2English/finnish.json"),
  de: () => import("./2English/german.json"),
  ro: () => import("./2English/romanian.json"),
  sv: () => import("./2English/swedish.json"),
};

export async function loadAlphabet(lang) {
  const loader = alphabetLoaders[lang];
  if (!loader) {
    throw new Error(`Unknown alphabet language: ${lang}`);
  }
  const module = await loader();
  return module.default;
}

export const LANG_CATEGORY = {
  en: "Latin",
  he: "Hebrew",
  ar: "Arabic",
  hi: "Devanagari (Hindi)",
  ta: "Tamil",
  ru: "Cyrillic (Russian)",
  ja: "Hiragana (Japanese)",
  ja_kana: "Katakana (Japanese)",
  ka: "Kanji (Japanese)",
  ko: "Hangul (Korean)",
  fr: "Latin (French)",
  el: "Greek",
  fi: "Finnish",
  de: "German",
  ro: "Romanian",
  sv: "Swedish",
};

