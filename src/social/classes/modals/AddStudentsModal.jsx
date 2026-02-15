import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function AddStudentsModal({ open, classId, onClose, onSuccess }) {
  const { currentTheme } = useContext(ThemeContext);
  const [tab, setTab] = useState("existing"); // 'existing' | 'invite'

  // Existing students tab
  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Invite new tab
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const inner = currentTheme?.innerContainerColor ?? "#fff";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const loadStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/teaching/my-students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadStudents();
      setSelectedStudents([]);
      setSearchQuery("");
      setInviteName("");
      setInviteEmail("");
    }
  }, [open]);

  const filteredStudents = allStudents.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.handle?.toLowerCase().includes(query)
    );
  });

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddSelected = async () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    setAdding(true);
    try {
      const token = localStorage.getItem("token");

      // Add each student to class
      for (const studentId of selectedStudents) {
        await axios.post(
          `${API_URL}/class/add-student`,
          { classId, studentId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to add students:", err);
      alert(err.response?.data?.message || "Failed to add students");
    } finally {
      setAdding(false);
    }
  };

  const handleInviteNew = async (e) => {
    e.preventDefault();

    if (!inviteName.trim() || !inviteEmail.trim()) {
      alert("Name and email are required");
      return;
    }

    setInviting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/inviteStudent`,
        {
          name: inviteName,
          email: inviteEmail,
          classId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Invitation sent successfully!");
      setInviteName("");
      setInviteEmail("");
      onSuccess();
    } catch (err) {
      console.error("Failed to invite student:", err);
      alert(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
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
          <h2 className="text-xl font-bold">Add Students</h2>
          <button
            onClick={onClose}
            className="text-2xl opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor }}>
          <button
            onClick={() => setTab("existing")}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              tab === "existing" ? "border-b-2 text-teal-600" : "opacity-60"
            }`}
            style={tab === "existing" ? { borderColor: buttonColor } : undefined}
          >
            Existing Students
          </button>
          <button
            onClick={() => setTab("invite")}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              tab === "invite" ? "border-b-2 text-teal-600" : "opacity-60"
            }`}
            style={tab === "invite" ? { borderColor: buttonColor } : undefined}
          >
            Invite New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "existing" && (
            <div>
              {/* Search */}
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none mb-4"
                style={{ borderColor }}
              />

              {/* Student List */}
              {loading && (
                <div className="text-center py-8 opacity-70">Loading students...</div>
              )}

              {!loading && filteredStudents.length === 0 && (
                <div className="text-center py-8 opacity-70">
                  {allStudents.length === 0
                    ? "No students found. Invite new students first."
                    : "No students match your search."}
                </div>
              )}

              {!loading && filteredStudents.length > 0 && (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <label
                      key={student._id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleStudent(student._id)}
                        className="w-4 h-4"
                      />

                      {student.profilePicture ? (
                        <img
                          src={student.profilePicture}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                          {student.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-xs opacity-70">
                          {student.handle ? `@${student.handle}` : student.email}
                        </div>
                      </div>

                      {student.subject && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                          {student.subject}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "invite" && (
            <form onSubmit={handleInviteNew} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="student@email.com"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor }}
                />
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                <div className="font-semibold text-blue-800 mb-1">📧 Email Invitation</div>
                <div className="text-blue-700">
                  An email will be sent to the student with instructions to join this class.
                </div>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: buttonColor }}
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          )}
        </div>

        {/* Footer Actions (Existing Students Tab Only) */}
        {tab === "existing" && (
          <div className="flex items-center justify-between p-6 border-t" style={{ borderColor }}>
            <div className="text-sm opacity-70">
              {selectedStudents.length > 0 ? (
                <span className="font-semibold">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
                </span>
              ) : (
                "Select students to add"
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border text-sm font-semibold"
                style={{ borderColor }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                disabled={adding || selectedStudents.length === 0}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: buttonColor }}
              >
                {adding ? "Adding..." : "Add Selected"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
