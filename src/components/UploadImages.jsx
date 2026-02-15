import React, { useState, useContext } from "react";
import axios from "axios";
import { AdminContext } from '../context/AdminContextProvider';

const API_URL = import.meta.env.VITE_API_URL;

const UploadImageLink = () => {
  const { fetchImages } = useContext(AdminContext);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [title, setTitle] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Maximum allowed file size (10 MB in bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Handle file upload and obtain the file URL
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setFile(file);

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setMessage({
          type: "error",
          text: "The file size must be less than 10 MB.",
        });
        return;
      }

      setFileUploading(true);
      const formData = new FormData();
      formData.append("file", file); // Generalize the field name to "file"

      try {
        const response = await axios.post(
          `${API_URL}/upload-image`, // Assuming the endpoint is the same
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data && response.data.url) {
          setFileUrl(response.data.url);
          setMessage({
            type: "success",
            text: "File uploaded successfully!",
          });
        } else {
          setMessage({
            type: "error",
            text: "Failed to get file URL. Please try again.",
          });
        }
      } catch (error) {
        console.error("File upload error:", error);
        setMessage({
          type: "error",
          text: error.response?.data || "Failed to upload file. Please try again.",
        });
      } finally {
        setFileUploading(false);
      }
    }
  };

  // Handle form submission to save file details
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    const payload = {
      title,
      link: fileUrl,
    };

    try {
      const response = await axios.post(
        `${API_URL}/create-image`, // Assuming the endpoint is the same
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data && response.data.newImage) {
        setMessage({
          type: "success",
          text: "File details saved successfully!",
        });
        fetchImages(); // Refresh images after saving
      } else {
        setMessage({
          type: "success",
          text: "File details saved successfully!",
        });
        fetchImages(); // Refresh images after saving
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: error.response
          ? error.response.data.message
          : "Failed to save file details. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-20 p-6 border bg-[#bdd8dd] border-gray-300 rounded-lg">
      <h2 className="text-xl font-bold mb-6">Upload Image</h2>

      {/* Step 1: Upload File */}
      <div>
        <label htmlFor="file" className="block mb-2">Image File</label>
        <input
          id="file"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {fileUploading && <p className="text-sm text-gray-500">Uploading file...</p>}
        {fileUrl && (
          <p className="text-sm text-gray-600">File URL: {fileUrl}</p>
        )}
      </div>

      {/* Step 2: Show title field only if file URL is available */}
      {fileUrl && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label htmlFor="title" className="block mb-2">Image Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full p-2 font-semibold bg-[#155e75] text-white rounded-lg hover:bg-[#135367] disabled:bg-gray-300"
          >
            {uploading ? "Saving..." : "Save Image Details"}
          </button>
        </form>
      )}

      {/* Display message based on API responses */}
      {message && (
        <div
          className={`mt-4 p-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p>{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default UploadImageLink;