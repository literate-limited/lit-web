const API_URL = import.meta.env.VITE_API_URL;
const BRAND = import.meta.env.VITE_BRAND || "lit";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const withChannel = (url) => {
  const connector = url.includes("?") ? "&" : "?";
  return `${url}${connector}channel=${BRAND}`;
};

export async function saveScenario(payload) {
  const res = await fetch(withChannel(`${API_URL}/hearts-on-fire/scenarios`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Save failed");
  }
  return res.json();
}

export async function listScenarios() {
  const res = await fetch(withChannel(`${API_URL}/hearts-on-fire/scenarios`), {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to load saved scenarios");
  return res.json();
}

export async function fetchSharedScenario(code) {
  const res = await fetch(withChannel(`${API_URL}/hearts-on-fire/share/${code}`), {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Share link invalid");
  return res.json();
}
