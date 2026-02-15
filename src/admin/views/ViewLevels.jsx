import { useEffect, useState, useContext } from "react";
import axios from "axios";
// Adjust the import:
import { ReactSortable } from "react-sortablejs";
import { IoMdCloseCircle } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import { BiPencil } from "react-icons/bi";
import { BiMusic, BiVideo, BiText } from "react-icons/bi"; // Icons for types
import AddLevels from "./CreateLevel";
import EditLevel from "./EditLevel";
import { AdminContext } from "../context/AdminContextProvider";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaAssistiveListeningSystems } from "react-icons/fa";
import GenerateAlphabetsModal from "./GenerateAlphabetsModal"; // adjust path if needed



const API_URL = import.meta.env.VITE_API_URL;

const ViewLevels = () => {
  // Compute headers locally from token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [levels, setLevels] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [editData, setEditData] = useState({ sounds: [] });
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showAlphabetModal, setShowAlphabetModal] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");




  useContext(AdminContext);

  useEffect(() => {
    fetchLevels();
  }, [selectedLanguage]);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/levels?language=${selectedLanguage}`
      );
      setLevels(
        (response?.data?.levels || []).sort((a, b) => a.level - b.level)
      );
    } catch (error) {
      console.error("Error fetching levels:", error);
      toast.error("Failed to fetch levels.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete modal handlers
  const openConfirmModal = (level) => {
    setSelectedLevel(level);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setSelectedLevel(null);
    setIsConfirmModalOpen(false);
  };

  // Handle newly created level
  const handleLevelCreated = (newLevel) => {
    setLevels((prevLevels) => [...prevLevels, newLevel]);
  };

  // Handle delete level
  const handleDeleteLevel = async () => {
    if (!selectedLevel) return;
    try {
      await axios.delete(`${API_URL}/level/${selectedLevel._id}`, { headers });
      setLevels((prev) =>
        prev.filter((level) => level._id !== selectedLevel._id)
      );
      toast.success(`Level ${selectedLevel.level} deleted successfully.`);
      closeConfirmModal();
    } catch (error) {
      console.error("Error deleting level:", error);
      toast.error("Failed to delete level.");
      closeConfirmModal();
    }
  };

  // Edit modal handlers
  const openEditModal = (level) => {
    setEditData({ ...level });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedLevel(null);
    setEditData({ sounds: [] });
    setIsEditModalOpen(false);
  };

  // Use local order if unsaved changes exist, otherwise sort by level number.
  const displayLevels = hasChanges
    ? levels
    : [...levels].sort((a, b) => a.level - b.level);

  const handleSortChange = (newList) => {
    console.log("New order from drag:", newList); // Debugging

    const updatedLevels = newList.map((level, index) => ({
      ...level,
      level: index + 1, // Assign new numbers dynamically
    }));

    setLevels(updatedLevels);
    setHasChanges(true);
  };

  

  const handleSaveOrder = async () => {
    const reorderedData = levels.map((level, index) => ({
      _id: level._id,
      level: index + 1, // Ensure we send unique sequential numbers
    }));

    try {
      await axios.put(
        `${API_URL}/levels/reorder`,
        { levels: reorderedData },
        { headers }
      );

      toast.success("Levels reordered successfully!");

      // ✅ Keep the new order instead of re-fetching from API
      setLevels(reorderedData);
      setHasChanges(false);
    } catch (error) {
      console.error("Error reordering levels:", error);
      toast.error("Failed to reorder levels.");

      // ❗ Only fetch levels if there was an error
      fetchLevels();
    }
  };

let filteredLevels = displayLevels;

if (selectedType !== "all") {
  filteredLevels = filteredLevels.filter((lvl) => lvl.type === selectedType);
}

if (selectedDifficulty !== "all") {
  filteredLevels = filteredLevels.filter(
    (lvl) => lvl.difficulty === Number(selectedDifficulty)
  );
}



  // Render card for each level.
  const renderLevelCard = (level) => (
    <div className="relative bg-[#bdd8dd] rounded-lg shadow-md p-4">
      {level.type === "sound" && (
        <BiMusic className="absolute text-5xl right-5 bottom-5 opacity-30 text-blue-600" />
      )}
      
      {level.type === "video" && (
        <BiVideo className="absolute text-5xl right-5 bottom-5 opacity-30 text-red-600" />
      )}
      {level.type === "mcq" && (
        <BiText className="absolute text-5xl right-5 bottom-5 opacity-30 text-green-600" />
      )}
      {level.type === "listening" && (
        <FaAssistiveListeningSystems className="absolute text-5xl right-5 bottom-5 opacity-30 text-yellow-600" />
      )}
{(level.type === "fill-in-the-blank" || level.type === "writing") && (
  <BiPencil className="absolute text-5xl right-5 bottom-5 opacity-30 text-purple-600" />
)}


      <button
        onClick={() => openConfirmModal(level)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      >
        <MdDelete size={24} />
      </button>
      <button
        onClick={() => openEditModal(level)}
        className="absolute top-2 right-10 text-blue-500 hover:text-blue-700"
      >
        <MdEdit size={24} />
      </button>
      <h2 className="text-xl font-semibold mb-2">Level: {level.level}</h2>
      <p className="mb-2">
        <span className="font-semibold">Type: </span>
        {level.type === "sound"
          ? "Sound"
          : level.type === "mcq"
          ? "MCQ"
          : level.type === "video"
          ? "Video"
          : level.type === "listening"
          ? "Listening"
          : level.type === "fill-in-the-blank"
          ? "Fill-in-the-blank"
          : level.type === "vocalizing"
          ? "Vocalizing"
          : level.type}
      </p>
            <p className="mb-2">
  <span className="font-semibold">Difficulty: </span>
  {level.difficulty || "—"}
</p>
      <p className="mb-2">
        <span className="font-semibold">Points: </span>
        {level.points}
      </p>
      {level.type === "sound" && (
        <p className="mb-2">
          <span className="font-semibold">Sounds: </span>
          {level.sounds.length > 0
            ? level.sounds.map((sound) => sound.name).join(", ")
            : "No sounds available"}
        </p>
      )}
      {level.type === "gaussianElimination" && (
  <div className="mb-2">
    <span className="font-semibold">Matrix:</span>
    <pre className="whitespace-pre-wrap">{JSON.stringify(level.matrix, null, 2)}</pre>
  </div>
)}

      {(level.type === "vocalizing" || level.type === "speaking") && (
        <p className="mb-2">
          <span className="font-semibold">Texts:</span>{" "}
          {level.texts?.length > 0
            ? level.texts.join(", ")
            : "No texts available"}
        </p>
      )}


{level.type === "reading" && (
  <div className="mb-2">
    <span className="font-semibold">Reading Text:</span>{" "}
    {level.texts?.length > 0
      ? (level.texts[0].length > 100
          ? `${level.texts[0].substring(0, 100)}...`
          : level.texts[0])
      : "No text available"}
  </div>
)}

      {level.type === "video" && (
        <>
          <p className="mb-2">
            <span className="font-semibold">Video:</span>{" "}
            {level?.video?.title || "No video selected"}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Sounds:</span>{" "}
            {level.sounds.length > 0
              ? level.sounds.map((sound) => sound.name).join(", ")
              : "No sounds available"}
          </p>
        </>
      )}
      {level.type === "mcq" && (
        <p className="mb-2">
          <span className="font-semibold">MCQs:</span> {level.mcqs.length}
        </p>
      )}
      {level.type === "listening" && (
        <>
          <p className="mb-2">
            <span className="font-semibold">Image:</span>{" "}
            {level?.image?.title || "No image selected"}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Sounds:</span>{" "}
            {level.sounds.length > 0
              ? level.sounds.map((sound) => sound.name).join(", ")
              : "No sounds available"}
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto mt-16 p-4">
      <div className="flex items-center mb-4">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="p-2 mr-4 rounded border border-gray-300 bg-white"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="ar">Arabic</option>
          <option value="pt">Portuguese</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ru">Russian</option>
          <option value="it">Italian</option>
          <option value="ko">Korean</option>
          <option value="tr">Turkish</option>
          <option value="vi">Vietnamese</option>
          <option value="id">Indonesian</option>
          <option value="bn">Bengali</option>
          <option value="ta">Tamil</option>
          
          <option value="de">German</option>
          <option value="he">Hebrew</option>
          <option value="mathematics">Mathematics</option>
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 mr-4 rounded border border-gray-300 bg-white">
          <option value="all">All Types</option>
          <option value="sound">Sound</option>
          <option value="video">Video</option>
          <option value="mcq">MCQ</option>
          <option value="listening">Listening</option>
          <option value="vocalizing">Vocalizing</option>
          <option value="fill-in-the-blank">Fill-in-the-blank</option>
          <option value="speaking">Speaking</option>
          <option value="gaussianElimination">Gaussian Elimination</option>
          <option value="info">Info</option>
          <option value="reading">Reading</option>
          <option value="writing">Writing</option>

        </select>

        <select
  value={selectedDifficulty}
  onChange={(e) => setSelectedDifficulty(e.target.value)}
  className="p-2 mr-4 rounded border border-gray-300 bg-white"
>
  <option value="all">All Difficulties</option>
  {[...Array(10)].map((_, i) => (
    <option key={i + 1} value={i + 1}>
      Difficulty {i + 1}
    </option>
  ))}
</select>



        <h1 className="text-4xl font-bold">Levels</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-[#155e75] text-white mx-5 px-5 rounded-full hover:bg-[#135367]"
        >
          Add +
        </button>

  <button
    onClick={() => setShowAlphabetModal(true)}
    className="p-2 bg-purple-600 text-white px-4 rounded-full hover:bg-purple-700"
  >
    Generate Alphabets
  </button>
      </div>


      {loading ? (
        <Spinner />
      ) : (
        <ReactSortable
          list={displayLevels}
          setList={(newList) => {
            // Keep full level data during sorting
            const updatedLevels = newList.map((item, index) => {
              const fullLevel =
                levels.find((lvl) => lvl._id === item._id) || {};
              return { ...fullLevel, level: index + 1 }; // Preserve all properties
            });

            setLevels(updatedLevels);
            setHasChanges(true);
          }}
          tag="div"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          options={{ animation: 150 }}
        >
          {filteredLevels.map((level) => (
  <div key={level._id} data-id={level._id}>
    {renderLevelCard(level)}
  </div>
))}

        </ReactSortable>
      )}

      {hasChanges && (
        <button
          onClick={handleSaveOrder}
          className="mt-4 p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          SAVE
        </button>
      )}

      {/* Add Level Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#a1c1ca] rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute px-3 text-red-800 top-4 right-2 text-4xl font-bold"
            >
              <IoMdCloseCircle />
            </button>
            <AddLevels onLevelCreated={handleLevelCreated} />
          </div>
        </div>
      )}

      {/* Edit Level Modal */}
      <EditLevel
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        editData={editData}
        setEditData={setEditData}
        onLevelUpdated={fetchLevels}
      />
{showAlphabetModal && (
  <GenerateAlphabetsModal
    open={true}
    onClose={() => setShowAlphabetModal(false)}
  />
)}



      {/* Confirm Delete Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#bdd8dd] rounded-lg shadow-lg max-w-sm w-full p-6 relative">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                Level {selectedLevel?.level}
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-white rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLevel}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewLevels;
