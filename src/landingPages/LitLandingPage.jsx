// LitLandingPage.jsx — DROP-IN replacement
// ✅ CTA stays centered (X) and slightly below center (Y)
// ✅ Orbiting messages will NEVER overlap the CTA (auto-nudge upward if they collide)

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UnfurlingScroll from "./components/UnfurlingScroll";

import { useTranslation } from "../translator/hooks/useTranslation";
import Translations from "./translations";
import LanguageSwitcher from "../components/LanguageSwitcher";

const HERO_IMAGES = {
  desktop:
    "https://true-phonetics-storage.s3.ap-southeast-2.amazonaws.com/images/family-hero-wide.png",
  mobile:
    "https://true-phonetics-storage.s3.ap-southeast-2.amazonaws.com/images/family-hero-portrait.png",
};

// ✅ Safer orbit path: stays well ABOVE the CTA zone by default
const ORBIT_POSITIONS = [
  { x: "50%", y: "16%", rot: -4 },
  { x: "78%", y: "30%", rot: 6 },
  { x: "62%", y: "46%", rot: 4 },
  { x: "38%", y: "46%", rot: -6 },
  { x: "22%", y: "30%", rot: -4 },
];

export default function LitLandingPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const ctaRef = useRef(null);
  const msgWrapRef = useRef(null);

  const navigate = useNavigate();
  const { t } = useTranslation(Translations);

  const MESSAGES = [t("msg1"), t("msg2"), t("msg3"), t("msg4"), t("msg5")];
  const [messageIndex, setMessageIndex] = useState(0);

  const [sceneExit, setSceneExit] = useState(false);

  // ✅ Runtime safety: if a message would overlap the CTA, nudge it upward in pixels
  const [msgNudgeUpPx, setMsgNudgeUpPx] = useState(0);

  /* ---------- RESET SEQUENCE ON MOUNT ---------- */
  useEffect(() => {
    setMessageIndex(0);
  }, []);


  /* ---------- OVERLAP GUARD (MESSAGE vs CTA) ---------- */
  useEffect(() => {
    setMsgNudgeUpPx(0);

    if (messageIndex >= MESSAGES.length) return;

    let raf1 = 0;
    let raf2 = 0;

    // Two RAFs to ensure layout is settled after UnfurlingScroll mounts/animates
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const ctaEl = ctaRef.current;
        const msgEl = msgWrapRef.current;
        if (!ctaEl || !msgEl) return;

        const cta = ctaEl.getBoundingClientRect();
        const msg = msgEl.getBoundingClientRect();

        // Padding so the scroll doesn't "kiss" the CTA
        const pad = 18;

        const overlaps =
          msg.bottom > cta.top - pad &&
          msg.top < cta.bottom + pad &&
          msg.right > cta.left - pad &&
          msg.left < cta.right + pad;

        if (overlaps) {
          // Move message up just enough to clear the CTA, plus a little breathing room
          const needed = Math.ceil(msg.bottom - (cta.top - pad));
          setMsgNudgeUpPx(Math.min(Math.max(needed, 24), 220));
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [messageIndex, MESSAGES.length]);

  /* ---------- EMBERS ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");

    let w, h, raf;

    const resize = () => {
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
    };

    resize();
    window.addEventListener("resize", resize);

    const embers = Array.from({ length: 180 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r:
        Math.random() < 0.15
          ? Math.random() * 3 + 2
          : Math.random() * 1.5 + 0.5,
      vy: Math.random() * 0.4 + 0.1,
      vx: Math.random() * 0.6 - 0.3,
      baseAlpha: Math.random() * 0.4 + 0.15,
      flicker: Math.random() * Math.PI * 2,
    }));

    let burst = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const flareChance = 0.004;
      if (Math.random() < flareChance) burst = 1;
      burst *= 0.92;

      embers.forEach((e) => {
        e.vy += 0.002 + burst * 0.03;
        e.y -= e.vy * (1 + burst);
        e.x += e.vx * (1 + burst * 0.5);
        e.flicker += 0.1 + Math.random() * 0.05;

        const alpha = e.baseAlpha + Math.sin(e.flicker) * 0.15 + burst * 0.45;

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,180,90,${alpha})`;
        ctx.fill();

        if (e.y < -20 || e.x < -50 || e.x > w + 50) {
          e.y = h + Math.random() * 50;
          e.x = Math.random() * w;
          e.vy = Math.random() * 0.4 + 0.1;
        }
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ---------- CTA CLICK ---------- */
  const handleJoin = () => {
    setSceneExit(true);
    setTimeout(() => navigate("/signup"), 900);
  };

  const handleLogin = () => {
    setSceneExit(true);
    setTimeout(() => navigate("/login"), 900);
  };

  return (
    <section
      ref={containerRef}
      className={`relative h-screen w-full overflow-hidden bg-black transition-all duration-700 ${
        sceneExit ? "opacity-0 blur-md" : "opacity-100"
      }`}
    >
      {/* HERO */}
      <div className="absolute inset-0 z-0 animate-[breathe_10s_ease-in-out_infinite]">
        <picture className="absolute inset-0">
          <source media="(max-width:640px)" srcSet={HERO_IMAGES.mobile} />
          <img
            src={HERO_IMAGES.desktop}
            alt=""
            className="w-full h-full object-cover"
          />
        </picture>
      </div>

      {/* EMBERS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* TOP-RIGHT: LANGUAGE SWITCHER + LOGIN */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3 pointer-events-auto">
        <LanguageSwitcher />
      </div>

      {/* TOP-RIGHT: LOGIN BUTTON - Positioned on top with highest z-index */}
      <div className="absolute top-6 right-[calc(1.5rem+60px)] z-[9999] pointer-events-auto">
        <button
          type="button"
          onClick={handleLogin}
          className="
            group
            inline-flex items-center gap-2
            px-4 py-2
            rounded-full
            bg-[#0b0703]/35
            backdrop-blur-sm
            border border-[#f3e7c3]/25
            shadow-[0_0_25px_rgba(255,200,120,0.15)]
            text-[#f3e7c3]
            font-serif
            text-sm sm:text-base
            hover:bg-[#0b0703]/55
            hover:border-[#f3e7c3]/45
            transition
            select-none
            cursor-pointer
          "
          aria-label={t("loginAria")}
        >
          <span className="opacity-90">{t("alreadyHave")}</span>
          <span className="font-semibold underline underline-offset-4 decoration-[#f3e7c3]/70 group-hover:decoration-[#f3e7c3]">
            {t("login")}
          </span>
        </button>
      </div>


      {/* PERMANENT BANNER */}
      <div className="absolute top-6 inset-x-0 z-30 flex justify-center pointer-events-none">
        <div className="px-10 py-4 bg-[#f3e7c3]/95 text-[#2a1c0f] rounded-sm shadow-2xl animate-glow font-serif text-xl">
          {t("welcome")}
        </div>
      </div>

      {/* ORBITING MESSAGES (auto-nudged away from CTA if needed) */}
      {messageIndex < MESSAGES.length && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div
            ref={msgWrapRef}
            className="absolute transition-all duration-1000"
            style={{
              left: ORBIT_POSITIONS[messageIndex].x,
              top: ORBIT_POSITIONS[messageIndex].y,
              transform: `translate(-50%, -50%) translateY(-${msgNudgeUpPx}px) rotate(${ORBIT_POSITIONS[messageIndex].rot}deg)`,
            }}
          >
            <UnfurlingScroll
              key={`${messageIndex}-${MESSAGES[messageIndex]}`}
              text={MESSAGES[messageIndex]}
              onDone={() => setMessageIndex((i) => i + 1)}
            />
          </div>
        </div>
      )}

      {/* ✅ CTA — always present, centered X, slightly below center Y */}
      <div
        ref={ctaRef}
        className="
          absolute left-1/2 top-[64%] z-40
          -translate-x-1/2 -translate-y-1/2
          flex items-center justify-center
        "
      >
        <button
          onClick={handleJoin}
          className="
            px-12 py-5
            text-xl font-semibold font-serif
            tracking-wide
            text-[#2a1c0f]
            bg-[#f3e7c3]/95
            rounded-full
            shadow-[0_0_35px_rgba(255,200,120,0.65)]
            hover:scale-105
            transition-transform
            focus:outline-none focus:ring-2 focus:ring-[#f3e7c3]/70
            animate-[ctaBreathe_7s_ease-in-out_infinite]
          "
        >
          {t("join")}
        </button>
      </div>

      {/* Local keyframes (drop-in) */}
      <style>{`
        @keyframes ctaBreathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(255,200,120,0));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 12px rgba(255,200,120,0.55));
          }
        }
      `}</style>
    </section>
  );
}
