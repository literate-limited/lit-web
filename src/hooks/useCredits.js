import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

// Credit rate: 1 credit per 3 seconds
const CREDITS_PER_SECOND = 1 / 3;
const DEFAULT_MAX_CREDITS = 10000;
const SYNC_INTERVAL_MS = 60000; // Sync with server every 60 seconds
const UPDATE_INTERVAL_MS = 3000; // Update display every 3 seconds
const MIN_SYNC_INTERVAL_MS = 15000; // Avoid burst syncs across listeners

const store = {
  credits: 0,
  maxCredits: DEFAULT_MAX_CREDITS,
  lastServerSync: null,
};

const listeners = new Set();
let baseCredits = 0;
let lastUpdate = Date.now();
let userRef = null;
let getAuthHeadersRef = null;
let updateIntervalId = null;
let syncIntervalId = null;
let visibilityHandlerAttached = false;
let inFlightSync = false;
let lastSyncAt = 0;

const emit = () => {
  const snapshot = { ...store };
  listeners.forEach((listener) => listener(snapshot));
};

const setStore = (patch) => {
  Object.assign(store, patch);
  emit();
};

const computeLocalCredits = () => {
  const now = Date.now();
  const elapsedSeconds = (now - lastUpdate) / 1000;
  const earnedCredits = Math.floor(elapsedSeconds * CREDITS_PER_SECOND);
  return Math.min(store.maxCredits, baseCredits + earnedCredits);
};

const updateLocalCredits = () => {
  if (!userRef) return;
  setStore({ credits: computeLocalCredits() });
};

const hydrateFromUser = (user) => {
  if (user?.creditsInfo) {
    baseCredits = user.creditsInfo.credits;
    lastUpdate = new Date(user.creditsInfo.lastCreditUpdate).getTime();
    setStore({
      credits: user.creditsInfo.credits,
      maxCredits: user.creditsInfo.maxCredits || DEFAULT_MAX_CREDITS,
    });
    return;
  }
  if (typeof user?.credits === "number") {
    baseCredits = user.credits;
    lastUpdate = Date.now();
    setStore({ credits: user.credits });
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible" && userRef) {
    updateLocalCredits();
    syncWithServer();
  }
};

const ensureIntervals = () => {
  if (!updateIntervalId) {
    updateIntervalId = setInterval(updateLocalCredits, UPDATE_INTERVAL_MS);
  }
  if (!syncIntervalId) {
    syncIntervalId = setInterval(() => {
      if (userRef) syncWithServer();
    }, SYNC_INTERVAL_MS);
  }
  if (!visibilityHandlerAttached) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityHandlerAttached = true;
  }
};

const clearIntervals = () => {
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  if (visibilityHandlerAttached) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    visibilityHandlerAttached = false;
  }
};

const syncWithServer = async ({ force = false } = {}) => {
  if (inFlightSync) return;
  const now = Date.now();
  if (!force && now - lastSyncAt < MIN_SYNC_INTERVAL_MS) return;

  try {
    const headers = getAuthHeadersRef?.();
    if (!headers?.Authorization) return;

    inFlightSync = true;
    lastSyncAt = now;

    const response = await fetch(`${API_URL}/credits/sync`, {
      method: "POST",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        baseCredits = data.credits;
        lastUpdate = Date.now();
        setStore({
          credits: data.credits,
          maxCredits: data.maxCredits || DEFAULT_MAX_CREDITS,
          lastServerSync: new Date(),
        });
      }
    }
  } catch (err) {
    console.error("Credit sync error:", err);
  } finally {
    inFlightSync = false;
  }
};

const deductCredits = async (amount) => {
  try {
    const headers = getAuthHeadersRef?.();
    if (!headers?.Authorization) {
      return { success: false, error: "Not authenticated" };
    }

    await syncWithServer({ force: true });

    const currentCredits = computeLocalCredits();
    if (currentCredits < amount) {
      return { success: false, error: "Insufficient credits" };
    }

    const response = await fetch(`${API_URL}/credits/deduct`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      baseCredits = data.credits;
      lastUpdate = Date.now();
      setStore({
        credits: data.credits,
        maxCredits: data.maxCredits || DEFAULT_MAX_CREDITS,
      });
      return { success: true, credits: data.credits };
    }
    return {
      success: false,
      error: data.msg || "Failed to deduct credits",
    };
  } catch (err) {
    console.error("Deduct credits error:", err);
    return { success: false, error: "Network error" };
  }
};

/**
 * useCredits - Hook for managing credits with local interpolation
 *
 * This hook:
 * 1. Maintains local credit state that updates every 3 seconds
 * 2. Syncs with the backend periodically (every 60 seconds)
 * 3. Provides functions to deduct credits
 *
 * The user sees credits increasing every 3 seconds without API calls.
 * Backend is updated periodically or when credits are spent.
 */
export function useCredits() {
  const { user, getAuthHeaders } = useUser();
  const [state, setState] = useState({ ...store });

  useEffect(() => {
    listeners.add(setState);
    ensureIntervals();
    return () => {
      listeners.delete(setState);
      if (listeners.size === 0) {
        clearIntervals();
      }
    };
  }, []);

  useEffect(() => {
    userRef = user || null;
    getAuthHeadersRef = getAuthHeaders || null;
    if (user) {
      hydrateFromUser(user);
    } else {
      baseCredits = 0;
      lastUpdate = Date.now();
      setStore({ credits: 0, maxCredits: DEFAULT_MAX_CREDITS });
    }
  }, [user, getAuthHeaders]);

  const sync = useCallback(() => syncWithServer(), []);
  const deduct = useCallback((amount) => deductCredits(amount), []);

  return {
    credits: state.credits,
    maxCredits: state.maxCredits,
    lastServerSync: state.lastServerSync,
    deductCredits: deduct,
    syncWithServer: sync,
    isMaxed: state.credits >= state.maxCredits,
    rate: CREDITS_PER_SECOND,
  };
}

export default useCredits;
