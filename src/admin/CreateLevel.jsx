import { useState, useEffect, useContext } from "react";
import axios from "axios";
import GenerateSpeakingModal from "./GenerateSpeakingModal";
import { AdminContext } from "../context/AdminContextProvider";


const API_URL = import.meta.env.VITE_API_URL;

const CreateLevel = ({ onLevelCreated }) => {
  // Various state variables including level, (level) type
  const [level, setLevel] = useState("");
  const [type, setType] = useState("vocalizing"); // Default type
  const [language, setLanguage] = useState("en"); // Default to English
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showGenModal, setShowGenModal] = useState(false);
  const [referenceVideoId, setReferenceVideoId] = useState("");
  const [successThreshold, setSuccessThreshold] = useState(0.7);
  const [trackingTarget, setTrackingTarget] = useState("hands");

  const adminContext = useContext(AdminContext);
  const videos = adminContext?.videos || [];


  const fetchNextLevel = async () => {
  try {
    // The next-level route leads to a controller which queries the db to find the currentLevelIndex + 1
    const response = await axios.get(`${API_URL}/next-level?language=${language}`);
    setLevel(response.data.nextLevel); // Auto-fill the level field
  } catch (error) {
    console.error("Failed to fetch next level:", error);
  }
};

  useEffect(() => {
  fetchNextLevel();
}, [language]);


  const handleCreateLevel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const accessToken = localStorage.getItem("token");
      if (!accessToken) {
        setErrorMessage("Authentication token not found.");
        console.log(setErrorMessage);

        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };
      console.log(headers);
      console.log("hello world");


      if (type === "sl-imitation" && !referenceVideoId) {
        setErrorMessage("Reference video is required for SL imitation.");
        setLoading(false);
        return;
      }

      const payload = { level, type, language };
      if (type === "sl-imitation") {
        payload.referenceVideoId = referenceVideoId;
        payload.successThreshold = Number(successThreshold);
        payload.trackingTarget = trackingTarget;
      }

      const response = await axios.post(
        `${API_URL}/create-level`,
        payload,
        { headers }
      );

      const { newLevel, message } = response.data;
      setSuccessMessage(message); // Set success message from API
      console.log("Created Level:", newLevel); // Log the new level
      if (onLevelCreated) {
        onLevelCreated(newLevel); // Notify parent component
      }
      fetchNextLevel(); 
    } catch (error) {
      setErrorMessage("Error creating level. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border bg-[#bdd8dd] border-gray-300 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create a New Level</h2>
      {successMessage && (
        <p className="text-green-600 mb-4">{successMessage}</p>
      )}
      {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}
      <form onSubmit={handleCreateLevel}>
        <div className="mb-4">
          <label htmlFor="level" className="block mb-2 text-lg font-semibold">
            Enter Level
          </label>
          <input
  type="number"
  id="level"
  value={level}
  onChange={(e) => setLevel(e.target.value)}
  placeholder="Auto-filled"
  required
  readOnly
  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
/>

        </div>

        <div className="mb-4">
  <label htmlFor="type" className="block mb-2 text-lg font-semibold">
    Select Level Type
  </label>
  <select
    id="type"
    value={type}
    onChange={(e) => setType(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg"
  >
    <option value="sound">Sound</option>
    <option value="video">Video</option>
    <option value="mcq">MCQ</option>
    <option value="listening">Listening</option>
    <option value="vocalizing">Vocalizing</option>
    <option value="fill-in-the-blank">Fill-in-the-blank</option>
    <option value="speaking">Speaking</option>
    <option value="info">Info</option>
    <option value="gaussianElimination">Gaussian Elimination</option>
    <option value="writing">Writing</option>
    <option value="reading">Reading</option>
    <option value="sl-imitation">SL Imitation</option>


  </select>
</div>

{type === "sl-imitation" && (
  <>
    <div className="mb-4">
      <label htmlFor="referenceVideoId" className="block mb-2 text-lg font-semibold">
        Reference Video
      </label>
      <select
        id="referenceVideoId"
        value={referenceVideoId}
        onChange={(e) => setReferenceVideoId(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
      >
        <option value="">Select video</option>
        {videos.map((v) => (
          <option key={v._id} value={v._id}>
            {v.title}
          </option>
        ))}
      </select>
    </div>

    <div className="mb-4">
      <label htmlFor="successThreshold" className="block mb-2 text-lg font-semibold">
        Success Threshold
      </label>
      <input
        id="successThreshold"
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={successThreshold}
        onChange={(e) => setSuccessThreshold(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="trackingTarget" className="block mb-2 text-lg font-semibold">
        Tracking Target
      </label>
      <select
        id="trackingTarget"
        value={trackingTarget}
        onChange={(e) => setTrackingTarget(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
      >
        <option value="hands">Hands</option>
      </select>
    </div>
  </>
)}

<div className="mb-4">
  <label
    htmlFor="language"
    className="block mb-2 text-lg font-semibold"
  >
    Select Language
  </label>
  <select
    id="language"
    value={language}
    onChange={(e) => setLanguage(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg"
  >
    <option value="en">English</option>
    <option value="hi">Hindi</option>
    <option value="fr">French</option>
    <option value="es">Spanish</option>
    <option value="pt">Portuguese</option>
    <option value="zh">Chinese</option>
    <option value="ja">Japanese</option>
    <option value="ar">Arabic</option>
    <option value="ru">Russian</option>
    <option value="it">Italian</option>
    <option value="ko">Korean</option>
    <option value="tr">Turkish</option>
    <option value="vi">Vietnamese</option>
    <option value="id">Indonesian</option>
    <option value="th">Thai</option>
    <option value="pl">Polish</option>
    <option value="nl">Dutch</option>
    <option value="sv">Swedish</option>
    <option value="fi">Finnish</option>
    <option value="no">Norwegian</option>
    <option value="da">Danish</option>
    <option value="el">Greek</option>
    <option value="hu">Hungarian</option>
    <option value="cs">Czech</option>
    <option value="ro">Romanian</option>
    <option value="bg">Bulgarian</option>
    <option value="ar">Arabic</option>
    <option value="ur">Urdu</option>
    <option value="sw">Swahili</option>
    <option value="ta">Tamil</option>
    <option value="te">Telugu</option>
    <option value="bn">Bengali</option>
    <option value="ml">Malayalam</option>
    <option value="gu">Gujarati</option>
    <option value="mr">Marathi</option>
    <option value="pa">Punjabi</option>
    <option value="kn">Kannada</option>
    <option value="si">Sinhala</option>
    <option value="th">Thai</option>
    <option value="ja">Japanese</option>
    <option value="ko">Korean</option>
    <option value="de">German</option>
    <option value="he">Hebrew</option>
    <option value="mathematics">Mathematics</option>

    
    {/* Add more languages as needed */}
  </select>
</div>


        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 font-semibold bg-[#155e75] text-white rounded-lg hover:bg-[#135367] disabled:bg-gray-300"
        >
          {loading ? "Creating..." : "Create Level"}
        </button>
      </form>

      <button
  className="mb-4 px-4 py-2 bg-teal-700 text-white rounded hover:bg-teal-800"
  onClick={() => setShowGenModal(true)}
>
  Generate Speaking Levels
</button>
<GenerateSpeakingModal
  open={showGenModal}
  onClose={() => setShowGenModal(false)}
  onDone={() => console.log("Levels generated")}
  language={language}        // current select value
/>


    </div>
  );
};

export default CreateLevel;
