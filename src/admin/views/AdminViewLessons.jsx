// src/admin/views/AdminViewLessons.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import EditLessonModal from "../EditLessonModal";
import GenerateLessonModal from "../generate/GenerateLessonModal";
import GenerateReadingLessonModal from "../generate/GenerateReadingLessonModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminViewLessons() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [showReadingGenerator, setShowReadingGenerator] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

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

  const handleCreateLesson = async () => {
    setCreating(true);
    try {
      const uniqueTitle = `Untitled Lesson ${Date.now()}`;
      const response = await axios.post(`${API_URL}/lessons`, {
        title: uniqueTitle,
        description: "",
        language: "en",
      });

      toast.success(`Lesson "${response.data.title}" created!`);
      fetchLessons(); // refresh
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error(error.response?.data?.error || "Failed to create lesson.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // helper for showing level texts
  const renderTexts = (lvl) =>
    Array.isArray(lvl?.texts) && lvl.texts.length > 0 ? lvl.texts.join(" ") : "";

  return (
    <div className="container mx-auto mt-16 p-6">
      <h1 className="text-4xl font-bold mb-6">Manage Lessons</h1>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCreateLesson}
          disabled={creating}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            creating ? "bg-gray-400 cursor-not-allowed" : "bg-teal-700 hover:bg-teal-800"
          }`}
        >
          {creating ? "Creating..." : "Create New Lesson"}
        </button>

        <button
          onClick={() => setShowGenerator(true)}
          className="px-6 py-3 rounded-lg text-white font-semibold bg-blue-700 hover:bg-blue-800"
        >
          Generate Lesson From Text
        </button>

        <button
          onClick={() => setShowReadingGenerator(true)}
          className="px-6 py-3 rounded-lg text-white font-semibold bg-purple-700 hover:bg-purple-800"
        >
          Generate Reading Lesson
        </button>
      </div>

      <GenerateLessonModal
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onLessonCreated={fetchLessons}
      />

      <GenerateReadingLessonModal
        open={showReadingGenerator}
        onClose={() => setShowReadingGenerator(false)}
        onLessonCreated={fetchLessons}
      />

      <div className="mt-8">
        {loading ? (
          <p>Loading lessons…</p>
        ) : lessons.length === 0 ? (
          <p>No lessons found.</p>
        ) : (
          <ul className="space-y-4">
            {lessons.map((lesson) => (
              <li
                key={lesson._id}
                onClick={() => setSelectedLesson(lesson)}
                className="p-4 rounded-lg shadow bg-white border cursor-pointer hover:bg-gray-100"
              >
                <h2 className="text-xl font-semibold">{lesson.title}</h2>
                <p className="text-gray-600">
                  {lesson.description || "No description"}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Language: {lesson.language} • Levels: {lesson.levels?.length || 0}
                </p>

                {/* Display levels inside lesson card */}
                {lesson.levels?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {lesson.levels.map((lvl) => (
                      <div
                        key={lvl._id || `${lesson._id}-${lvl.level || lvl.type}`}
                        className="p-2 border rounded bg-gray-50 text-sm"
                      >
                        <h4 className="font-semibold">
                          {typeof lvl.level === "number" ? `Level ${lvl.level}` : "Level"}{" "}
                          {lvl.type ? `— ${lvl.type}` : ""}
                        </h4>
                        {renderTexts(lvl) && (
                          <p className="text-gray-600 line-clamp-2">{renderTexts(lvl)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditLessonModal
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
        onLessonUpdated={fetchLessons}
      />
    </div>
  );
}
