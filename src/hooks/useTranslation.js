// Compatibility re-export: some parts of the codebase import useTranslation from
// client/src/hooks/useTranslation even though the implementation lives under
// client/src/translator/hooks/useTranslation.
export { useTranslation } from "../translator/hooks/useTranslation";

