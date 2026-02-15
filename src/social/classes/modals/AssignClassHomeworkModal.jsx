import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function AssignClassHomeworkModal({ open, classId, className, studentCount, onClose, onSuccess }) {
  const { currentTheme } = useContext(ThemeContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [error, setError] = useState(null);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const inner = currentTheme?.innerContainerColor ?? "#fff";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const loadLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/teaching/lessons?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllLessons(data.lessons || []);
    } catch (err) {
      console.error("Failed to load lessons:", err);
      setError(err.response?.data?.message || "Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadLessons();
      setSearchQuery("");
    }
  }, [open]);

  const filteredLessons = allLessons.filter((lesson) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      lesson.title?.toLowerCase().includes(query) ||
      lesson.description?.toLowerCase().includes(query) ||
      lesson.language?.toLowerCase().includes(query)
    );
  });

  const handleAssign = async (lesson) => {
    if (!confirm(`Assign "${lesson.title}" to all ${studentCount} students in ${className}?`)) {
      return;
    }

    setAssigning(lesson._id);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_URL}/teaching/homework/class`,
        {
          classId,
          lessonId: lesson._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Successfully assigned to ${data.count} students!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to assign homework:", err);
      setError(err.response?.data?.message || "Failed to assign homework");
    } finally {
      setAssigning(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-xl flex flex-col max-h-[80vh]"
        style={{ backgroundColor: inner, borderColor }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor }}>
          <div>
            <h2 className="text-xl font-bold">Assign Homework to Class</h2>
            <p className="text-sm opacity-70 mt-1">
              Lesson will be assigned to {studentCount} student{studentCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b" style={{ borderColor }}>
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor }}
            autoFocus
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8 opacity-70">Loading lessons...</div>
          )}

          {!loading && filteredLessons.length === 0 && (
            <div className="text-center py-8 opacity-70">
              {allLessons.length === 0
                ? "No lessons available"
                : "No lessons match your search"}
            </div>
          )}

          {!loading && filteredLessons.length > 0 && (
            <div className="space-y-2">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson._id}
                  className="p-4 rounded-lg border flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  style={{ borderColor }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{lesson.title}</div>
                    {lesson.description && (
                      <div className="text-xs opacity-70 truncate mt-0.5">
                        {lesson.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                        {lesson.language?.toUpperCase() || "EN"}
                      </span>
                      {lesson.difficulty && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Level {lesson.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssign(lesson)}
                    disabled={assigning === lesson._id}
                    className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                    style={{ backgroundColor: buttonColor }}
                  >
                    {assigning === lesson._id ? "Assigning..." : "Assign"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 border-t bg-blue-50" style={{ borderColor }}>
          <div className="text-sm text-blue-800">
            <div className="font-semibold mb-1">💡 Bulk Assignment</div>
            <div className="text-blue-700">
              This lesson will be automatically assigned to all current students in the class.
              Students can see it in their homework list immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
