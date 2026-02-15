/**
 * useBeeAvatar Hook & Context
 *
 * Provides a global way to summon Breeeeeeeeahnah from anywhere in the app
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from "react-router-dom";
import { BeeAvatar } from './index';
import { useBrand } from "../../brands/BrandContext";

const BeeAvatarContext = createContext(null);
const AUTO_AMBIENT_ENABLED = false; // disable default auto-summon to reduce impact

export function BeeAvatarProvider({ children }) {
  const { brandId } = useBrand();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const autoAmbientRef = useRef(false);
  const AUTH_SUPPRESS_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthRoute = AUTH_SUPPRESS_PATHS.some((p) =>
    (location?.pathname || "").startsWith(p)
  );

  const summonBee = useCallback((isAmbient = false) => {
    setAmbient(isAmbient);
    setIsVisible(true);
  }, []);

  const dismissBee = useCallback(() => {
    setIsVisible(false);
    setAmbient(false);
  }, []);

  // Listen for global summon event & keyboard shortcut
  useEffect(() => {
    const handleSummon = () => summonBee();
    window.addEventListener('summon-bee', handleSummon);

    // Keyboard shortcut: Ctrl+Shift+B or Cmd+Shift+B
    const handleKeyboard = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        summonBee();
      }
    };
    window.addEventListener('keydown', handleKeyboard);

    // Make summonBee available globally for console access
    window.summonBee = summonBee;

    return () => {
      window.removeEventListener('summon-bee', handleSummon);
      window.removeEventListener('keydown', handleKeyboard);
      delete window.summonBee;
    };
  }, [summonBee]);

  // TelepromptTV: keep Breeeeeeeeahnah present in ambient mode across all pages.
  // (This makes the mascot a persistent companion, not just a welcome-page cameo.)
  useEffect(() => {
    if (AUTO_AMBIENT_ENABLED && brandId === "ttv") {
      if (isAuthRoute) {
        dismissBee();
        autoAmbientRef.current = false;
        return;
      }
      if (!isVisible || !ambient) {
        summonBee(true);
        autoAmbientRef.current = true;
      }
      return;
    }

    // If we auto-summoned for TTV, hide her when leaving TTV brand.
    if (autoAmbientRef.current) {
      dismissBee();
      autoAmbientRef.current = false;
    }
  }, [brandId, isVisible, ambient, summonBee, dismissBee, isAuthRoute]);

  // Never show Bree on auth pages so she can't block inputs
  useEffect(() => {
    if (!isAuthRoute) return;
    if (isVisible) dismissBee();
  }, [isAuthRoute, isVisible, dismissBee]);

  return (
    <BeeAvatarContext.Provider value={{ summonBee, dismissBee, isVisible }}>
      {children}
      {isVisible && (
        <BeeAvatar
          ambient={ambient}
          onClose={dismissBee}
          onAnimationComplete={() => {
            console.log('🐝 Breeeeeeeeahnah entrance complete!');
          }}
        />
      )}
    </BeeAvatarContext.Provider>
  );
}

export function useBeeAvatar() {
  const context = useContext(BeeAvatarContext);
  if (!context) {
    throw new Error('useBeeAvatar must be used within BeeAvatarProvider');
  }
  return context;
}

// Note: window.summonBee is set up automatically when BeeAvatarProvider mounts
