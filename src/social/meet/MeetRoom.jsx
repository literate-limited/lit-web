// MeetRoom.jsx — DROP-IN replacement
// ✅ Doc-first fullscreen
// ✅ Video call as a floating tile (mobile-safe)
// ✅ Tile is DRAGGABLE (via handle) + RESIZABLE (grab edges/corners and pull — no "expand" button)
// ✅ Loads MeetSession from backend: GET {API_URL}/meet/:code
// ✅ Prefers owner doc only if the current token can actually access it; otherwise falls back to shared token
// ✅ Applies default Virtual Background from /public asset (falls back to blur)

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";

/* ---------------- JITSI LOADER ---------------- */

function ensureJitsiScript(appId) {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();

    const existing = document.querySelector("script[data-jitsi]");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = `https://8x8.vc/${appId}/external_api.js`;
    s.async = true;
    s.dataset.jitsi = "1";
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/* ---------------- VIRTUAL BG HELPERS ---------------- */

// Put your chosen hero image here:
// frontend/public/lewis.png
const LOCAL_VB_URL = "/lewis.png";

async function fetchAsDataUrl(url) {
  const res = await fetch(url, { cache: "force-cache" }); // same-origin => reliable
  if (!res.ok) throw new Error(`VB fetch failed ${res.status} for ${url}`);

  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result); // data:image/...;base64,...
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function applyDefaultVB(api) {
  // 1) Try image background
  try {
    const dataUrl = await fetchAsDataUrl(LOCAL_VB_URL);

    if (typeof api.executeCommand === "function") {
      api.executeCommand("setVirtualBackground", true, dataUrl);
    } else if (typeof api.setVirtualBackground === "function") {
      api.setVirtualBackground(true, dataUrl);
    } else {
      throw new Error("Virtual background API not available on this deployment");
    }

    console.log("✅ Virtual background applied (local image).");
    return;
  } catch (e) {
    console.warn("⚠️ Image VB failed. Falling back to blur…", e);
  }

  // 2) Fallback: blur
  try {
    if (typeof api.executeCommand === "function") {
      api.executeCommand("setBlurredBackground", "blur");
      console.log("✅ Blur background applied (fallback).");
    }
  } catch (e) {
    console.warn("⚠️ Blur fallback failed too. No background effects applied.", e);
  }
}

/* ---------------- TILE HELPERS ---------------- */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getDefaultTileSize() {
  const w = window.innerWidth;

  // same intent as before
  if (w >= 768) return { w: 320, h: 220 };
  if (w >= 640) return { w: 190, h: 240 };
  return { w: 150, h: 210 };
}

/* ---------------- COMPONENT ---------------- */

export default function MeetRoom() {
  const { code } = useParams();
  const { user } = useUser();

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token") || "";
  const appId = import.meta.env.VITE_JITSI_APP_ID;

  const wrapRef = useRef(null);
  const containerRef = useRef(null);
  const jitsiRef = useRef(null);

  /* ---------------- NAME HANDLING ---------------- */

  const [name, setName] = useState("");

  useEffect(() => {
    const derived =
      user?.name ||
      user?.displayName ||
      user?.fullName ||
      user?.username ||
      user?.handle ||
      "";

    if (derived) {
      setName(derived);
      return;
    }

    if (!name) {
      const n = Math.floor(1000 + Math.random() * 9000);
      setName(`Guest-${n}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.displayName, user?.fullName, user?.username, user?.handle]);

  /* ---------------- LOAD MEET SESSION ---------------- */

  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (!code || !API_URL) return;

    let cancelled = false;

    (async () => {
      try {
        setSessionError("");
        setSession(null);

        const res = await fetch(`${API_URL}/meet/${code}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load meeting");
        if (cancelled) return;

        setSession({
          docId: data?.docId || "",
          sharedDoc: data?.sharedDoc || "",
          createdAt: data?.createdAt || null,
        });
      } catch (e) {
        if (!cancelled) setSessionError(e?.message || "Failed to load meeting");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_URL, code]);

  /* ---------------- OWNER ACCESS CHECK ---------------- */

  const [canUseOwnerDoc, setCanUseOwnerDoc] = useState(false);

  useEffect(() => {
    if (!API_URL) return;

    const docId = session?.docId || "";
    if (!token || !docId) {
      setCanUseOwnerDoc(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/docs/${docId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;
        setCanUseOwnerDoc(Boolean(res.ok));
      } catch {
        if (!cancelled) setCanUseOwnerDoc(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_URL, token, session?.docId]);

  /* ---------------- DOC ROUTE (OWNER FIRST w/ REAL CHECK) ---------------- */

  const docSrc = useMemo(() => {
    const docId = session?.docId || "";
    const sharedDoc = session?.sharedDoc || "";

    if (canUseOwnerDoc && docId) return `/docs/${docId}?embed=1`;
    if (sharedDoc) return `/docs/shared/${sharedDoc}?embed=1`;
    return "";
  }, [canUseOwnerDoc, session?.docId, session?.sharedDoc]);

  /* ---------------- FLOATING TILE: DRAG + RESIZE ---------------- */

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(() => getDefaultTileSize());

  const initialisedRef = useRef(false);

  const dragRef = useRef({
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
  });

  const resizeRef = useRef({
    active: false,
    pointerId: null,
    dir: "", // n,s,e,w,ne,nw,se,sw
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
    startSize: { w: 0, h: 0 },
  });

  const computeBounds = (w, h) => {
    const el = wrapRef.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    const pad = 12;
    return {
      minX: pad,
      minY: pad,
      maxX: Math.max(pad, rect.width - w - pad),
      maxY: Math.max(pad, rect.height - h - pad),
      wrapW: rect.width,
      wrapH: rect.height,
      pad,
    };
  };

  const dockBottomRight = (w, h) => {
    const el = wrapRef.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return { x: 16, y: 16 };
    const pad = 16;
    return {
      x: Math.max(pad, rect.width - w - pad),
      y: Math.max(pad, rect.height - h - pad),
    };
  };

  useEffect(() => {
    if (!wrapRef.current) return;
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    const s = getDefaultTileSize();
    setSize(s);
    setPos(dockBottomRight(s.w, s.h));
  }, []);

  // Keep tile inside on resize/orientation
  useEffect(() => {
    const onResize = () => {
      const minW = 140;
      const minH = 160;

      setSize((prev) => {
        const next = { ...prev };

        // Don't auto-change user’s chosen size aggressively; just clamp to viewport bounds.
        const { wrapW, wrapH, pad } = computeBounds(next.w, next.h);

        // max size = container - padding
        const maxW = Math.max(minW, wrapW - pad * 2);
        const maxH = Math.max(minH, wrapH - pad * 2);

        next.w = clamp(next.w, minW, maxW);
        next.h = clamp(next.h, minH, maxH);
        return next;
      });

      setPos((p) => {
        const b = computeBounds(size.w, size.h);
        return {
          x: clamp(p.x, b.minX, b.maxX),
          y: clamp(p.y, b.minY, b.maxY),
        };
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  const beginDrag = (e) => {
    const el = wrapRef.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    dragRef.current.active = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.offsetX = e.clientX - rect.left - pos.x;
    dragRef.current.offsetY = e.clientY - rect.top - pos.y;

    const onMove = (ev) => {
      if (!dragRef.current.active) return;
      if (dragRef.current.pointerId !== ev.pointerId) return;

      const b = computeBounds(size.w, size.h);

      const xRaw = ev.clientX - rect.left - dragRef.current.offsetX;
      const yRaw = ev.clientY - rect.top - dragRef.current.offsetY;

      setPos({
        x: clamp(xRaw, b.minX, b.maxX),
        y: clamp(yRaw, b.minY, b.maxY),
      });
    };

    const onUp = (ev) => {
      if (dragRef.current.pointerId !== ev.pointerId) return;

      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const beginResize = (dir) => (e) => {
    const el = wrapRef.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    resizeRef.current.active = true;
    resizeRef.current.pointerId = e.pointerId;
    resizeRef.current.dir = dir;
    resizeRef.current.startX = e.clientX;
    resizeRef.current.startY = e.clientY;
    resizeRef.current.startPos = { ...pos };
    resizeRef.current.startSize = { ...size };

    const minW = 140;
    const minH = 160;

    const onMove = (ev) => {
      if (!resizeRef.current.active) return;
      if (resizeRef.current.pointerId !== ev.pointerId) return;

      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;

      const startPos = resizeRef.current.startPos;
      const startSize = resizeRef.current.startSize;

      let nextX = startPos.x;
      let nextY = startPos.y;
      let nextW = startSize.w;
      let nextH = startSize.h;

      const b0 = computeBounds(startSize.w, startSize.h);
      const maxW = Math.max(minW, b0.wrapW - b0.pad * 2);
      const maxH = Math.max(minH, b0.wrapH - b0.pad * 2);

      const hasE = dir.includes("e");
      const hasW = dir.includes("w");
      const hasN = dir.includes("n");
      const hasS = dir.includes("s");

      if (hasE) nextW = clamp(startSize.w + dx, minW, maxW);
      if (hasS) nextH = clamp(startSize.h + dy, minH, maxH);

      if (hasW) {
        // moving left edge: x decreases, width increases
        const wRaw = startSize.w - dx;
        nextW = clamp(wRaw, minW, maxW);
        nextX = startPos.x + (startSize.w - nextW);
      }

      if (hasN) {
        // moving top edge: y decreases, height increases
        const hRaw = startSize.h - dy;
        nextH = clamp(hRaw, minH, maxH);
        nextY = startPos.y + (startSize.h - nextH);
      }

      // Now clamp position so tile stays in bounds with new size
      const b = computeBounds(nextW, nextH);
      nextX = clamp(nextX, b.minX, b.maxX);
      nextY = clamp(nextY, b.minY, b.maxY);

      setSize({ w: nextW, h: nextH });
      setPos({ x: nextX, y: nextY });
    };

    const onUp = (ev) => {
      if (resizeRef.current.pointerId !== ev.pointerId) return;

      resizeRef.current.active = false;
      resizeRef.current.pointerId = null;

      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* ---------------- AUTO-JOIN JITSI + DEFAULT VB ---------------- */

  useEffect(() => {
    if (!code || !name || !appId) return;

    let disposed = false;

    (async () => {
      await ensureJitsiScript(appId);
      if (disposed) return;
      if (!containerRef.current) return;

      const domain = "8x8.vc";

      const options = {
        roomName: `${appId}/${code}`,
        parentNode: containerRef.current,
        userInfo: { displayName: name },

        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
        },

        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiRef.current = api;

      const apply = () => {
        if (disposed) return;
        setTimeout(() => applyDefaultVB(api), 600);
      };

      try {
        const events = await api.getSupportedEvents?.();
        if (Array.isArray(events) && events.includes("videoConferenceJoined")) {
          api.addListener("videoConferenceJoined", apply);
        } else {
          apply();
        }
      } catch {
        apply();
      }
    })();

    return () => {
      disposed = true;
      try {
        jitsiRef.current?.dispose();
      } catch {}
    };
  }, [code, name, appId]);

  if (!code) return <div className="p-6">Invalid meeting link.</div>;

  /* ---------------- RENDER ---------------- */

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-[calc(100dvh-64px)] overflow-hidden bg-white"
    >
      {/* DOC — full screen */}
      {sessionError ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-600">
          {sessionError}
        </div>
      ) : docSrc ? (
        <iframe title="Shared Doc" src={docSrc} className="absolute inset-0 w-full h-full" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          {session ? "No document attached" : "Loading meeting…"}
        </div>
      )}

      {/* FLOATING VIDEO TILE */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="pointer-events-auto absolute shadow-2xl bg-black border border-black/10 rounded-2xl overflow-hidden"
          style={{
            left: pos.x,
            top: pos.y,
            width: size.w,
            height: size.h,
            touchAction: "none",
          }}
        >
          {/* DRAG HANDLE (small bar so we don't fight Jitsi clicks) */}
          <div
            onPointerDown={beginDrag}
            className="absolute top-2 left-2 z-50 select-none px-2 py-1 rounded bg-black/60 text-white text-[11px] flex items-center gap-1"
            style={{ touchAction: "none" }}
            title="Drag"
          >
            <span aria-hidden="true">⠿</span>
            <span>Drag</span>
          </div>

          {/* RESIZE HANDLES (grab edges/corners and pull) */}
          {/* Edges */}
          <div
            onPointerDown={beginResize("n")}
            className="absolute top-0 left-4 right-4 h-4 z-50"
            style={{ cursor: "ns-resize", touchAction: "none" }}
          />
          <div
            onPointerDown={beginResize("s")}
            className="absolute bottom-0 left-4 right-4 h-4 z-50"
            style={{ cursor: "ns-resize", touchAction: "none" }}
          />
          <div
            onPointerDown={beginResize("w")}
            className="absolute left-0 top-4 bottom-4 w-4 z-50"
            style={{ cursor: "ew-resize", touchAction: "none" }}
          />
          <div
            onPointerDown={beginResize("e")}
            className="absolute right-0 top-4 bottom-4 w-4 z-50"
            style={{ cursor: "ew-resize", touchAction: "none" }}
          />

          {/* Corners */}
          <div
            onPointerDown={beginResize("nw")}
            className="absolute left-0 top-0 w-5 h-5 z-50"
            style={{ cursor: "nwse-resize", touchAction: "none" }}
          />
          <div
            onPointerDown={beginResize("ne")}
            className="absolute right-0 top-0 w-5 h-5 z-50"
            style={{ cursor: "nesw-resize", touchAction: "none" }}
          />
          <div
            onPointerDown={beginResize("sw")}
            className="absolute left-0 bottom-0 w-5 h-5 z-50"
            style={{ cursor: "nesw-resize", touchAction: "none" }}
          />
          <div
            onPointerDown={beginResize("se")}
            className="absolute right-0 bottom-0 w-5 h-5 z-50"
            style={{ cursor: "nwse-resize", touchAction: "none" }}
          />

          {/* Jitsi mounts here */}
          <div ref={containerRef} className="w-full h-full bg-black" />
        </div>
      </div>
    </div>
  );
}
