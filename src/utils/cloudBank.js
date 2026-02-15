const KEY = "cloud_balance";

const safeStorage = () => {
  try {
    return window?.localStorage || null;
  } catch (_) {
    return null;
  }
};

export const getCloudBalance = () => {
  const storage = safeStorage();
  if (!storage) return 0;
  const raw = storage.getItem(KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const setCloudBalance = (value) => {
  const storage = safeStorage();
  if (!storage) return 0;
  const next = Math.max(0, Math.floor(value || 0));
  storage.setItem(KEY, String(next));
  try {
    window.dispatchEvent(
      new CustomEvent("cloud:updated", {
        detail: { balance: next, amount: 0, reason: "set" },
      })
    );
  } catch (_) {
    // ignore
  }
  return next;
};

export const awardCloud = (amount = 1, meta = {}) => {
  const storage = safeStorage();
  if (!storage) return 0;
  const current = getCloudBalance();
  const inc = Math.max(0, Math.floor(amount || 0));
  const next = current + inc;
  storage.setItem(KEY, String(next));
  try {
    window.dispatchEvent(
      new CustomEvent("cloud:updated", {
        detail: { balance: next, amount: inc, ...meta },
      })
    );
  } catch (_) {
    // ignore
  }
  return next;
};
