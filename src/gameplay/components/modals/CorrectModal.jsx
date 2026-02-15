import React, { useEffect, useContext } from 'react';
import { AiOutlineCheckCircle } from 'react-icons/ai';
import 'tailwindcss/tailwind.css';
import '../../../utils/animations.utils.css';
import { useTranslation } from "../../../translator/hooks/useTranslation"; // Import the translation hook
import { ThemeContext } from "../../../utils/themes/ThemeContext";
import Translations from "../../../translations/correctModal"; // Import translations for the modal

const CorrectAnswerModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation(Translations); // Use the translation hook
  const { currentTheme } = useContext(ThemeContext);

  useEffect(() => {
    const handleKeyDown  = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default action
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Set focus to the modal or close button
      document.getElementById('close-button').focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
      style={{
        backgroundColor: currentTheme.correctBgOuter}}
        className={` rounded-lg p-8 sm:p-10 md:p-16 lg:p-20 shadow-lg w-11/12 max-w-lg transform transition-all duration-300 ${
          isOpen ? 'scale-100' : 'scale-90'
        }`}
      >
        {/* Animated Icon */}
        <div className="flex items-center justify-center mb-4">
          <AiOutlineCheckCircle className="text-green-500 text-[100px] sm:text-[120px] md:text-[150px] icon-flip-infinite" />
        </div>
        {/* Modal Message */}
        <div
        style={{
          backgroundColor: currentTheme.correctInnerBg}}
         className="text-center p-4 sm:p-6 rounded-lg">
          <h2 style={{
          color: currentTheme.correctTextColor}} className="text-xl sm:text-2xl font-semibold">{t("title")}</h2> {/* Dynamic translation */}
          <p style={{
          color: currentTheme.grayText}} className="mt-2 text-sm sm:text-base md:text-lg text-gray-300">{t("message")}</p> {/* Dynamic translation */}
        </div>
        {/* Close Button */}
        <div className="flex justify-center mt-6">
          <button style={{
          backgroundColor: currentTheme.correctTextColor}}
            id="close-button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition"
          >
            {t("closeButton")} {/* Dynamic translation */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectAnswerModal;