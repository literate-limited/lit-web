/* --------------------------------------------------------------------
   GaussianElimination.jsx  –  gameplay page for gaussianElimination type
---------------------------------------------------------------------*/
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useLessonGame } from "../../hooks/useLesson";

const API_URL = import.meta.env.VITE_API_URL;

/* ---------------- tiny helpers ---------------- */
const clone = (m) => m.map((row) => [...row]);

/** elementary row-ops in a single util so UI stays clean */
const rowOps = {
  swap: (mat, i, j) => {
    [mat[i], mat[j]] = [mat[j], mat[i]];
  },
  scale: (mat, i, k) => {
    mat[i] = mat[i].map((v) => v * k);
  },
  addScaled: (mat, src, dest, k) => {
    mat[dest] = mat[dest].map((v, idx) => v + k * mat[src][idx]);
  },
};

/* quick RREF-check: is the left 3×3 block the identity? ------------- */
const isSolved = (m) =>
  [0, 1, 2].every((r) =>
    [0, 1, 2].every((c) => (r === c ? m[r][c] === 1 : m[r][c] === 0))
  );

/* ------------------------------------------------------------------ */
export default function GaussianElimination() {
  /* ---------- context & local state ------------ */
  const {
    currentLevel,
    handleCheckAnswer,
  } = useLessonGame();

  // Compute headers locally from token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const originalMatrix = currentLevel?.matrixData?.matrix || [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  const [mat, setMat] = useState(() => clone(originalMatrix));
  const [msg, setMsg] = useState("");

  /* ---------- keep a ref so hot-keys stay fresh */
  const matRef = useRef(mat);
  useEffect(() => {
    matRef.current = mat;
  }, [mat]);

  /* ---------- reset when a new level loads ----- */
  useEffect(() => {
    setMat(clone(originalMatrix));
    setMsg("");
  }, [currentLevel?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- hot-keys (space / r / d / p) ----- */
  useEffect(() => {
    const handler = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        submitMatrix(matRef.current);
      }
      if (e.key === "r" || e.key === "R") {
        setMat(clone(originalMatrix));
        setMsg("↺ Matrix reset.");
      }
      if (e.key === "d" || e.key === "D") {
        setMat([
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ]);
        setMsg("🗑️ Cleared.");
      }
      if (e.key === "p" || e.key === "P") {
        console.table(matRef.current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [originalMatrix]);

  /* ---------- server-sync + correctness check -- */
  const submitMatrix = useCallback(
    async (matrix) => {
      if (!currentLevel?._id) return;

      try {
        // save learner’s working matrix
        await axios.put(
          `${API_URL}/levels/${currentLevel._id}/matrix`,
          { matrix },
          { headers }
        );
        const solved = isSolved(matrix);
        setMsg(solved ? "✅ Nice! Solved." : "❌ Not in RREF yet.");
        if (solved) handleCheckAnswer("solved");
      } catch (err) {
        console.error(err);
        setMsg("⚠️ Server error.");
      }
    },
    [currentLevel?._id, headers, handleCheckAnswer]
  );

  /* ---------- UI pieces ------------------------ */
  const MatrixTable = (
    <table className="border-collapse my-4">
      <tbody>
        {mat.map((row, r) => (
          <tr key={r}>
            {row.map((val, c) => (
              <td key={c} className="p-1">
                <input
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMat((prev) => {
                      const next = clone(prev);
                      next[r][c] = v;
                      return next;
                    });
                  }}
                  className="w-16 text-center border rounded"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  /* quick little row-op toolbar */
  const [i, setI] = useState(0);
  const [j, setJ] = useState(1);
  const [k, setK] = useState(1);

  const RowOpPanel = (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {/* swap */}
      <div className="flex items-center gap-2">
        <select value={i} onChange={(e) => setI(+e.target.value)}>
          {[0, 1, 2].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span>⇄</span>
        <select value={j} onChange={(e) => setJ(+e.target.value)}>
          {[0, 1, 2].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <button
          onClick={() =>
            setMat((prev) => {
              const next = clone(prev);
              rowOps.swap(next, i, j);
              return next;
            })
          }
          className="ml-auto px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Swap
        </button>
      </div>

      {/* scale row */}
      <div className="flex items-center gap-2">
        <span>Row</span>
        <select value={i} onChange={(e) => setI(+e.target.value)}>
          {[0, 1, 2].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span>×</span>
        <input
          type="number"
          step="0.1"
          value={k}
          onChange={(e) => setK(+e.target.value)}
          className="w-20 text-center border rounded"
        />
        <button
          onClick={() =>
            setMat((prev) => {
              const next = clone(prev);
              rowOps.scale(next, i, k);
              return next;
            })
          }
          className="ml-auto px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Scale
        </button>
      </div>

      {/* add scaled row */}
      <div className="flex items-center gap-2">
        <span>Row</span>
        <select value={j} onChange={(e) => setJ(+e.target.value)}>
          {[0, 1, 2].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span>← Row</span>
        <select value={i} onChange={(e) => setI(+e.target.value)}>
          {[0, 1, 2].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span>×</span>
        <input
          type="number"
          step="0.1"
          value={k}
          onChange={(e) => setK(+e.target.value)}
          className="w-20 text-center border rounded"
        />
        <button
          onClick={() =>
            setMat((prev) => {
              const next = clone(prev);
              rowOps.addScaled(next, i, j, k);
              return next;
            })
          }
          className="ml-auto px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Add
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center py-6">
      <h2 className="text-xl font-semibold">Gaussian Elimination</h2>
      {MatrixTable}
      {RowOpPanel}

      <button
        onClick={() => submitMatrix(mat)}
        className="mt-4 px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
      >
        Submit (␣ Space)
      </button>

      {msg && <p className="mt-2 text-sm font-medium">{msg}</p>}
    </div>
  );
}
