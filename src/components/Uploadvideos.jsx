import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const UploadVideoLink = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Maximum allowed file size (10 MB in bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Handle video file upload and obtain the video URL
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setVideoFile(file);

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setMessage({
          type: "error",
          text: "The video file size must be less than 10 MB.",
        });
        return;
      }

      setFileUploading(true);
      const formData = new FormData();
      formData.append("video", file);

      try {
        const response = await axios.post(
          `${API_URL}/upload-video`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data && response.data.url) {
          setVideoUrl(response.data.url);
          setMessage({
            type: "success",
            text: "Video file uploaded successfully!",
          });
        } else {
          setMessage({
            type: "error",
            text: "Failed to get video URL. Please try again.",
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

  // Handle form submission to save video details
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    const payload = {
      title,
      link: videoUrl,
    };

    try {
      const response = await axios.post(
        `${API_URL}/create-video`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data && response.data.sound) {
        setMessage({
          type: "success",
          text: "Video details saved successfully!",
        });
      } else {
        setMessage({
          type: "success",
          text: "Video details saved successfully!",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: error.response
          ? error.response.data.message
          : "Failed to save video details. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-20 p-6 border bg-[#bdd8dd] border-gray-300 rounded-lg">
      <h2 className="text-xl font-bold mb-6">Upload Video</h2>

      {/* Step 1: Upload Video File */}
      <div>
        <label htmlFor="videoFile" className="block mb-2">Video File</label>
        <input
          id="videoFile"
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {fileUploading && <p className="text-sm text-gray-500">Uploading file...</p>}
        {videoUrl && (
          <p className="text-sm text-gray-600">Video URL: {videoUrl}</p>
        )}
      </div>

      {/* Step 2: Show title field only if video URL is available */}
      {videoUrl && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label htmlFor="title" className="block mb-2">Video Title</label>
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
            {uploading ? "Saving..." : "Save Video Details"}
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

export default UploadVideoLink;