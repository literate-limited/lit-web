import React, { useContext } from 'react';
import { signOut } from '../utils/common.utils';
import { useTranslation } from "../translator/hooks/useTranslation";
import { ThemeContext } from "../utils/themes/ThemeContext";
import logoutTranslations from "../translations/logoutModal";

const LogoutModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation(logoutTranslations);
  const { currentTheme } = useContext(ThemeContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-lg shadow-lg max-w-sm w-full p-6 relative"
        style={{
          backgroundColor: currentTheme.headerBg,
          color: currentTheme.textColor
        }}
      >
        <h2 className="text-xl font-bold mb-4">
          {t("confirmLogout")}
        </h2>

        <p className="mb-4">
          {t("logoutMessage")}
        </p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white rounded-lg hover:bg-gray-400"
            style={{
              color: currentTheme.textColor
            }}
          >
            {t("cancelButton")}
          </button>

          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            {t("logoutButton")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
