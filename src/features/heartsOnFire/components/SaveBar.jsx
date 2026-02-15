import { useEffect, useMemo, useState } from "react";
import { listScenarios, saveScenario } from "../api.js";
import { useHof } from "../state/hofState.jsx";

const LOCAL_STORAGE_KEY = "hof_saved_scenarios_v1";

function encodeBase64Url(input) {
  const base64 = btoa(input);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function readLocalScenarios() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalScenarios(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota/unavailable
  }
}

export default function SaveBar() {
  const { state, setParams, setOutputs, setCurves } = useHof();
  const [name, setName] = useState("My scenario");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [savedList, setSavedList] = useState([]);
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState("api"); // "api" | "local"

  const shareLink = useMemo(() => {
    if (!selected) return "";
    const found = savedList.find((s) => s._id === selected);
    if (!found) return "";
    const origin = window.location.origin;
    const pathname = window.location.pathname || "/hearts-on-fire";
    if (found.shareCode) return `${origin}${pathname}?share=${found.shareCode}`;
    if (found.params) {
      const packed = encodeBase64Url(JSON.stringify(found.params));
      return `${origin}${pathname}?p=${packed}`;
    }
    return "";
  }, [selected, savedList]);

  useEffect(() => {
    listScenarios()
      .then((res) => {
        setMode("api");
        setSavedList(res.scenarios || []);
      })
      .catch(() => {
        setMode("local");
        setSavedList(readLocalScenarios());
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name,
        params: state.params,
        outputs: state.outputs,
        curves: state.curves,
      };
      if (mode === "api") {
        const res = await saveScenario(payload);
        setSavedList((prev) => [res.scenario, ...prev.filter((s) => s._id !== res.scenario._id)]);
        setSelected(res.scenario._id);
        setMessage("Saved. Share link ready.");
      } else {
        const scenario = {
          _id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name,
          params: state.params,
          createdAt: new Date().toISOString(),
        };
        setSavedList((prev) => {
          const next = [scenario, ...prev];
          writeLocalScenarios(next);
          return next;
        });
        setSelected(scenario._id);
        setMessage("Saved locally. Share link ready.");
      }
    } catch (err) {
      if (mode === "api") {
        const scenario = {
          _id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name,
          params: state.params,
          createdAt: new Date().toISOString(),
        };
        setMode("local");
        setSavedList((prev) => {
          const next = [scenario, ...readLocalScenarios(), ...prev].filter(
            (v, idx, arr) => arr.findIndex((x) => x._id === v._id) === idx
          );
          writeLocalScenarios(next);
          return next;
        });
        setSelected(scenario._id);
        setMessage("API save failed; saved locally instead. Share link ready.");
      } else {
        setMessage(err.message || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = () => {
    const found = savedList.find((s) => s._id === selected);
    if (!found) return;
    setParams(found.params || {});
    setOutputs(found.outputs || {});
    setCurves(found.curves || {});
    setMessage("Loaded scenario from saved state.");
  };

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setMessage("Share link copied.");
    } catch (err) {
      setMessage("Copy failed; select and copy manually.");
    }
  };

  return (
    <div className="hof-card hof-card--overlay">
      <div className="hof-card__header">
        <p className="hof-kicker">Persistence</p>
        <h2 className="hof-card__title">Save & share scenarios</h2>
      </div>
      <div className="hof-savebar">
        <div className="hof-savebar__group">
          <label className="hof-field">
            <div className="hof-field__top">
              <span>Name</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Scenario name"
              className="hof-input"
            />
          </label>
          <button className="hof-button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save scenario"}
          </button>
        </div>

        <div className="hof-savebar__group">
          <select
            className="hof-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Load saved…</option>
            {savedList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <button className="hof-button hof-button--ghost" onClick={handleLoad} disabled={!selected}>
            Load
          </button>
          <button className="hof-button hof-button--ghost" onClick={copyLink} disabled={!shareLink}>
            Copy share link
          </button>
        </div>
      </div>
      {shareLink && (
        <p className="hof-muted text-xs">
          Share: <span className="hof-link">{shareLink}</span>
        </p>
      )}
      {mode === "local" && (
        <p className="hof-muted text-xs">Local mode: scenarios are saved in this browser only.</p>
      )}
      {message && <p className="hof-muted text-xs">{message}</p>}
    </div>
  );
}
