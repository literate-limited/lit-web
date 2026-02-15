import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { IoMdCloseCircle } from "react-icons/io";
import { ThemeContext } from "../utils/themes/ThemeContext";
import EditLevel from "./EditLevel"; // ← NEW
const API_URL = import.meta.env.VITE_API_URL;

const EditLessonModal = ({ open, onClose, lesson, onLessonUpdated }) => {
  const { currentTheme } = useContext(ThemeContext);

  // Compute headers locally from token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [levelsCatalog, setLevelsCatalog] = useState([]);
  const [lessonLevels, setLessonLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [lessonUnits, setLessonUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [isScrutiniseOpen, setScrutiniseOpen] = useState(false);
  const [scrutinyModels, setScrutinyModels] = useState([]);
  const [selectedScrutinyModel, setSelectedScrutinyModel] = useState("");
  const [scrutinyLoading, setScrutinyLoading] = useState(false);
  const [scrutinyError, setScrutinyError] = useState("");
  const [scrutinyReport, setScrutinyReport] = useState(null);

  // NEW
  const [editingLevel, setEditingLevel] = useState(null);

  useEffect(() => {
    if (!lesson) return;

    setTitle(lesson.title || "");
    setDescription(lesson.description || "");
    setDifficulty(lesson.difficulty || 3);

    fetchLevelsCatalog();
    normalizeLessonLevels();
    fetchLessonUnits();
    setScrutinyReport(null);
    setScrutinyError("");
  }, [lesson]);

  // Fetch catalog of all levels for this language
  const fetchLevelsCatalog = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/levels?language=${lesson.language}`,
        headers
      );
      setLevelsCatalog(res.data.Levels || []);
      console.log("CATALOG RAW", res.data);

    } catch (err) {
      console.error("Error fetching levels catalog:", err);
    }
  };

  const fetchLessonUnits = async () => {
    if (!lesson?._id) return;
    setUnitsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/units`, headers);
      const units = Array.isArray(res.data) ? res.data : [];
      const matches = units.filter((unit) =>
        Array.isArray(unit?.lessons)
          ? unit.lessons.some((unitLesson) => String(unitLesson?._id) === String(lesson._id))
          : false
      );
      setLessonUnits(matches);
    } catch (err) {
      console.error("Error fetching units:", err);
      setLessonUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchScrutinyModels = async () => {
    try {
      const res = await axios.get(`${API_URL}/lessons/models`, headers);
      const models = Array.isArray(res?.data?.models) ? res.data.models : [];
      setScrutinyModels(models);
      if (!selectedScrutinyModel && models.length > 0) {
        setSelectedScrutinyModel(models[0]);
      }
    } catch (err) {
      console.error("Error fetching models:", err);
      setScrutinyModels([]);
    }
  };

  const buildScrutinyPayload = () => ({
    title: title || lesson?.title || "",
    description: description || lesson?.description || "",
    language: lesson?.language || "en",
    levels: lessonLevels.map((lvl) => {
      let question = "";
      let answer = "";
      let options = [];

      if (lvl?.type === "mcq") {
        const mcq = Array.isArray(lvl?.mcqs) ? lvl.mcqs[0] : null;
        question = mcq?.question || "";
        options = mcq?.options?.map((opt) => opt.text) || [];
        if (typeof mcq?.correctAnswer === "number") {
          answer = options[mcq.correctAnswer] || "";
        } else if (typeof mcq?.correctAnswer === "string") {
          answer = mcq.correctAnswer;
        }
      } else if (
        lvl?.type === "fill-in-the-blank" ||
        lvl?.type === "vocalizing" ||
        lvl?.type === "writing" ||
        lvl?.type === "speaking" ||
        lvl?.type === "reading"
      ) {
        question = Array.isArray(lvl?.texts) ? lvl.texts[0] || "" : "";
        answer = lvl?.correctAnswer || question;
      } else if (lvl?.type === "listening") {
        question = Array.isArray(lvl?.texts) ? lvl.texts[0] || "" : "";
        answer = lvl?.sounds?.[0]?.answer || "";
      } else {
        question = Array.isArray(lvl?.texts) ? lvl.texts[0] || "" : "";
      }

      return {
        type: lvl?.type || "fill-in-the-blank",
        question,
        answer,
        options,
      };
    }),
  });

  const openScrutinise = async () => {
    setScrutiniseOpen(true);
    setScrutinyError("");
    if (scrutinyModels.length === 0) {
      await fetchScrutinyModels();
    }
  };

  const runScrutiny = async () => {
    if (!selectedScrutinyModel) {
      setScrutinyError("Please select a model.");
      return;
    }
    setScrutinyLoading(true);
    setScrutinyError("");
    try {
      const payload = buildScrutinyPayload();
      const res = await axios.post(
        `${API_URL}/lessons/scrutinise-lesson`,
        { model: selectedScrutinyModel, lesson: payload },
        headers
      );
      setScrutinyReport(res?.data?.report || null);
      setScrutiniseOpen(false);
    } catch (err) {
      console.error("Lesson scrutiny failed:", err);
      setScrutinyError(err?.response?.data?.error || "Failed to scrutinise lesson.");
    } finally {
      setScrutinyLoading(false);
    }
  };

  // Normalize lesson.levels (ObjectIds or populated)
  const normalizeLessonLevels = async () => {
    if (!lesson || !Array.isArray(lesson.levels)) return;

    try {
      const populated = await Promise.all(
        lesson.levels.map(async (lvl) => {
          if (typeof lvl === "object" && lvl._id) return lvl;
          const res = await axios.get(`${API_URL}/levels/${lvl}`, headers);
          return res.data;
        })
      );
      setLessonLevels(populated);
    } catch (err) {
      console.error("Error normalizing lesson levels:", err);
    }
  };

  const saveLesson = async () => {
    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/lessons/${lesson._id}`,
        { title, description, language: lesson.language },
        headers
      );
      await axios.patch(
        `${API_URL}/lessons/${lesson._id}/difficulty`,
        { difficulty },
        headers
      );

      setSaving(false);
      onLessonUpdated?.();
    } catch (err) {
      console.error("Error saving lesson:", err);
    }
  };

  const addLevelToLesson = async () => {
    if (!selectedLevelId) return;

    await axios.post(
      `${API_URL}/lessons/${lesson._id}/levels/${selectedLevelId}`,
      {},
      headers
    );

    normalizeLessonLevels();
  };

  const removeLevelFromLesson = async (lvlId) => {
    await axios.delete(
      `${API_URL}/lessons/${lesson._id}/levels/${lvlId}`,
      headers
    );
    normalizeLessonLevels();
  };

  const filteredCatalog = filter === "all"
    ? levelsCatalog
    : levelsCatalog.filter((lvl) => lvl.type === filter);

  const levelRows = useMemo(
    () =>
      lessonLevels.map((lvl, index) => {
        const mcqQuestion =
          Array.isArray(lvl?.mcqs) && lvl.mcqs.length > 0
            ? lvl.mcqs[0]?.question
            : "";
        const questionText =
          mcqQuestion ||
          lvl?.question ||
          lvl?.texts?.[0] ||
          lvl?.sounds?.[0]?.answer ||
          lvl?.name ||
          "";

        let correctAnswerText = "";
        let otherAnswers = [];

        if (lvl?.type === "mcq") {
          const mcq = Array.isArray(lvl?.mcqs) ? lvl.mcqs[0] : null;
          const options = mcq?.options?.map((o) => o.text) || [];
          if (typeof mcq?.correctAnswer === "number") {
            correctAnswerText = options[mcq.correctAnswer] || "";
          } else if (typeof mcq?.correctAnswer === "string") {
            correctAnswerText = mcq.correctAnswer;
          }
          otherAnswers = options.filter((opt) => opt && opt !== correctAnswerText);
        } else if (lvl?.type === "fill-in-the-blank") {
          correctAnswerText =
            typeof lvl?.correctAnswer === "string" && lvl.correctAnswer.trim().length > 0
              ? lvl.correctAnswer
              : lvl?.texts?.[0] || "";
        } else if (
          lvl?.type === "vocalizing" ||
          lvl?.type === "speaking" ||
          lvl?.type === "reading"
        ) {
          correctAnswerText = lvl?.texts?.[0] || "";
        } else if (lvl?.type === "writing") {
          correctAnswerText = "";
        } else if (lvl?.type === "listening" || lvl?.type === "sound" || lvl?.type === "video") {
          correctAnswerText = lvl?.sounds?.[0]?.answer || "";
        }

        return {
          id: lvl?._id || `${index}-${lvl?.type}`,
          index,
          type: lvl?.type || "—",
          questionText,
          correctAnswerText,
          otherAnswers,
          level: lvl,
        };
      }),
    [lessonLevels]
  );

  if (!open || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl w-[95%] max-w-6xl max-h-[92vh] p-6 sm:p-8 overflow-y-auto relative shadow-2xl border"
        style={{
          backgroundColor: currentTheme?.containerColor || "#ffffff",
          color: currentTheme?.mainTextColor || "#111827",
          borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
        }}
      >

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-3xl text-gray-600 hover:text-red-500"
        >
          <IoMdCloseCircle />
        </button>

        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Editing Lesson: {lesson.title}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <span
              className="px-3 py-1 rounded-full border"
              style={{
                backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
                borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                color: currentTheme?.textColor || "#111827",
              }}
            >
              Language: {lesson.language || "—"}
            </span>
            <span
              className="px-3 py-1 rounded-full border"
              style={{
                backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
                borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                color: currentTheme?.textColor || "#111827",
              }}
            >
              Levels: {lessonLevels.length}
            </span>
          </div>
          <div
            className="rounded-xl px-4 py-3 border"
            style={{
              backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
              borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
              color: currentTheme?.textColor || "#111827",
            }}
          >
            {unitsLoading ? (
              <p className="text-sm">Checking unit membership…</p>
            ) : lessonUnits.length > 0 ? (
              <p className="text-sm">
                Part of {lessonUnits.length} unit{lessonUnits.length > 1 ? "s" : ""}:{" "}
                <span className="font-semibold">
                  {lessonUnits.map((u) => u.title || "Untitled Unit").join(", ")}
                </span>
              </p>
            ) : (
              <p className="text-sm">Not part of any unit yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-semibold text-sm">Title</label>
              <input
                className="border p-2 rounded w-full mt-1"
                style={{
                  backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
                  borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                  color: currentTheme?.textColor || "#111827",
                }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-sm">Description</label>
              <textarea
                className="border p-2 rounded w-full mt-1"
                rows={3}
                style={{
                  backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
                  borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                  color: currentTheme?.textColor || "#111827",
                }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div
            className="rounded-xl border p-4 flex flex-col gap-3"
            style={{
              backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
              borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
              color: currentTheme?.textColor || "#111827",
            }}
          >
            <div>
              <label className="font-semibold text-sm">Difficulty</label>
              <input
                type="number"
                className="border p-2 rounded w-full mt-1"
                min={1}
                max={10}
                style={{
                  backgroundColor: currentTheme?.containerColor || "#ffffff",
                  borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                  color: currentTheme?.textColor || "#111827",
                }}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              />
            </div>

            <button
              onClick={saveLesson}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold"
            >
              {saving ? "Saving..." : "Save Lesson"}
            </button>
            <button
              onClick={openScrutinise}
              className="bg-slate-800 text-white px-4 py-2 rounded w-full font-semibold"
            >
              Scrutinise
            </button>
          </div>
        </div>

        {/* CURRENT LEVELS */}
        <h3 className="text-xl font-semibold mt-8 mb-3">Current Levels</h3>
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
            backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead
                style={{
                  backgroundColor: currentTheme?.containerColor || "#ffffff",
                  color: currentTheme?.mainTextColor || "#111827",
                }}
              >
                <tr>
                  <th className="text-left px-4 py-3 w-12">#</th>
                  <th className="text-left px-4 py-3 w-28">Type</th>
                  <th className="text-left px-4 py-3">Question</th>
                  <th className="text-left px-4 py-3">Correct Answer</th>
                  <th className="text-left px-4 py-3">Other Answers</th>
                </tr>
              </thead>
              <tbody>
                {levelRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t align-top"
                    style={{
                      borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                    }}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {typeof row.level?.level === "number"
                        ? row.level.level
                        : row.index + 1}
                    </td>
                    <td className="px-4 py-3 capitalize">{row.type}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm whitespace-normal break-words">
                        {row.questionText || "—"}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded"
                          onClick={() => setEditingLevel(row.level)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded"
                          onClick={() => removeLevelFromLesson(row.level._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm whitespace-normal break-words">
                        {row.correctAnswerText || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.otherAnswers.length > 0 ? (
                        <div className="text-sm whitespace-normal break-words">
                          {row.otherAnswers.join(" • ")}
                        </div>
                      ) : (
                        <span className="text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {levelRows.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-sm" colSpan={5}>
                      No levels in this lesson yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {scrutinyReport && (
          <div
            className="mt-8 rounded-xl border p-4"
            style={{
              backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
              borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
              color: currentTheme?.textColor || "#111827",
            }}
          >
            <h3 className="text-lg font-semibold mb-2">Scrutiny Report</h3>
            {scrutinyReport.summary && (
              <p className="text-sm mb-3">{scrutinyReport.summary}</p>
            )}
            {Array.isArray(scrutinyReport.issues) && scrutinyReport.issues.length > 0 ? (
              <div className="space-y-3">
                {scrutinyReport.issues.map((issue, idx) => (
                  <div
                    key={`${issue.levelIndex ?? "n"}-${idx}`}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: currentTheme?.containerColor || "#ffffff",
                      borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                    }}
                  >
                    <p className="text-sm font-semibold">
                      Level {issue.levelIndex + 1 || "—"} • {issue.levelType || "unknown"} •{" "}
                      {issue.severity || "unknown"}
                    </p>
                    <p className="text-sm mt-1">{issue.message}</p>
                    {issue.suggestedFix && (
                      <p className="text-sm mt-1 opacity-80">
                        Suggested fix: {issue.suggestedFix}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm">No issues flagged.</p>
            )}
            {Array.isArray(scrutinyReport.generalNotes) &&
              scrutinyReport.generalNotes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-1">General Notes</p>
                  <p className="text-sm">
                    {scrutinyReport.generalNotes.filter(Boolean).join(" • ")}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* EMBEDDED LEVEL EDITOR */}
        {editingLevel && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">
              Editing Level {editingLevel.level} ({editingLevel.type})
            </h3>

            <EditLevel
              isOpen={true}
              editData={editingLevel}
              setEditData={setEditingLevel}
              onClose={() => setEditingLevel(null)}
              onLevelUpdated={async () => {
                // Refresh that specific level
                await normalizeLessonLevels();
              }}
            />
          </div>
        )}

        {/* CATALOG FILTER */}
        <h3 className="text-xl font-semibold mt-10 mb-3">Add Level</h3>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded mb-4"
          style={{
            backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
            borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
            color: currentTheme?.textColor || "#111827",
          }}
        >
          <option value="all">All Types</option>
          <option value="vocalizing">Vocalizing</option>
          <option value="fill-in-the-blank">Fill-in-the-blank</option>
          <option value="speaking">Speaking</option>
          <option value="writing">Writing</option>
          <option value="listening">Listening</option>
          <option value="mcq">MCQ</option>
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCatalog.map((lvl) => (
            <div
              key={lvl._id}
              className="p-3 border rounded"
              style={{
                backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
                borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                color: currentTheme?.textColor || "#111827",
              }}
            >
              <p>
                Level {lvl.level} — {lvl.type}
              </p>
              <button
                onClick={() => setSelectedLevelId(lvl._id)}
                className={`px-3 py-1 rounded mt-2 ${
                  selectedLevelId === lvl._id
                    ? "bg-blue-700 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                Select
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addLevelToLesson}
          className="bg-purple-600 text-white px-4 py-2 rounded mt-4 font-semibold"
        >
          Add Selected Level
        </button>
      </div>
      {isScrutiniseOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div
            className="rounded-xl w-[90%] max-w-md p-5 border shadow-xl"
            style={{
              backgroundColor: currentTheme?.containerColor || "#ffffff",
              color: currentTheme?.mainTextColor || "#111827",
              borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
            }}
          >
            <h3 className="text-lg font-semibold mb-3">Scrutinise Lesson</h3>
            <label className="text-sm font-semibold">Select model</label>
            <select
              value={selectedScrutinyModel}
              onChange={(e) => setSelectedScrutinyModel(e.target.value)}
              className="border p-2 rounded w-full mt-2"
              style={{
                backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
                borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                color: currentTheme?.textColor || "#111827",
              }}
            >
              {scrutinyModels.length === 0 && (
                <option value="">No models found</option>
              )}
              {scrutinyModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            {scrutinyError && (
              <p className="text-sm text-red-600 mt-2">{scrutinyError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setScrutiniseOpen(false)}
                className="px-4 py-2 rounded border"
                style={{
                  borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={runScrutiny}
                className="px-4 py-2 rounded bg-slate-800 text-white"
                disabled={scrutinyLoading}
              >
                {scrutinyLoading ? "Scrutinising..." : "Run"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditLessonModal;
