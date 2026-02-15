import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { DateTime } from "luxon";
import { ThemeContext } from "../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/* ------------------ Assign Lesson Modal ------------------ */
function AssignLessonModal({ open, student, onClose, onSuccess, currentTheme }) {
  const [search, setSearch] = useState("");
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [error, setError] = useState(null);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.innerContainerColor ?? "#fff";
  const textColor = currentTheme?.textColor ?? "#000";

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setError(null);
    }
  }, [open]);

  // Load all lessons when modal opens
  useEffect(() => {
    if (!open) return;

    const loadLessons = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${API_URL}/teaching/lessons?limit=500`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAllLessons(data.lessons || []);
      } catch (err) {
        console.error("Failed to load lessons:", err);
        setAllLessons([]);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [open]);

  // Filter lessons based on search
  const lessons = allLessons.filter((lesson) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      lesson.title?.toLowerCase().includes(searchLower) ||
      lesson.description?.toLowerCase().includes(searchLower) ||
      lesson.language?.toLowerCase().includes(searchLower)
    );
  });

  const handleAssign = async (lesson) => {
    setAssigning(lesson._id);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/teaching/homework`,
        {
          studentId: student._id,
          lessonId: lesson._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign lesson");
    } finally {
      setAssigning(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-xl p-5 max-h-[80vh] flex flex-col"
        style={{ backgroundColor: bg, borderColor, color: textColor }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">
            Assign Lesson to {student?.name}
          </div>
          <button
            onClick={onClose}
            className="text-2xl opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>

        {/* Search input */}
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg border outline-none mb-4"
          style={{ borderColor }}
          placeholder="Filter lessons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {error && (
          <div className="text-red-500 text-sm mb-3">{error}</div>
        )}

        {/* Lessons list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && (
            <div className="text-center py-8 opacity-70">Loading lessons...</div>
          )}

          {!loading && lessons.length === 0 && (
            <div className="text-center py-8 opacity-70">
              {search ? "No lessons match your search" : "No lessons available"}
            </div>
          )}

          {!loading && lessons.map((lesson) => (
            <div
              key={lesson._id}
              className="p-3 rounded-lg border flex items-center justify-between gap-3"
              style={{ borderColor }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{lesson.title}</div>
                {lesson.description && (
                  <div className="text-xs opacity-70 truncate">
                    {lesson.description}
                  </div>
                )}
                <div className="flex gap-2 mt-1">
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
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 whitespace-nowrap"
                style={{ backgroundColor: currentTheme?.buttonColor ?? "#0d9488" }}
              >
                {assigning === lesson._id ? "..." : "Assign"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------ Teacher Dashboard ------------------ */
export default function TeacherDashboard() {
  const { currentTheme } = useContext(ThemeContext);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionError, setSuggestionError] = useState(null);

  // Assign modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Homework per student (for showing count)
  const [homeworkCounts, setHomeworkCounts] = useState({});

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingActionLoading, setBookingActionLoading] = useState(null);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.backgroundColor ?? "#fff";
  const inner = currentTheme?.innerContainerColor ?? "rgba(255,255,255,0.85)";
  const textColor = currentTheme?.textColor ?? "#000";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/booking/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    setBookingActionLoading(bookingId);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/booking/${bookingId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadBookings();
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
    } finally {
      setBookingActionLoading(null);
    }
  };

  const formatBookingTime = (isoString) => {
    const dt = DateTime.fromISO(isoString);
    return dt.toFormat("ccc, LLL d 'at' h:mm a");
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const upcomingBookings = bookings.filter(
    (b) => b.status === "ACCEPTED" && new Date(b.startISO) > new Date()
  );

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    setSuggestionError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/teaching/my-students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(data.students || []);

      // Load homework counts for each student
      const counts = {};
      for (const student of data.students || []) {
        try {
          const hwRes = await axios.get(
            `${API_URL}/teaching/homework?role=teacher&studentId=${student._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const pending = (hwRes.data.homework || []).filter(
            (h) => h.status !== "completed"
          ).length;
          counts[student._id] = pending;
        } catch {
          counts[student._id] = 0;
        }
      }
      setHomeworkCounts(counts);

      const suggestionsRes = await axios.get(
        `${API_URL}/teaching/homework-suggestions?role=teacher`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(suggestionsRes.data.suggestions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students");
      setSuggestionError(err.response?.data?.message || "Failed to load parent suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadBookings();
  }, []);

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setAssignModalOpen(true);
  };

  const reviewSuggestion = async (suggestionId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/teaching/homework-suggestions/${suggestionId}/review`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadStudents();
    } catch (err) {
      setSuggestionError(err.response?.data?.message || "Failed to review suggestion");
    }
  };

  return (
    <div
      className="w-full min-h-screen p-6"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold">Teacher Dashboard</div>
          <div className="flex gap-2">
            <Link
              to="/availability-settings"
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: buttonColor }}
            >
              Availability Settings
            </Link>
            <Link
              to="/booking"
              className="px-4 py-2 rounded-lg border text-sm font-semibold"
              style={{ borderColor }}
            >
              View Calendar
            </Link>
            <Link
              to="/invitations"
              className="px-4 py-2 rounded-lg border text-sm font-semibold"
              style={{ borderColor }}
            >
              Invitations
            </Link>
          </div>
        </div>
        <p className="text-sm opacity-70 mb-6">
          Manage your bookings, students, and lessons
        </p>

        {/* Pending Booking Requests */}
        {!bookingsLoading && pendingBookings.length > 0 && (
          <div className="mb-8">
            <div className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Booking Requests ({pendingBookings.length})
            </div>
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="rounded-xl border p-4 flex items-center justify-between gap-4"
                  style={{ borderColor, backgroundColor: inner }}
                >
                  <div className="flex-1">
                    <div className="font-semibold">{booking.guestName}</div>
                    <div className="text-sm opacity-70">{booking.guestEmail}</div>
                    <div className="text-sm mt-1">
                      {formatBookingTime(booking.startISO)} ({booking.durationMinutes}m)
                    </div>
                    {booking.bookingType?.name && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {booking.bookingType.name}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleBookingAction(booking._id, "accept")}
                      disabled={bookingActionLoading === booking._id}
                      className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                      style={{ backgroundColor: "#22c55e" }}
                    >
                      {bookingActionLoading === booking._id ? "..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookingAction(booking._id, "reject")}
                      disabled={bookingActionLoading === booking._id}
                      className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50"
                      style={{ borderColor }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Lessons */}
        {!bookingsLoading && upcomingBookings.length > 0 && (
          <div className="mb-8">
            <div className="text-lg font-bold mb-3">
              Upcoming Lessons ({upcomingBookings.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingBookings.slice(0, 6).map((booking) => (
                <div
                  key={booking._id}
                  className="rounded-xl border p-4"
                  style={{ borderColor, backgroundColor: inner }}
                >
                  <div className="font-semibold">{booking.guestName}</div>
                  <div className="text-sm opacity-70">{formatBookingTime(booking.startISO)}</div>
                  <div className="text-xs opacity-60 mt-1">{booking.durationMinutes} minutes</div>
                  {booking.bookingType?.name && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                      {booking.bookingType.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {upcomingBookings.length > 6 && (
              <Link
                to="/booking"
                className="inline-block mt-3 text-sm font-semibold underline"
                style={{ color: buttonColor }}
              >
                View all {upcomingBookings.length} upcoming lessons
              </Link>
            )}
          </div>
        )}

        {/* Empty state for bookings */}
        {!bookingsLoading && bookings.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-center mb-8"
            style={{ borderColor, backgroundColor: inner }}
          >
            <div className="text-3xl mb-3">📅</div>
            <div className="font-semibold mb-2">No bookings yet</div>
            <p className="text-sm opacity-70 mb-4">
              Set up your availability so students can book lessons with you.
            </p>
            <Link
              to="/availability-settings"
              className="inline-block px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: buttonColor }}
            >
              Set Up Availability
            </Link>
          </div>
        )}

        {/* Students Section */}
        <div className="text-lg font-bold mb-3">My Students</div>

        {loading && (
          <div className="text-center py-12 opacity-70">Loading students...</div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">{error}</div>
        )}

        {!loading && !error && students.length === 0 && (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ borderColor, backgroundColor: inner }}
          >
            <div className="text-4xl mb-4">👨‍🏫</div>
            <div className="font-semibold mb-2">No students yet</div>
            <p className="text-sm opacity-70">
              Invite students from the{" "}
              <a href="/invitations" className="underline">
                Invitations page
              </a>{" "}
              using the "Student" invite type.
            </p>
          </div>
        )}

        {!loading && students.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-12 text-xs font-semibold px-4 py-3"
              style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            >
              <div className="col-span-4">Student</div>
              <div className="col-span-3">Subject</div>
              <div className="col-span-2">Assigned Lessons</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Rows */}
            {students.map((student) => (
              <div
                key={student._id}
                className="grid grid-cols-12 px-4 py-3 items-center border-t"
                style={{ borderColor, backgroundColor: inner }}
              >
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
                      >
                        {student.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{student.name}</div>
                      {student.handle && (
                        <div className="text-xs opacity-70">@{student.handle}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-3">
                  <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                    {student.subject || "General"}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="font-semibold">
                    {homeworkCounts[student._id] || 0}
                  </span>
                  <span className="text-xs opacity-70 ml-1">pending</span>
                </div>

                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={() => openAssignModal(student)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: currentTheme?.buttonColor ?? "#0d9488" }}
                  >
                    Assign Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-8">
            <div className="text-lg font-bold mb-2">Parent Suggestions</div>
            {suggestionError && (
              <div className="text-sm text-red-500 mb-2">{suggestionError}</div>
            )}
            {suggestions.length === 0 ? (
              <div
                className="rounded-2xl border p-6 text-center"
                style={{ borderColor, backgroundColor: inner }}
              >
                <div className="text-3xl mb-3">👪</div>
                <p className="text-sm opacity-70">No parent suggestions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <div
                    key={s._id}
                    className="rounded-xl border p-4 flex items-start justify-between gap-4"
                    style={{ borderColor, backgroundColor: inner }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {s.parent?.name || "Parent"} → {s.student?.name || "Student"}
                      </div>
                      {s.note && <div className="text-xs opacity-70 mt-1">{s.note}</div>}
                      <div className="text-xs opacity-60 mt-2">Status: {s.status}</div>
                    </div>
                    {s.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-white text-xs"
                          style={{ backgroundColor: currentTheme?.buttonColor ?? "#0d9488" }}
                          onClick={() => reviewSuggestion(s._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border text-xs"
                          style={{ borderColor }}
                          onClick={() => reviewSuggestion(s._id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AssignLessonModal
        open={assignModalOpen}
        student={selectedStudent}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={loadStudents}
        currentTheme={currentTheme}
        key={selectedStudent?._id || "modal"}
      />
    </div>
  );
}
