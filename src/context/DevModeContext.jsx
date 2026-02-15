/**
 * DevModeContext (Deprecated - Use Zustand Store)
 *
 * This context has been migrated to Zustand for better performance.
 * It now delegates to the Zustand store but maintains backward compatibility.
 *
 * ✅ NEW: Use the Zustand store directly
 *   import { useDevModeStore } from '../stores/useDevModeStore';
 *   import { useDevModePermissions, useTerminal } from '../stores/useDevModeStore';
 *
 * ⚠️ OLD: Context API (still works but will be removed)
 *   import { useDevMode } from './DevModeContext';
 */

import { createContext, useContext, useMemo } from "react";
import {
  useDevModeStore,
  useDevModePermissions,
  useInspector,
  useFeedbackPanel,
  useTerminal,
} from "../stores/useDevModeStore";

export const DevModeContext = createContext(null);

/**
 * DevModeProvider
 * Now delegates to Zustand store
 */
export const DevModeProvider = ({ children }) => {
  // Initialize permissions from UserContext
  const canAccess = useDevModeStore((s) => s.canAccessDevMode);
  const setCanAccess = useDevModeStore((s) => s.setCanAccessDevMode);

  // Check if user has dev/admin privileges
  // NOTE: This should be set by UserProvider when user loads
  // For now, we'll initialize it when the provider mounts
  const ctxValue = useMemo(
    () => ({
      // Delegate all calls to Zustand store
      canAccessDevMode: canAccess,
      devModeActive: useDevModeStore.getState().devModeActive,
      toggleDevMode: useDevModeStore.getState().toggleDevMode,
      inspectorEnabled: useDevModeStore.getState().inspectorEnabled,
      toggleInspector: useDevModeStore.getState().toggleInspector,
      selectedElement: useDevModeStore.getState().selectedElement,
      selectedComponentInfo: useDevModeStore.getState().selectedComponentInfo,
      selectElement: useDevModeStore.getState().selectElement,
      clearSelection: useDevModeStore.getState().clearSelection,
      feedbackPanelOpen: useDevModeStore.getState().feedbackPanelOpen,
      feedbackTarget: useDevModeStore.getState().feedbackTarget,
      openFeedback: useDevModeStore.getState().openFeedback,
      closeFeedback: useDevModeStore.getState().closeFeedback,
      terminalExpanded: useDevModeStore.getState().terminalExpanded,
      setTerminalExpanded: useDevModeStore.getState().setTerminalExpanded,
      terminalMode: useDevModeStore.getState().terminalMode,
      setTerminalMode: useDevModeStore.getState().setTerminalMode,
    }),
    [canAccess]
  );

  return (
    <DevModeContext.Provider value={ctxValue}>
      {children}
    </DevModeContext.Provider>
  );
};

/**
 * DEPRECATED: Use Zustand store directly
 *
 * Backward compatibility hook - still works but prefer the Zustand store
 */
export const useDevMode = () => {
  const ctx = useContext(DevModeContext);
  if (!ctx) {
    // Return Zustand state directly if context not available
    return {
      canAccessDevMode: false,
      devModeActive: false,
      toggleDevMode: () => {},
      inspectorEnabled: false,
      toggleInspector: () => {},
      selectedElement: null,
      selectedComponentInfo: null,
      selectElement: () => {},
      clearSelection: () => {},
      feedbackPanelOpen: false,
      feedbackTarget: null,
      openFeedback: () => {},
      closeFeedback: () => {},
      terminalExpanded: false,
      setTerminalExpanded: () => {},
      terminalMode: "command",
      setTerminalMode: () => {},
    };
  }
  return ctx;
};

export default DevModeContext;
