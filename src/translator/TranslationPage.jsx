import { useEffect } from "react";
import { openTranslator } from "./openTranslator";

// Compatibility shim: when someone hits /translate, pop open the floating translator.
export default function TranslationPage() {
  useEffect(() => {
    openTranslator();
  }, []);

  return null;
}
