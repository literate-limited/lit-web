import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ClassDashboard() {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("active"); // 'active' | 'archived' | 'all'
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.backgroundColor ?? "#fff";
  const inner = currentTheme?.innerContainerColor ?? "rgba(255,255,255,0.85)";
  const textColor = currentTheme?.textColor ?? "#000";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/class/my-classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(data.classes || []);
    } catch (err) {
      console.error("Failed to load classes:", err);
      setError(err.response?.data?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Filter classes
  const filteredClasses = classes
    .filter((cls) => {
      if (filter === "active") return !cls.isArchived;
      if (filter === "archived") return cls.isArchived;
      return true;
    })
    .filter((cls) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        cls.name?.toLowerCase().includes(query) ||
        cls.subject?.toLowerCase().includes(query) ||
        cls.gradeLevel?.toLowerCase().includes(query)
      );
    });

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const description = formData.get("description");
    const subject = formData.get("subject");
    const gradeLevel = formData.get("gradeLevel");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const { data } = await axios.post(
        `${API_URL}/class/createClass`,
        {
          name,
          description,
          subject,
          gradeLevel,
          teacherId: user._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClasses([...classes, data.class]);
      setShowCreateModal(false);
      e.target.reset();
    } catch (err) {
      console.error("Failed to create class:", err);
      alert(err.response?.data?.message || "Failed to create class");
    }
  };

  return (
    <div
      className="w-full min-h-screen p-6"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-sm opacity-70 mt-1">
              Manage your classes, students, and assignments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: buttonColor }}
          >
            + Create New Class
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === "active"
                  ? "bg-teal-500 text-white"
                  : "border text-gray-600"
              }`}
              style={
                filter !== "active"
                  ? { borderColor, backgroundColor: inner }
                  : undefined
              }
            >
              Active
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === "archived"
                  ? "bg-teal-500 text-white"
                  : "border text-gray-600"
              }`}
              style={
                filter !== "archived"
                  ? { borderColor, backgroundColor: inner }
                  : undefined
              }
            >
              Archived
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === "all"
                  ? "bg-teal-500 text-white"
                  : "border text-gray-600"
              }`}
              style={
                filter !== "all"
                  ? { borderColor, backgroundColor: inner }
                  : undefined
              }
            >
              All
            </button>
          </div>

          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor, backgroundColor: inner }}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 opacity-70">Loading classes...</div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 text-red-500">{error}</div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredClasses.length === 0 && (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ borderColor, backgroundColor: inner }}
          >
            <div className="text-5xl mb-4">📚</div>
            <div className="font-semibold mb-2">
              {classes.length === 0
                ? "No classes yet"
                : "No classes match your filters"}
            </div>
            <p className="text-sm opacity-70 mb-4">
              {classes.length === 0
                ? "Create your first class to get started"
                : "Try adjusting your search or filters"}
            </p>
            {classes.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: buttonColor }}
              >
                Create Your First Class
              </button>
            )}
          </div>
        )}

        {/* Class Grid */}
        {!loading && !error && filteredClasses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls._id}
                onClick={() => navigate(`/class/${cls._id}`)}
                className="rounded-xl border p-5 cursor-pointer hover:shadow-lg transition-shadow"
                style={{ borderColor, backgroundColor: inner }}
              >
                {/* Class Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg truncate">{cls.name}</h3>
                    {cls.subject && (
                      <p className="text-xs opacity-70">{cls.subject}</p>
                    )}
                  </div>
                  {cls.isArchived && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                      Archived
                    </span>
                  )}
                </div>

                {/* Description */}
                {cls.description && (
                  <p className="text-sm opacity-80 mb-3 line-clamp-2">
                    {cls.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">
                      {cls.students?.length || 0}
                    </span>
                    <span className="opacity-70">students</span>
                  </div>
                  {cls.gradeLevel && (
                    <div className="flex items-center gap-1">
                      <span className="opacity-70">Grade {cls.gradeLevel}</span>
                    </div>
                  )}
                </div>

                {/* Invite Code */}
                {cls.inviteCode && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor }}>
                    <div className="text-xs opacity-70">Invite Code</div>
                    <div className="text-sm font-mono font-semibold">
                      {cls.inviteCode}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4">
          <div
            className="w-full max-w-md rounded-2xl border shadow-xl p-6"
            style={{ backgroundColor: inner, borderColor }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Class</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-2xl opacity-60 hover:opacity-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Math 101"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of the class"
                  className="w-full px-3 py-2 rounded-lg border outline-none resize-none"
                  style={{ borderColor }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="e.g., Math"
                    className="w-full px-3 py-2 rounded-lg border outline-none"
                    style={{ borderColor }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    name="gradeLevel"
                    placeholder="e.g., 5"
                    className="w-full px-3 py-2 rounded-lg border outline-none"
                    style={{ borderColor }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold"
                  style={{ borderColor }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: buttonColor }}
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
