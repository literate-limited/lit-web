// src/push/pushClient.js

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Call this AFTER login (token exists).
 * Best UX: call from a Settings toggle button (user gesture).
 */
export async function ensurePushSubscription({ apiUrl, token }) {
  if (!("serviceWorker" in navigator)) return null;
  if (!("PushManager" in window)) return null;

  // This triggers permission UI (better from a user action than auto-mount)
  const current = Notification.permission;
  if (current === "default") return null; // respect user gesture requirement
  if (current !== "granted") return null;

  const reg = await navigator.serviceWorker.ready;

  // Get existing subscription if any
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("Missing VITE_VAPID_PUBLIC_KEY in .env");
      return null;
    }

    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  // Send subscription to backend for storage
  await fetch(`${apiUrl}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subscription: sub }),
  });

  return sub;
}

export async function disablePushSubscription({ apiUrl, token }) {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  await fetch(`${apiUrl}/push/unsubscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });

  await sub.unsubscribe();
}
