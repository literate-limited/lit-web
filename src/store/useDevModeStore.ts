/**
 * useDevModeStore - Zustand store for developer mode features
 *
 * Replaces DevModeContext with better performance and simpler patterns.
 * Manages:
 * - Dev mode toggle and permissions
 * - Component inspector state
 * - Feedback panel state
 * - Terminal state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface DevModeStore {
  // Permissions
  canAccessDevMode: boolean;
  setCanAccessDevMode: (can: boolean) => void;

  // Dev mode toggle
  devModeActive: boolean;
  toggleDevMode: () => void;

  // Inspector state
  inspectorEnabled: boolean;
  toggleInspector: () => void;
  selectedElement: HTMLElement | null;
  selectedComponentInfo: any;
  selectElement: (element: HTMLElement | null, componentInfo: any) => void;
  clearSelection: () => void;

  // Feedback panel
  feedbackPanelOpen: boolean;
  feedbackTarget: any;
  openFeedback: (componentInfo: any) => void;
  closeFeedback: () => void;

  // Terminal
  terminalExpanded: boolean;
  setTerminalExpanded: (expanded: boolean) => void;
  terminalMode: "command" | "chat" | "edit";
  setTerminalMode: (mode: "command" | "chat" | "edit") => void;
}

export const useDevModeStore = create<DevModeStore>()(
  devtools(
    (set, get) => ({
      // Permissions
      canAccessDevMode: false,
      setCanAccessDevMode: (can: boolean) => set({ canAccessDevMode: can }),

      // Dev mode toggle
      devModeActive: false,
      toggleDevMode: () =>
        set((state) => {
          const newActive = !state.devModeActive;
          // When turning off, reset inspector/feedback states
          if (!newActive) {
            return {
              devModeActive: newActive,
              inspectorEnabled: false,
              selectedElement: null,
              selectedComponentInfo: null,
              feedbackPanelOpen: false,
            };
          }
          return { devModeActive: newActive };
        }),

      // Inspector
      inspectorEnabled: false,
      toggleInspector: () =>
        set((state) => {
          const newEnabled = !state.inspectorEnabled;
          // When turning off, clear selection
          if (!newEnabled) {
            return {
              inspectorEnabled: newEnabled,
              selectedElement: null,
              selectedComponentInfo: null,
            };
          }
          return { inspectorEnabled: newEnabled };
        }),

      selectedElement: null,
      selectedComponentInfo: null,
      selectElement: (element: HTMLElement | null, componentInfo: any) =>
        set({
          selectedElement: element,
          selectedComponentInfo: componentInfo,
          feedbackTarget: componentInfo,
          feedbackPanelOpen: true,
        }),

      clearSelection: () =>
        set({
          selectedElement: null,
          selectedComponentInfo: null,
          feedbackPanelOpen: false,
          feedbackTarget: null,
        }),

      // Feedback panel
      feedbackPanelOpen: false,
      feedbackTarget: null,
      openFeedback: (componentInfo: any) =>
        set({
          feedbackTarget: componentInfo,
          feedbackPanelOpen: true,
        }),

      closeFeedback: () =>
        set({
          feedbackPanelOpen: false,
          feedbackTarget: null,
        }),

      // Terminal
      terminalExpanded: false,
      setTerminalExpanded: (expanded: boolean) =>
        set({ terminalExpanded: expanded }),

      terminalMode: "command" as const,
      setTerminalMode: (mode: "command" | "chat" | "edit") =>
        set({ terminalMode: mode }),
    }),
    {
      name: "DevModeStore",
    }
  )
);

/**
 * Adapter hooks for semantic grouping
 */

export function useDevModePermissions() {
  return {
    canAccessDevMode: useDevModeStore((s) => s.canAccessDevMode),
    setCanAccessDevMode: useDevModeStore((s) => s.setCanAccessDevMode),
  };
}

export function useDevModeToggle() {
  return {
    devModeActive: useDevModeStore((s) => s.devModeActive),
    toggleDevMode: useDevModeStore((s) => s.toggleDevMode),
  };
}

export function useInspector() {
  return {
    inspectorEnabled: useDevModeStore((s) => s.inspectorEnabled),
    toggleInspector: useDevModeStore((s) => s.toggleInspector),
    selectedElement: useDevModeStore((s) => s.selectedElement),
    selectedComponentInfo: useDevModeStore((s) => s.selectedComponentInfo),
    selectElement: useDevModeStore((s) => s.selectElement),
    clearSelection: useDevModeStore((s) => s.clearSelection),
  };
}

export function useFeedbackPanel() {
  return {
    feedbackPanelOpen: useDevModeStore((s) => s.feedbackPanelOpen),
    feedbackTarget: useDevModeStore((s) => s.feedbackTarget),
    openFeedback: useDevModeStore((s) => s.openFeedback),
    closeFeedback: useDevModeStore((s) => s.closeFeedback),
  };
}

export function useTerminal() {
  return {
    terminalExpanded: useDevModeStore((s) => s.terminalExpanded),
    setTerminalExpanded: useDevModeStore((s) => s.setTerminalExpanded),
    terminalMode: useDevModeStore((s) => s.terminalMode),
    setTerminalMode: useDevModeStore((s) => s.setTerminalMode),
  };
}
