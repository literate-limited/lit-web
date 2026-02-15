import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import { ThemeContext } from "../utils/themes/ThemeContext";
import accessBlockedTranslations from "../translations/accessBlocked";

const AccessBlocked = () => {
  const { t } = useTranslation(accessBlockedTranslations);
  const { currentTheme } = useContext(ThemeContext);

  return (
    <div  className="flex flex-col items-center justify-center min-h-screen  p-4">
      <div style={{
            backgroundColor: currentTheme.headerBg, color: currentTheme.textColor }} className="flex flex-col items-center bg-[#bdd8dd] p-6 rounded-lg shadow-lg">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mb-4 h-16 w-16 text-red-500"
          fill="currentColor"
        >
          <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a3 3 0 003 3h10a3 3 0 003-3v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 016 0v3H9zm3 4a2 2 0 011 3.732V19a1 1 0 11-2 0v-2.268A2 2 0 0112 13z" />
        </svg>
        <h1 style={{
            backgroundColor: currentTheme.headerBg, color: currentTheme.textColor }} className="text-2xl font-semibold text-gray-800 mb-2">{t("accessBlocked.title")}</h1> {/* Dynamic translation */}
        <p style={{
             color: currentTheme.grayText }} className="text-gray-600 mb-4 text-center">
          {t("accessBlocked.message")} {/* Dynamic translation */}
        </p>
        <Link to="/" style={{
             color: currentTheme.buttonColor }} className="text-cyan-800 hover:underline flex items-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mr-2 h-4 w-4"
            fill="currentColor"
          >
            <path d="M12 3l9 8h-3v10a1 1 0 01-1 1h-4v-7H11v7H7a1 1 0 01-1-1V11H3l9-8z" />
          </svg>
          {t("accessBlocked.goBack")} {/* Dynamic translation */}
        </Link>
      </div>
    </div>
  );
};

export default AccessBlocked;
