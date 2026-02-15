// src/pages/ViewLessons.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../../components/Spinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useLessonGame } from "../../hooks/useLesson";

const API_URL = import.meta.env.VITE_API_URL;

const ViewLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const { startLesson } = useLessonGame();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/lessons`);
      setLessons(response.data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast.error("Failed to fetch lessons.");
    } finally {
      setLoading(false);
    }
  };

  const renderLessonCard = (lesson) => (
    <div
      key={lesson._id}
      className="
        rounded-lg shadow-md p-6 cursor-pointer transition
        hover:shadow-lg hover:scale-[1.01]
        bg-white/70 backdrop-blur-sm
      "
      onClick={() => {
        startLesson(lesson);
        navigate("/home");
      }}
    >
      <h2 className="text-2xl font-semibold mb-2">
        {lesson.title}
      </h2>
      <p className="mb-2 text-gray-700">
        {lesson.description}
      </p>
      <p className="mb-2 text-sm text-gray-500">
        Language: {lesson.language} • Levels: {lesson.levels?.length || 0}
      </p>
    </div>
  );

  return (
    <div className="container mx-auto mt-16 p-4">
      <h1 className="text-4xl font-bold mb-6">Lessons</h1>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map(renderLessonCard)}
        </div>
      )}
    </div>
  );
};

export default ViewLessons;
