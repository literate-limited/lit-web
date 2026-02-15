import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

const AddBadge = ({ onBadgeCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        name,
        description,
        imageURL,
      };

      const response = await axios.post(`${API_URL}/badge/create`, payload);
      const { message } = response.data;

      setSuccessMessage(message || "Badge created successfully!");

      // Reset form fields
      setName("");
      setDescription("");
      setImageURL("");

      // Trigger the callback to notify parent component
      if (onBadgeCreated) {
        onBadgeCreated();
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Error creating badge. Please try again.";
      setErrorMessage(errMsg);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border bg-[#bdd8dd] border-gray-300 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create a New Badge</h2>
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}
      <form onSubmit={handleCreateBadge}>
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2 text-lg font-semibold">
            Badge Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter badge name"
            required
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block mb-2 text-lg font-semibold">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter badge description"
            required
            className="w-full p-2 border border-gray-300 rounded-lg resize-y"
            rows="4" // Default rows
          />
        </div>

        <div className="mb-4">
          <label htmlFor="imageURL" className="block mb-2 text-lg font-semibold">
            Image URL
          </label>
          <input
            type="text"
            id="imageURL"
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="Enter image URL"
            required
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 font-semibold bg-[#155e75] text-white rounded-lg hover:bg-[#135367] disabled:bg-gray-300"
        >
          {loading ? "Creating..." : "Create Badge"}
        </button>
      </form>
    </div>
  );
};

export default AddBadge;