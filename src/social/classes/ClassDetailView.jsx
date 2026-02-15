import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import ClassQRCodeModal from "./modals/ClassQRCodeModal";
import AddStudentsModal from "./modals/AddStudentsModal";
import AssignClassHomeworkModal from "./modals/AssignClassHomeworkModal";
import EditClassModal from "./modals/EditClassModal";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ClassDetailView() {
  const { currentTheme } = useContext(ThemeContext);
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [homework, setHomework] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("roster");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showAssignHomeworkModal, setShowAssignHomeworkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.backgroundColor ?? "#fff";
  const inner = currentTheme?.innerContainerColor ?? "rgba(255,255,255,0.85)";
  const textColor = currentTheme?.textColor ?? "#000";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const loadClassData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [classRes, homeworkRes, achievementsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/class/${classId}`, { headers }),
        axios.get(`${API_URL}/teaching/homework/class/${classId}`, { headers }),
        axios.get(`${API_URL}/class/${classId}/achievements`, { headers }),
        axios.get(`${API_URL}/class/${classId}/analytics`, { headers }),
      ]);

      setClassData(classRes.data.class);
      setHomework(homeworkRes.data.lessons || []);
      setAchievements(achievementsRes.data.achievements || []);
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error("Failed to load class data:", err);
      setError(err.response?.data?.message || "Failed to load class");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!confirm(`Remove ${studentName} from this class?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/class/${classId}/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reload class data
      await loadClassData();
    } catch (err) {
      console.error("Failed to remove student:", err);
      alert(err.response?.data?.message || "Failed to remove student");
    }
  };

  const handleArchiveClass = async () => {
    if (!confirm("Archive this class? You can unarchive it later.")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/classes");
    } catch (err) {
      console.error("Failed to archive class:", err);
      alert(err.response?.data?.message || "Failed to archive class");
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="text-center">
          <div className="text-xl font-semibold" style={{ color: textColor }}>Loading class...</div>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="text-center">
          <div className="text-xl font-semibold text-red-500 mb-4">{error || "Class not found"}</div>
          <Link to="/classes" className="text-sm underline" style={{ color: buttonColor }}>
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6" style={{ backgroundColor: bg, color: textColor }}>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to="/classes" className="inline-flex items-center gap-2 mb-4 text-sm opacity-70 hover:opacity-100">
          ← Back to Classes
        </Link>

        {/* Class Header */}
        <div className="rounded-2xl border p-6 mb-6" style={{ borderColor, backgroundColor: inner }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              {classData.description && (
                <p className="text-sm opacity-80 mt-2">{classData.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm">
                {classData.subject && (
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-semibold">
                    {classData.subject}
                  </span>
                )}
                {classData.gradeLevel && (
                  <span className="opacity-70">Grade {classData.gradeLevel}</span>
                )}
                <span className="opacity-70">•</span>
                <span className="font-semibold">{classData.students?.length || 0}</span>
                <span className="opacity-70">students</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowQRModal(true)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: buttonColor }}
              >
                📱 QR Code
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-lg border text-sm font-semibold"
                style={{ borderColor }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleArchiveClass}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-red-600"
                style={{ borderColor }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-xs opacity-60 mb-1">Completion Rate</div>
              <div className="text-2xl font-bold">{analytics.homework?.completionRate || 0}%</div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-xs opacity-60 mb-1">Total Assignments</div>
              <div className="text-2xl font-bold">{analytics.homework?.total || 0}</div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-xs opacity-60 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-600">{analytics.homework?.completed || 0}</div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-xs opacity-60 mb-1">Recent Activity (7d)</div>
              <div className="text-2xl font-bold">{analytics.activity?.recentCompletions || 0}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor }}>
          <button
            onClick={() => setActiveTab("roster")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "roster" ? "border-b-2 text-teal-600" : "opacity-60"
            }`}
            style={activeTab === "roster" ? { borderColor: buttonColor } : undefined}
          >
            Roster
          </button>
          <button
            onClick={() => setActiveTab("homework")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "homework" ? "border-b-2 text-teal-600" : "opacity-60"
            }`}
            style={activeTab === "homework" ? { borderColor: buttonColor } : undefined}
          >
            Homework
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "achievements" ? "border-b-2 text-teal-600" : "opacity-60"
            }`}
            style={activeTab === "achievements" ? { borderColor: buttonColor } : undefined}
          >
            Achievements
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "roster" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Student Roster</h2>
              <button
                onClick={() => setShowAddStudentsModal(true)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: buttonColor }}
              >
                + Add Students
              </button>
            </div>

            {classData.students && classData.students.length > 0 ? (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor }}>
                <div className="grid grid-cols-12 text-xs font-semibold px-4 py-3 bg-gray-50">
                  <div className="col-span-5">Student</div>
                  <div className="col-span-2">Handle</div>
                  <div className="col-span-2 text-center">Completion Rate</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                {classData.students.map((student) => {
                  const studentAnalytics = analytics?.students?.find(
                    (s) => s.student.id.toString() === student._id.toString()
                  );

                  return (
                    <div
                      key={student._id}
                      className="grid grid-cols-12 px-4 py-3 items-center border-t"
                      style={{ borderColor, backgroundColor: inner }}
                    >
                      <div className="col-span-5 flex items-center gap-3">
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
                        <div>
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-xs opacity-70">{student.email}</div>
                        </div>
                      </div>

                      <div className="col-span-2 text-sm">
                        {student.handle ? `@${student.handle}` : "—"}
                      </div>

                      <div className="col-span-2 text-center">
                        {studentAnalytics ? (
                          <span className="font-semibold">{studentAnalytics.completionRate}%</span>
                        ) : (
                          <span className="opacity-60">—</span>
                        )}
                      </div>

                      <div className="col-span-3 flex justify-end gap-2">
                        <button
                          onClick={() => handleRemoveStudent(student._id, student.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border p-12 text-center" style={{ borderColor, backgroundColor: inner }}>
                <div className="text-4xl mb-3">👥</div>
                <div className="font-semibold mb-2">No students yet</div>
                <p className="text-sm opacity-70 mb-4">Add students to get started</p>
                <button
                  onClick={() => setShowAddStudentsModal(true)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: buttonColor }}
                >
                  Add Students
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "homework" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Class Homework</h2>
              <button
                onClick={() => setShowAssignHomeworkModal(true)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: buttonColor }}
              >
                + Assign to Class
              </button>
            </div>

            {homework && homework.length > 0 ? (
              <div className="space-y-3">
                {homework.map((item) => (
                  <div
                    key={item.lesson._id}
                    className="rounded-xl border p-4"
                    style={{ borderColor, backgroundColor: inner }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold">{item.lesson.title}</h3>
                        {item.lesson.description && (
                          <p className="text-sm opacity-70 mt-1">{item.lesson.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                        {item.lesson.language?.toUpperCase() || "EN"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-70">Progress</span>
                        <span className="font-semibold">{item.completionRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-green-600">{item.completed}</span>
                        <span className="opacity-70 ml-1">completed</span>
                      </div>
                      <div>
                        <span className="font-semibold text-yellow-600">{item.inProgress}</span>
                        <span className="opacity-70 ml-1">in progress</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">{item.assigned}</span>
                        <span className="opacity-70 ml-1">not started</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border p-12 text-center" style={{ borderColor, backgroundColor: inner }}>
                <div className="text-4xl mb-3">📝</div>
                <div className="font-semibold mb-2">No homework assigned</div>
                <p className="text-sm opacity-70 mb-4">Assign lessons to your class</p>
                <button
                  onClick={() => setShowAssignHomeworkModal(true)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: buttonColor }}
                >
                  Assign Homework
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "achievements" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Achievements</h2>

            {achievements && achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="rounded-xl border p-4 flex items-start gap-4"
                    style={{ borderColor, backgroundColor: inner }}
                  >
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {achievement.student?.profilePicture ? (
                          <img
                            src={achievement.student.profilePicture}
                            alt={achievement.student.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                            {achievement.student?.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div className="font-semibold">{achievement.student?.name}</div>
                      </div>
                      <div className="font-semibold text-sm">{achievement.title}</div>
                      <div className="text-sm opacity-70">{achievement.description}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {new Date(achievement.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border p-12 text-center" style={{ borderColor, backgroundColor: inner }}>
                <div className="text-4xl mb-3">🏆</div>
                <div className="font-semibold mb-2">No achievements yet</div>
                <p className="text-sm opacity-70">Student achievements will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ClassQRCodeModal
        open={showQRModal}
        classId={classId}
        className={classData?.name}
        onClose={() => setShowQRModal(false)}
      />

      <AddStudentsModal
        open={showAddStudentsModal}
        classId={classId}
        onClose={() => setShowAddStudentsModal(false)}
        onSuccess={loadClassData}
      />

      <AssignClassHomeworkModal
        open={showAssignHomeworkModal}
        classId={classId}
        className={classData?.name}
        studentCount={classData?.students?.length || 0}
        onClose={() => setShowAssignHomeworkModal(false)}
        onSuccess={loadClassData}
      />

      <EditClassModal
        open={showEditModal}
        classData={classData}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadClassData}
      />
    </div>
  );
}
