import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const UploadSounds = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Function to handle file upload and obtain the audio URL
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setAudioFile(file);
  
    if (file) {
      setFileUploading(true);
      const formData = new FormData();
      formData.append("audio", file); // Try changing "file" to "audio" if server expects this
  
      try {
        const response = await axios.post(
          `${API_URL}/audio-upload-single`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
  
        if (response.data && response.data.audioURL) {
          setAudioUrl(response.data.audioURL);
          setMessage({
            type: "success",
            text: "Audio file uploaded successfully!",
          });
        } else {
          setMessage({
            type: "error",
            text: "Failed to get audio URL. Please try again.",
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

  // Function to handle form submission to save sound details
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    // Create the data payload for the API
    const data = {
      name,
      answer,
      sound: audioUrl,
    };

    try {
      const response = await axios.post(
        `${API_URL}/create-sound`,
        data,
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
          text: "Sound saved successfully!",
        });
      } else {
        setMessage({ type: "success", text: "Sound saved successfully!" });
      }
    } catch (error) {
      console.error(
        "Upload error:",
        error.response ? error.response.data : error
      );
      setMessage({
        type: "error",
        text: error.response
          ? error.response.data.message
          : "Failed to save sound. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-20 p-6 border bg-[#bdd8dd] border-gray-300 rounded-lg">
      <h2 className="text-xl font-bold mb-6">Upload Sound</h2>
      

      {/* Step 1: Upload Audio File */}
      <div>
        <label htmlFor="audioFile" className="block mb-2">Audio File</label>
        <input
          id="audioFile"
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {fileUploading && <p className="text-sm text-gray-500">Uploading file...</p>}
        {audioUrl && (
          <p className="text-sm text-gray-600">Audio URL: {audioUrl}</p>
        )}
      </div>

      {/* Step 2: Show Name and Answer fields only if audio URL is available */}
      {audioUrl && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label htmlFor="name" className="block mb-2">Sound Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="answer" className="block mb-2">Correct Answer</label>
            <input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button type="submit" disabled={uploading} className="w-full p-2 font-semibold bg-[#155e75] text-white rounded-lg hover:bg-[#135367] disabled:bg-gray-300">
            {uploading ? "Saving..." : "Save Sound"}
          </button>
        </form>
      )}

      {/* Display message based on API responses */}
      {message && (
        <div className={`mt-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p>{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default UploadSounds;