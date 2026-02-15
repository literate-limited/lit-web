import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ThemeContext } from "../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ParentDashboard() {
  const { currentTheme } = useContext(ThemeContext);

  const [children, setChildren] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [teacherId, setTeacherId] = useState("");
  const [childId, setChildId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.backgroundColor ?? "#fff";
  const inner = currentTheme?.innerContainerColor ?? "rgba(255,255,255,0.85)";
  const textColor = currentTheme?.textColor ?? "#000";

  const activeChildren = useMemo(
    () => children.filter((c) => c.status === "active"),
    [children]
  );

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [childrenRes, contactsRes, suggestionsRes] = await Promise.all([
        axios.get(`${API_URL}/parents/children`, { headers }),
        axios.get(`${API_URL}/parents/contacts`, { headers }),
        axios.get(`${API_URL}/teaching/homework-suggestions?role=parent`, { headers }),
      ]);

      setChildren(childrenRes.data.children || []);
      setContacts(contactsRes.data.contacts || []);
      setSuggestions(suggestionsRes.data.suggestions || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load parent dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const submitSuggestion = async () => {
    if (!teacherId || !childId) {
      return alert("Select a teacher and child first.");
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const payload = { teacherId, studentId: childId, note };
      await axios.post(`${API_URL}/teaching/homework-suggestions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNote("");
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to suggest homework");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-6" style={{ backgroundColor: bg, color: textColor }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-2xl font-bold mb-2">Parent Dashboard</div>
        <p className="text-sm opacity-70 mb-6">Manage your children and suggest homework</p>

        {loading && <div className="text-center py-12 opacity-70">Loading...</div>}
        {error && <div className="text-center py-12 text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="space-y-8">
            <div className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-lg font-semibold mb-3">Your Children</div>
              {children.length === 0 ? (
                <div className="text-sm opacity-70">No children added yet.</div>
              ) : (
                <div className="space-y-2">
                  {children.map((child) => (
                    <div key={child._id} className="text-sm">
                      <span className="font-semibold">
                        {child.child?.name || child.childName || "Child"}
                      </span>{" "}
                      <span className="opacity-70">
                        ({child.child?.email || child.childEmail || ""})
                      </span>
                      <span className="ml-2 text-xs opacity-60">{child.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-lg font-semibold mb-3">Teacher Contacts</div>
              {contacts.length === 0 ? (
                <div className="text-sm opacity-70">No confirmed teacher contacts yet.</div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.invitationId} className="text-sm">
                      <span className="font-semibold">{contact.inviter?.name || "Teacher"}</span>
                      {contact.inviter?.handle && (
                        <span className="ml-2 text-xs opacity-60">@{contact.inviter.handle}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-lg font-semibold mb-3">Suggest Homework</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <select
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor }}
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                >
                  <option value="">Select teacher</option>
                  {contacts.map((contact) => (
                    <option key={contact.invitationId} value={contact.inviter?._id}>
                      {contact.inviter?.name || "Teacher"}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor }}
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                >
                  <option value="">Select child</option>
                  {activeChildren.map((child) => (
                    <option key={child._id} value={child.child?._id}>
                      {child.child?.name || child.childName || "Child"}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor }}
                rows={3}
                placeholder="Describe the homework you want to suggest..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: currentTheme?.buttonColor ?? "#0d9488" }}
                  onClick={submitSuggestion}
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send suggestion"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: inner }}>
              <div className="text-lg font-semibold mb-3">Your Suggestions</div>
              {suggestions.length === 0 ? (
                <div className="text-sm opacity-70">No suggestions yet.</div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((s) => (
                    <div key={s._id} className="rounded-lg border p-3" style={{ borderColor }}>
                      <div className="text-sm font-semibold">
                        {s.student?.name || "Student"} → {s.teacher?.name || "Teacher"}
                      </div>
                      {s.note && <div className="text-xs opacity-70 mt-1">{s.note}</div>}
                      <div className="text-xs opacity-60 mt-2">Status: {s.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
