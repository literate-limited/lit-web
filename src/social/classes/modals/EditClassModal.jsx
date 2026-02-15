import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function EditClassModal({ open, classData, onClose, onSuccess }) {
  const { currentTheme } = useContext(ThemeContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [requirePlacementTest, setRequirePlacementTest] = useState(true);
  const [autoAcceptStudents, setAutoAcceptStudents] = useState(false);
  const [showAchievementFeed, setShowAchievementFeed] = useState(true);
  const [saving, setSaving] = useState(false);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const inner = currentTheme?.innerContainerColor ?? "#fff";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  useEffect(() => {
    if (open && classData) {
      setName(classData.name || "");
      setDescription(classData.description || "");
      setSubject(classData.subject || "");
      setGradeLevel(classData.gradeLevel || "");
      setRequirePlacementTest(classData.settings?.requirePlacementTest ?? true);
      setAutoAcceptStudents(classData.settings?.autoAcceptStudents ?? false);
      setShowAchievementFeed(classData.settings?.showAchievementFeed ?? true);
    }
  }, [open, classData]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Class name is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/class/${classData._id}`,
        {
          name: name.trim(),
          description: description.trim(),
          subject: subject.trim(),
          gradeLevel: gradeLevel.trim(),
          settings: {
            requirePlacementTest,
            autoAcceptStudents,
            showAchievementFeed,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update class:", err);
      alert(err.response?.data?.message || "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !classData) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden"
        style={{ backgroundColor: inner, borderColor }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor }}>
          <h2 className="text-xl font-bold">Class Settings</h2>
          <button
            onClick={onClose}
            className="text-2xl opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 space-y-6">
            {/* Basic Info Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border outline-none"
                    style={{ borderColor }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
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
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Math, Science"
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
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      placeholder="e.g., 5, 10-12"
                      className="w-full px-3 py-2 rounded-lg border outline-none"
                      style={{ borderColor }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Settings */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Enrollment Settings</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={requirePlacementTest}
                    onChange={(e) => setRequirePlacementTest(e.target.checked)}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Require Placement Test</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      Students must complete a placement test before joining (recommended)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoAcceptStudents}
                    onChange={(e) => setAutoAcceptStudents(e.target.checked)}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Auto-Accept Students</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      Students can join immediately without teacher approval
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Display Settings */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Display Settings</h3>

              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={showAchievementFeed}
                  onChange={(e) => setShowAchievementFeed(e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Show Achievement Feed</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    Display student achievements and progress on class dashboard
                  </div>
                </div>
              </label>
            </div>

            {/* Class Code Info */}
            {classData.inviteCode && (
              <div className="p-4 rounded-lg bg-gray-50 border" style={{ borderColor }}>
                <div className="text-sm font-semibold mb-1">Class Invite Code</div>
                <div className="font-mono text-lg font-bold">{classData.inviteCode}</div>
                <div className="text-xs opacity-70 mt-1">
                  Students can use this code to join (or scan the QR code)
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 p-6 border-t bg-gray-50" style={{ borderColor }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm font-semibold"
              style={{ borderColor }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: buttonColor }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
