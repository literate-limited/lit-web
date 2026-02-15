import { useState } from "react";

function PreFillWizard({ inviteTypes, inviterRoles = [], onCancel, onConfirm }) {
  const hasStudent = inviteTypes.includes("student");
  const hasParent = inviteTypes.includes("parent");
  const isTeacher = inviterRoles.includes("teacher");

  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState(isTeacher ? "self" : "");
  const [kids, setKids] = useState([]);
  const [currentKidName, setCurrentKidName] = useState("");
  const [currentKidEmail, setCurrentKidEmail] = useState("");

  const addKid = () => {
    if (!currentKidName.trim()) return;
    const newKid = {
      id: Math.random(),
      name: currentKidName.trim(),
      email: currentKidEmail.trim() || null,
    };
    setKids([...kids, newKid]);
    setCurrentKidName("");
    setCurrentKidEmail("");
  };

  const removeKid = (kidId) => {
    setKids(kids.filter((k) => k.id !== kidId));
  };

  const handleConfirm = () => {
    const data = {};
    if (hasStudent) {
      data.student = {
        subject: subject.trim() || null,
        teacherId: teacherId || null,
      };
    }
    if (hasParent) {
      data.parent = {
        kids: kids.length > 0 ? kids : [],
      };
    }
    onConfirm(data);
  };

  return (
    <div className="fixed inset-0 z-[91] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold text-slate-900">Invite Details</h2>
        <p className="mt-2 text-sm text-slate-600">
          Provide additional information for the invite types you selected.
        </p>

        <div className="mt-6 space-y-6">
          {/* Student Section */}
          {hasStudent && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="font-semibold text-slate-900">📚 Student</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Subject (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  placeholder="e.g. Spanish, Coding, Piano"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {isTeacher && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Teacher
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="teacher-self"
                      name="teacher"
                      value="self"
                      checked={teacherId === "self"}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="teacher-self" className="text-sm text-slate-700 cursor-pointer">
                      Me (default)
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    You will be assigned as the teacher for this student.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Parent Section */}
          {hasParent && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="font-semibold text-slate-900">👪 Parent</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-3">
                  Children (optional)
                </label>
                <div className="space-y-3">
                  {/* Add Kid Form */}
                  <div className="space-y-2 p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      placeholder="Child's name"
                      value={currentKidName}
                      onChange={(e) => setCurrentKidName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      placeholder="Child's email (optional)"
                      value={currentKidEmail}
                      onChange={(e) => setCurrentKidEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      onClick={addKid}
                      disabled={!currentKidName.trim()}
                    >
                      Add child
                    </button>
                  </div>

                  {/* Kids List */}
                  {kids.length > 0 && (
                    <div className="space-y-2">
                      {kids.map((kid) => (
                        <div
                          key={kid.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{kid.name}</p>
                            {kid.email && (
                              <p className="text-xs text-slate-500">{kid.email}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="text-slate-500 hover:text-slate-700 transition"
                            onClick={() => removeKid(kid.id)}
                            aria-label="Remove child"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ttv-pill rounded-2xl px-6 py-3 font-semibold text-white"
            onClick={handleConfirm}
          >
            Generate invite
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreFillWizard;
