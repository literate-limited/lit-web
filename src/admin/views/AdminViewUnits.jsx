// src/admin/views/AdminViewUnits.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import GenerateUnitModal from "../generate/GenerateUnitModal";
// TODO: create this later (optional now)
// import EditUnitModal from "../EditUnitModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminViewUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [showUnitGenerator, setShowUnitGenerator] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null); // future EditUnitModal

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${API_URL}/units`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setUnits(resp.data || []);
    } catch (err) {
      console.error("Error fetching units:", err);
      toast.error("Failed to fetch units.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const uniqueTitle = `Untitled Unit ${Date.now()}`;

      const resp = await axios.post(
        `${API_URL}/units`,
        { title: uniqueTitle, description: "", language: "en" },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      toast.success(`Unit "${resp.data?.title || uniqueTitle}" created!`);
      fetchUnits();
    } catch (err) {
      console.error("Error creating unit:", err);
      toast.error(err.response?.data?.error || "Failed to create unit.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  return (
    <div className="container mx-auto mt-16 p-6">
      <h1 className="text-4xl font-bold mb-6">Manage Units</h1>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCreateUnit}
          disabled={creating}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            creating ? "bg-gray-400 cursor-not-allowed" : "bg-teal-700 hover:bg-teal-800"
          }`}
        >
          {creating ? "Creating..." : "Create New Unit"}
        </button>

        <button
          onClick={() => setShowUnitGenerator(true)}
          className="px-6 py-3 rounded-lg text-white font-semibold bg-purple-700 hover:bg-purple-800"
        >
          Generate Unit From Text
        </button>
      </div>

      <GenerateUnitModal
        open={showUnitGenerator}
        onClose={() => setShowUnitGenerator(false)}
        onUnitCreated={fetchUnits}
      />

      <div className="mt-8">
        {loading ? (
          <p>Loading units…</p>
        ) : units.length === 0 ? (
          <p>No units found.</p>
        ) : (
          <ul className="space-y-4">
            {units.map((unit) => (
              <li
                key={unit._id}
                onClick={() => setSelectedUnit(unit)}
                className="p-4 rounded-lg shadow bg-white border cursor-pointer hover:bg-gray-100"
              >
                <h2 className="text-xl font-semibold">{unit.title}</h2>
                <p className="text-gray-600">{unit.description || "No description"}</p>

                <p className="text-sm text-gray-500 mt-2">
                  Language: {unit.language || "—"} • Lessons: {unit.lessons?.length || 0}
                </p>

                {unit.lessons?.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {unit.lessons.slice(0, 9).map((lesson, idx) => (
                      <div key={lesson._id || idx} className="p-2 border rounded bg-gray-50 text-sm">
                        <div className="font-semibold line-clamp-1">
                          {lesson.title || `Lesson ${idx + 1}`}
                        </div>
                        <div className="text-gray-600 text-xs line-clamp-2">
                          {lesson.description || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Optional next step: EditUnitModal */}
      {/* 
      <EditUnitModal
        open={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        unit={selectedUnit}
        onUnitUpdated={fetchUnits}
      />
      */}
    </div>
  );
}
