import { useState } from 'react';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import requestDeleteFormTranslations from "../translations/requestDeleteForm";

const API_URL = import.meta.env.VITE_API_URL;

const RequestDeleteForm = () => {
  const { t } = useTranslation(requestDeleteFormTranslations); // Use the translation hook
  const [name, setName] = useState(''); // Add state for name
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Second API request: Send feedback email (via /send-feedback)
      const sendResponse = await fetch(`${API_URL}/send-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }), // Send name, email, and message
      });

      if (!sendResponse.ok) {
        throw new Error('Failed to send request.');
      }

      setStatus(t("successMessage")); // Dynamic translation
      setName(''); // Clear name
      setEmail('');
      setMessage('');
      
    } catch (error) {
      setStatus(`${t("errorMessage")}: ${error.message}`); // Dynamic translation
    }
  };

  return (
    <div className="w-full flex justify-center mt-[10%]"> {/* Centers content horizontally and adds margin at the top */}
      <form 
        onSubmit={handleSubmit} 
        className="bg-[#bdd8dd] shadow-md rounded-xl px-8 pt-6 pb-8 mb-4 w-full md:w-1/2 lg:w-1/3 xl:w-1/4 mx-auto mt-20 sm:mt-0 sm:px-6 sm:py-8"
      >
        <h2 className="text-center text-xl font-bold mb-6">{t("title")}</h2> {/* Dynamic translation */}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-center text-sm font-bold mb-2" htmlFor="name">
            {t("nameLabel")} {/* Dynamic translation */}
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-center text-sm font-bold mb-2" htmlFor="email">
            {t("emailLabel")} {/* Dynamic translation */}
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-center text-sm font-bold mb-2" htmlFor="message">
            {t("messageLabel")} {/* Dynamic translation */}
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="flex items-center justify-center">
          <button
            className="bg-[#155e75] hover:bg-[#1a7692] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            {t("submitButton")} {/* Dynamic translation */}
          </button>
        </div>

        {status && <p className="mt-4 text-center text-sm text-green-500">{status}</p>}
      </form>
    </div>
  );
};

export default RequestDeleteForm;
