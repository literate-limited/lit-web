const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const buildPayload = (id, inviteTypes = []) => ({
  id,
  inviteTypes: Array.isArray(inviteTypes)
    ? inviteTypes.map((t) => String(t || "").toLowerCase()).filter(Boolean)
    : [],
  ts: Date.now(),
});

export const trackTutorialClick = (id, inviteTypes = []) => {
  if (!id || !API_URL) return;
  const payload = buildPayload(id, inviteTypes);
  const url = `${API_URL}/analytics/tutorial-click`;

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort only
  }
};

export const trackTutorialImpression = (id, inviteTypes = []) => {
  if (!id || !API_URL) return;
  const payload = buildPayload(id, inviteTypes);
  const url = `${API_URL}/analytics/tutorial-impression`;

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort only
  }
};
