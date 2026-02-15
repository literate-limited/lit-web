import React, { useContext, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const AddMcq = ({ onMcqCreated }) => {
  // Compute headers locally from token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", ""]); // Default three options
  const [correctAnswer, setCorrectAnswer] = useState(0); // Index of the correct answer
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateMcq = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Prepare the payload
      const payload = {
        question,
        options: options.map((option) => ({ text: option })), // Format options correctly
        correctAnswer: parseInt(correctAnswer, 10), // Ensure correctAnswer is an integer
      };

      const response = await axios.post(
        `${API_URL}/mcq`,
        payload,{headers}
      );

      const { message } = response.data;
      setSuccessMessage(message || "MCQ created successfully!");

      // Reset form
      setQuestion("");
      setOptions(["", "", ""]);
      setCorrectAnswer(0);

      // Trigger the callback to re-fetch MCQs
      if (onMcqCreated) {
        onMcqCreated();
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Error creating MCQ. Please try again.";
      setErrorMessage(errMsg);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border bg-[#bdd8dd] border-gray-300 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create a New MCQ</h2>
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}
      <form onSubmit={handleCreateMcq}>
        {/* Scrollable and adjustable textarea for question */}
        <div className="mb-4">
          <label htmlFor="question" className="block mb-2 text-lg font-semibold">
            Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question"
            required
            className="w-full p-2 border border-gray-300 rounded-lg resize-y overflow-auto"
            rows="4" // Default rows
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-lg font-semibold">Options</label>
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
              className="w-full mb-2 p-2 border border-gray-300 rounded-lg"
            />
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="correctAnswer" className="block mb-2 text-lg font-semibold">
            Correct Answer (Index)
          </label>
          <input
            type="number"
            id="correctAnswer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="Enter the index of the correct answer (0, 1, 2...)"
            min="0"
            max={options.length - 1}
            required
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 font-semibold bg-[#155e75] text-white rounded-lg hover:bg-[#135367] disabled:bg-gray-300"
        >
          {loading ? "Creating..." : "Create MCQ"}
        </button>
      </form>
    </div>
  );
};

export default AddMcq;