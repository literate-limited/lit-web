import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminStats() {
  const [rows, setRows] = useState([]);
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [usageRes, locRes] = await Promise.all([
          fetch(`${API_URL}/admin/openai-usage`, { headers }),
          fetch(`${API_URL}/admin/project-loc`, { headers }),
        ]);

        const usageJson = await usageRes.json();
        if (!usageRes.ok || !usageJson.success) {
          throw new Error(usageJson.message || "Failed to load token usage");
        }
        setRows(usageJson.models || []);

        const locJson = await locRes.json();
        if (!locRes.ok || !locJson.success) {
          throw new Error(locJson.message || "Failed to load LOC");
        }
        setLoc(locJson.totalLoc || 0);
      } catch (err) {
        setError(err.message || "Failed to load token usage");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.today += row.todayTokens || 0;
        acc.month += row.monthTokens || 0;
        acc.total += row.totalTokens || 0;
        return acc;
      },
      { today: 0, month: 0, total: 0 }
    );
  }, [rows]);

  if (loading) return <p className="p-4">Loading…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold mb-4">Admin stats</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Lines of code</p>
          <p className="mt-2 text-3xl font-semibold">
            {loc != null ? loc.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-gray-500">Computed across tracked files in the repo</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-left px-4 py-3">Usage today</th>
              <th className="text-left px-4 py-3">Usage this month</th>
              <th className="text-left px-4 py-3">Total usage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.model} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{row.model}</td>
                <td className="px-4 py-3">{row.todayTokens || 0}</td>
                <td className="px-4 py-3">{row.monthTokens || 0}</td>
                <td className="px-4 py-3">{row.totalTokens || 0}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-200 bg-gray-50">
              <td className="px-4 py-3 font-semibold">Total</td>
              <td className="px-4 py-3 font-semibold">{totals.today}</td>
              <td className="px-4 py-3 font-semibold">{totals.month}</td>
              <td className="px-4 py-3 font-semibold">{totals.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
