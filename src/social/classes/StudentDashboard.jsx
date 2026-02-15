import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { DateTime } from "luxon";
import { ThemeContext } from "../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function StudentDashboard() {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [homework, setHomework] = useState([]);
  const [parentRequests, setParentRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.backgroundColor ?? "#fff";
  const inner = currentTheme?.innerContainerColor ?? "rgba(255,255,255,0.85)";
  const textColor = currentTheme?.textColor ?? "#000";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Load teachers, homework, bookings, and parent requests in parallel
      const [teachersRes, homeworkRes, bookingsRes, parentReqRes] = await Promise.all([
        axios.get(`${API_URL}/teaching/my-teachers`, { headers }),
        axios.get(`${API_URL}/teaching/homework`, { headers }),
        axios.get(`${API_URL}/booking/me`, { headers }).catch(() => ({ data: { bookings: [] } })),
        axios.get(`${API_URL}/parents/requests`, { headers }).catch(() => ({ data: { requests: [] } })),
      ]);

      setTeachers(teachersRes.data.teachers || []);
      setHomework(homeworkRes.data.homework || []);
      setBookings(bookingsRes.data.bookings || []);
      setParentRequests(parentReqRes.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const formatBookingTime = (isoString) => {
    const dt = DateTime.fromISO(isoString);
    return dt.toFormat("ccc, LLL d 'at' h:mm a");
  };

  // Filter bookings by status
  const upcomingBookings = bookings.filter(
    (b) => b.status === "ACCEPTED" && new Date(b.startISO) > new Date()
  );
  const pendingBookings = bookings.filter((b) => b.status === "PENDING" || b.status === "AWAITING_PAYMENT");

  useEffect(() => {
    loadData();
  }, []);

  const updateHomeworkStatus = async (homeworkId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/teaching/homework/${homeworkId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const respondParentRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/parents/requests/${requestId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond to parent request");
    }
  };

  const goToLesson = (lessonId) => {
    navigate(`/lesson/${lessonId}`);
  };

  const pendingHomework = homework.filter((h) => h.status !== "completed");
  const completedHomework = homework.filter((h) => h.status === "completed");

  return (
    <div
      className="w-full min-h-screen p-6"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold">Student Dashboard</div>
          <Link
            to="/booking"
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: buttonColor }}
          >
            Book a Lesson
          </Link>
        </div>
        <p className="text-sm opacity-70 mb-6">
          View your lessons, teachers, and homework
        </p>

        {loading && (
          <div className="text-center py-12 opacity-70">Loading...</div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* Upcoming Booked Lessons */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Upcoming Lessons ({upcomingBookings.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="rounded-xl border p-4"
                      style={{ borderColor, backgroundColor: inner }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{booking.hostName || "Teacher"}</div>
                          <div className="text-sm opacity-70">{formatBookingTime(booking.startISO)}</div>
                          <div className="text-xs opacity-60 mt-1">{booking.durationMinutes} minutes</div>
                          {booking.bookingType?.name && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                              {booking.bookingType.name}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending Bookings ({pendingBookings.length})
                </h2>
                <div className="space-y-3">
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="rounded-xl border p-4 flex items-center justify-between"
                      style={{ borderColor, backgroundColor: inner }}
                    >
                      <div>
                        <div className="font-semibold">{booking.hostName || "Teacher"}</div>
                        <div className="text-sm opacity-70">{formatBookingTime(booking.startISO)}</div>
                        <div className="text-xs opacity-60">{booking.durationMinutes} minutes</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            booking.status === "AWAITING_PAYMENT"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {booking.status === "AWAITING_PAYMENT" ? "Payment Required" : "Awaiting Confirmation"}
                        </span>
                        {booking.payment?.amountInCents > 0 && booking.payment?.status !== "paid" && (
                          <div className="text-xs text-orange-600 mt-1">
                            ${(booking.payment.amountInCents / 100).toFixed(2)} due
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for bookings */}
            {bookings.length === 0 && (
              <div
                className="rounded-2xl border p-6 text-center"
                style={{ borderColor, backgroundColor: inner }}
              >
                <div className="text-3xl mb-3">📅</div>
                <div className="font-semibold mb-2">No lessons booked yet</div>
                <p className="text-sm opacity-70 mb-4">
                  Browse available teachers and book your first lesson.
                </p>
                <Link
                  to="/booking"
                  className="inline-block px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: buttonColor }}
                >
                  Find a Teacher
                </Link>
              </div>
            )}

            {/* Parent Requests */}
            <div>
              <h2 className="text-lg font-bold mb-3">Parent Requests</h2>
              {parentRequests.length === 0 ? (
                <div
                  className="rounded-2xl border p-6 text-center"
                  style={{ borderColor, backgroundColor: inner }}
                >
                  <div className="text-3xl mb-3">👪</div>
                  <p className="text-sm opacity-70">No pending parent requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parentRequests.map((req) => (
                    <div
                      key={req._id}
                      className="rounded-xl border p-4 flex items-center justify-between"
                      style={{ borderColor, backgroundColor: inner }}
                    >
                      <div>
                        <div className="font-semibold">{req.parent?.name || "Parent"}</div>
                        {req.parent?.email && (
                          <div className="text-xs opacity-70">{req.parent.email}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-white text-xs"
                          style={{ backgroundColor: currentTheme?.buttonColor ?? "#0d9488" }}
                          onClick={() => respondParentRequest(req._id, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border text-xs"
                          style={{ borderColor }}
                          onClick={() => respondParentRequest(req._id, "decline")}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Teachers Section */}
            <div>
              <h2 className="text-lg font-bold mb-3">Your Teachers</h2>
              {teachers.length === 0 ? (
                <div
                  className="rounded-2xl border p-6 text-center"
                  style={{ borderColor, backgroundColor: inner }}
                >
                  <div className="text-3xl mb-3">📚</div>
                  <p className="text-sm opacity-70">
                    You don't have any teachers yet. Accept a student invitation
                    to connect with a teacher.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="rounded-xl border p-4"
                      style={{ borderColor, backgroundColor: inner }}
                    >
                      <div className="flex items-center gap-3">
                        {teacher.profilePicture ? (
                          <img
                            src={teacher.profilePicture}
                            alt={teacher.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
                          >
                            {teacher.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{teacher.name}</div>
                          {teacher.handle && (
                            <div className="text-xs opacity-70">
                              @{teacher.handle}
                            </div>
                          )}
                          <div className="mt-1">
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                              {teacher.subject || "General"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Lessons Section */}
            <div>
              <h2 className="text-lg font-bold mb-3">
                Your Assigned Lessons
                {pendingHomework.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-sm rounded-full">
                    {pendingHomework.length} pending
                  </span>
                )}
              </h2>

              {homework.length === 0 ? (
                <div
                  className="rounded-2xl border p-6 text-center"
                  style={{ borderColor, backgroundColor: inner }}
                >
                  <div className="text-3xl mb-3">🎉</div>
                  <p className="text-sm opacity-70">
                    No lessons assigned yet. Your teacher will assign lessons for you to complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending Lessons */}
                  {pendingHomework.map((hw) => (
                    <div
                      key={hw._id}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor,
                        backgroundColor: inner,
                        borderLeftWidth: "4px",
                        borderLeftColor: hw.status === "in_progress" ? "#f59e0b" : "#0d9488",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">
                            {hw.lesson?.title || "Untitled Lesson"}
                          </div>
                          {hw.lesson?.description && (
                            <p className="text-sm opacity-70 mt-1">
                              {hw.lesson.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                              From: {hw.teacher?.name || "Teacher"}
                            </span>
                            {hw.subject && (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                                {hw.subject}
                              </span>
                            )}
                            {hw.lesson?.language && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {hw.lesson.language.toUpperCase()}
                              </span>
                            )}
                            {hw.lesson?.difficulty && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                Level {hw.lesson.difficulty}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                hw.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100"
                              }`}
                            >
                              {hw.status === "assigned"
                                ? "Not started"
                                : hw.status === "in_progress"
                                ? "In progress"
                                : hw.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => goToLesson(hw.lesson?._id)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ backgroundColor: currentTheme?.buttonColor ?? "#0d9488" }}
                          >
                            {hw.status === "assigned" ? "Start Lesson" : "Continue"}
                          </button>
                          {hw.status === "assigned" && (
                            <button
                              onClick={() => updateHomeworkStatus(hw._id, "in_progress")}
                              className="px-3 py-1.5 text-xs rounded-lg border opacity-70 hover:opacity-100"
                              style={{ borderColor }}
                            >
                              Mark In Progress
                            </button>
                          )}
                          {hw.status === "in_progress" && (
                            <button
                              onClick={() => updateHomeworkStatus(hw._id, "completed")}
                              className="px-3 py-1.5 text-xs rounded-lg bg-green-500 text-white font-semibold"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Completed Lessons */}
                  {completedHomework.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold opacity-70 mb-2">
                        Completed ({completedHomework.length})
                      </h3>
                      {completedHomework.map((hw) => (
                        <div
                          key={hw._id}
                          className="rounded-xl border p-3 opacity-60 mb-2"
                          style={{ borderColor, backgroundColor: inner }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">
                                {hw.lesson?.title || "Untitled Lesson"}
                              </span>
                              <span className="ml-2 text-xs text-green-600">
                                ✓ Completed
                              </span>
                            </div>
                            <button
                              onClick={() => goToLesson(hw.lesson?._id)}
                              className="text-xs underline opacity-70 hover:opacity-100"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
