import { useState, useContext } from 'react';
import { useTranslation } from "../hooks/useTranslation";
import { ThemeContext } from "../utils/themes/ThemeContext";
import feedbackFormTranslations from "../translations/feedbackForm";

const API_URL = import.meta.env.VITE_API_URL;

const FeedbackForm = () => {
  const { t } = useTranslation(feedbackFormTranslations);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const { currentTheme } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const saveResponse = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!saveResponse.ok) throw new Error('Failed to save feedback.');

      const sendResponse = await fetch(`${API_URL}/send-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!sendResponse.ok) throw new Error('Failed to send feedback email.');

      setStatus(t("successMessage"));
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      setStatus(`${t("errorMessage")}: ${error.message}`);
    }
  };

  return (
    <div className="w-full flex justify-center mt-[10%]">
      <form
        onSubmit={handleSubmit}
        className="shadow-md rounded-xl px-8 pt-6 pb-8 mb-4 w-full md:w-1/2 lg:w-1/3 xl:w-1/4 mx-auto mt-20 sm:mt-0 sm:px-6 sm:py-8"
        style={{
          backgroundColor: currentTheme.headerBg,
          color: currentTheme.textColor
        }}
      >
        <h2 className="text-center text-xl font-bold mb-6">
          {t("title")}
        </h2>

        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-center text-sm font-bold mb-2"
            style={{ color: currentTheme.grayText }}
          >
            {t("nameLabel")}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
            style={{
              backgroundColor:
                currentTheme.bgColor === "#1a1a1a" ? "#333" : currentTheme.placeholderBg,
              color: currentTheme.textColor
            }}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-center text-sm font-bold mb-2"
            style={{ color: currentTheme.grayText }}
          >
            {t("emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
            style={{
              backgroundColor:
                currentTheme.bgColor === "#1a1a1a" ? "#333" : currentTheme.placeholderBg,
              color: currentTheme.textColor
            }}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="message"
            className="block text-center text-sm font-bold mb-2"
            style={{ color: currentTheme.grayText }}
          >
            {t("messageLabel")}
          </label>
          <textarea
            id="message"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
            style={{
              backgroundColor:
                currentTheme.bgColor === "#1a1a1a" ? "#333" : currentTheme.placeholderBg,
              color: currentTheme.textColor
            }}
          />
        </div>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            style={{
              backgroundColor: currentTheme.buttonColor,
              color: currentTheme.textColor
            }}
          >
            {t("submitButton")}
          </button>
        </div>

        {status && (
          <p className="mt-4 text-center text-sm text-green-500">
            {status}
          </p>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;
