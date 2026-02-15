/**
 * useUiStore - Zustand store for UI state and preferences
 *
 * Replaces LevelContextProvider UI/preferences logic
 * Manages:
 * - Modal state (logout, progress, delete account, completion)
 * - UI flags (fullscreen, clueButton, answerIncorrect)
 * - User preferences with localStorage persistence
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, devtools } from 'zustand/middleware';

export interface KeyboardSettings {
  hoverSoundEnabled: boolean;
  hoverSoundDelay: number;
  loopCount: number;
}

interface UiStoreState {
  // Modal state
  isLogoutModalOpen: boolean;
  isProgressModalOpen: boolean;
  isDeleteAccountOpen: boolean;
  isCompletionModalOpen: boolean;

  // UI flags
  isFullScreen: boolean;
  clueButton: boolean;
  isAnswerIncorrect: boolean;

  // User preferences (persisted)
  videoAutoPlay: boolean;
  audioAutoPlay: boolean;
  keyboardSettings: KeyboardSettings;

  // Modal actions
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  openProgressModal: () => void;
  closeProgressModal: () => void;
  openDeleteAccountModal: () => void;
  closeDeleteAccountModal: () => void;
  openCompletionModal: () => void;
  closeCompletionModal: () => void;

  // UI flag actions
  setIsFullScreen: (value: boolean) => void;
  setClueButton: (value: boolean) => void;
  setIsAnswerIncorrect: (value: boolean) => void;

  // Preference actions
  setVideoAutoPlay: (value: boolean) => void;
  setAudioAutoPlay: (value: boolean) => void;
  setKeyboardSettings: (settings: Partial<KeyboardSettings>) => void;

  // Reset actions
  resetModalStates: () => void;
  resetUiFlags: () => void;
  resetStore?: () => void;
  resetToDefaults?: () => void;
}

const defaultKeyboardSettings: KeyboardSettings = {
  hoverSoundEnabled: true,
  hoverSoundDelay: 500,
  loopCount: 1,
};

const loadPreferencesFromStorage = () => {
  try {
    const videoAutoPlay = localStorage.getItem('videoAutoPlay');
    const audioAutoPlay = localStorage.getItem('audioAutoPlay');
    const keyboardSettingsJson = localStorage.getItem('keyboardSettings');

    let keyboardSettings = defaultKeyboardSettings;
    if (keyboardSettingsJson) {
      try {
        const parsed = JSON.parse(keyboardSettingsJson);
        keyboardSettings = { ...defaultKeyboardSettings, ...parsed };
      } catch (parseError) {
        // If JSON parse fails, use defaults
        keyboardSettings = defaultKeyboardSettings;
      }
    }

    return {
      videoAutoPlay: videoAutoPlay === 'true',
      audioAutoPlay: audioAutoPlay === 'true',
      keyboardSettings,
    };
  } catch (e) {
    return {
      videoAutoPlay: false,
      audioAutoPlay: false,
      keyboardSettings: defaultKeyboardSettings,
    };
  }
};

const persistPreferences = (state: UiStoreState) => {
  localStorage.setItem('videoAutoPlay', String(state.videoAutoPlay));
  localStorage.setItem('audioAutoPlay', String(state.audioAutoPlay));
  localStorage.setItem('keyboardSettings', JSON.stringify(state.keyboardSettings));
};

export const useUiStore = create<UiStoreState>()(
  devtools(
    immer((set, get) => {
    const preferences = loadPreferencesFromStorage();
    return {
      // Initial state
      isLogoutModalOpen: false,
      isProgressModalOpen: false,
      isDeleteAccountOpen: false,
      isCompletionModalOpen: false,
      isFullScreen: false,
      clueButton: false,
      isAnswerIncorrect: false,
      ...preferences,

    // Modal actions
    openLogoutModal: () => {
      set((state) => {
        state.isLogoutModalOpen = true;
      });
    },

    closeLogoutModal: () => {
      set((state) => {
        state.isLogoutModalOpen = false;
      });
    },

    openProgressModal: () => {
      set((state) => {
        state.isProgressModalOpen = true;
      });
    },

    closeProgressModal: () => {
      set((state) => {
        state.isProgressModalOpen = false;
      });
    },

    openDeleteAccountModal: () => {
      set((state) => {
        state.isDeleteAccountOpen = true;
      });
    },

    closeDeleteAccountModal: () => {
      set((state) => {
        state.isDeleteAccountOpen = false;
      });
    },

    openCompletionModal: () => {
      set((state) => {
        state.isCompletionModalOpen = true;
      });
    },

    closeCompletionModal: () => {
      set((state) => {
        state.isCompletionModalOpen = false;
      });
    },

    // UI flag actions
    setIsFullScreen: (value) => {
      set((state) => {
        state.isFullScreen = value;
      });
    },

    setClueButton: (value) => {
      set((state) => {
        state.clueButton = value;
      });
    },

    setIsAnswerIncorrect: (value) => {
      set((state) => {
        state.isAnswerIncorrect = value;
      });
    },

    // Preference actions
    setVideoAutoPlay: (value) => {
      set((state) => {
        state.videoAutoPlay = value;
        localStorage.setItem('videoAutoPlay', String(value));
      });
    },

    setAudioAutoPlay: (value) => {
      set((state) => {
        state.audioAutoPlay = value;
        localStorage.setItem('audioAutoPlay', String(value));
      });
    },

    setKeyboardSettings: (settings) => {
      set((state) => {
        state.keyboardSettings = { ...state.keyboardSettings, ...settings };
        localStorage.setItem('keyboardSettings', JSON.stringify(state.keyboardSettings));
      });
    },

    // Reset actions
    resetModalStates: () => {
      set((state) => {
        state.isLogoutModalOpen = false;
        state.isProgressModalOpen = false;
        state.isDeleteAccountOpen = false;
        state.isCompletionModalOpen = false;
      });
    },

    resetUiFlags: () => {
      set((state) => {
        state.isFullScreen = false;
        state.clueButton = false;
        state.isAnswerIncorrect = false;
      });
    },

    resetStore: () => {
      const preferences = loadPreferencesFromStorage();
      set((state) => {
        state.isLogoutModalOpen = false;
        state.isProgressModalOpen = false;
        state.isDeleteAccountOpen = false;
        state.isCompletionModalOpen = false;
        state.isFullScreen = false;
        state.clueButton = false;
        state.isAnswerIncorrect = false;
        state.videoAutoPlay = preferences.videoAutoPlay;
        state.audioAutoPlay = preferences.audioAutoPlay;
        state.keyboardSettings = preferences.keyboardSettings;
      });
    },

    resetToDefaults: () => {
      set((state) => {
        state.isLogoutModalOpen = false;
        state.isProgressModalOpen = false;
        state.isDeleteAccountOpen = false;
        state.isCompletionModalOpen = false;
        state.isFullScreen = false;
        state.clueButton = false;
        state.isAnswerIncorrect = false;
        state.videoAutoPlay = false;
        state.audioAutoPlay = false;
        state.keyboardSettings = defaultKeyboardSettings;
      });
    },
    };
    }),
    { name: 'UiStore' }
  )
);
