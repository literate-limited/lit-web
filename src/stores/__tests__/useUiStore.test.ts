/**
 * Tests for useUiStore (Zustand store)
 *
 * Replaces LevelContextProvider functionality for:
 * - Modal state (logout, progress, completion, etc.)
 * - UI flags (fullscreen, clueButton, answerIncorrect)
 * - User preferences (videoAutoPlay, audioAutoPlay, keyboardSettings)
 * - Persistence to localStorage
 */

import { renderHook, act } from '@testing-library/react';
import { useUiStore } from '../useUiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store to hardcoded defaults
    localStorage.clear();
    const { result } = renderHook(() => useUiStore());
    act(() => {
      result.current.resetToDefaults?.();
    });
  });

  describe('Modal State Management', () => {
    it('should initialize modals as closed', () => {
      const { result } = renderHook(() => useUiStore());

      expect(result.current.isLogoutModalOpen).toBe(false);
      expect(result.current.isProgressModalOpen).toBe(false);
      expect(result.current.isDeleteAccountOpen).toBe(false);
      expect(result.current.isCompletionModalOpen).toBe(false);
    });

    it('should open and close logout modal', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openLogoutModal();
      });
      expect(result.current.isLogoutModalOpen).toBe(true);

      act(() => {
        result.current.closeLogoutModal();
      });
      expect(result.current.isLogoutModalOpen).toBe(false);
    });

    it('should open and close progress modal', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openProgressModal();
      });
      expect(result.current.isProgressModalOpen).toBe(true);

      act(() => {
        result.current.closeProgressModal();
      });
      expect(result.current.isProgressModalOpen).toBe(false);
    });

    it('should open and close delete account modal', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openDeleteAccountModal();
      });
      expect(result.current.isDeleteAccountOpen).toBe(true);

      act(() => {
        result.current.closeDeleteAccountModal();
      });
      expect(result.current.isDeleteAccountOpen).toBe(false);
    });

    it('should open and close completion modal', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openCompletionModal();
      });
      expect(result.current.isCompletionModalOpen).toBe(true);

      act(() => {
        result.current.closeCompletionModal();
      });
      expect(result.current.isCompletionModalOpen).toBe(false);
    });

    it('should toggle modals independently', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openLogoutModal();
        result.current.openProgressModal();
      });

      expect(result.current.isLogoutModalOpen).toBe(true);
      expect(result.current.isProgressModalOpen).toBe(true);
      expect(result.current.isDeleteAccountOpen).toBe(false);

      act(() => {
        result.current.closeLogoutModal();
      });

      expect(result.current.isLogoutModalOpen).toBe(false);
      expect(result.current.isProgressModalOpen).toBe(true);
    });
  });

  describe('UI Flags', () => {
    it('should manage fullscreen state', () => {
      const { result } = renderHook(() => useUiStore());

      expect(result.current.isFullScreen).toBe(false);

      act(() => {
        result.current.setIsFullScreen(true);
      });
      expect(result.current.isFullScreen).toBe(true);

      act(() => {
        result.current.setIsFullScreen(false);
      });
      expect(result.current.isFullScreen).toBe(false);
    });

    it('should manage clue button visibility', () => {
      const { result } = renderHook(() => useUiStore());

      expect(result.current.clueButton).toBe(false);

      act(() => {
        result.current.setClueButton(true);
      });
      expect(result.current.clueButton).toBe(true);

      act(() => {
        result.current.setClueButton(false);
      });
      expect(result.current.clueButton).toBe(false);
    });

    it('should manage answer incorrect flag', () => {
      const { result } = renderHook(() => useUiStore());

      expect(result.current.isAnswerIncorrect).toBe(false);

      act(() => {
        result.current.setIsAnswerIncorrect(true);
      });
      expect(result.current.isAnswerIncorrect).toBe(true);

      act(() => {
        result.current.setIsAnswerIncorrect(false);
      });
      expect(result.current.isAnswerIncorrect).toBe(false);
    });
  });

  describe('User Preferences (with persistence)', () => {
    it('should initialize preferences with localStorage defaults', () => {
      localStorage.setItem('videoAutoPlay', 'true');
      localStorage.setItem('audioAutoPlay', 'false');
      localStorage.setItem('keyboardSettings', JSON.stringify({
        hoverSoundEnabled: true,
        hoverSoundDelay: 500,
        loopCount: 2,
      }));

      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.resetStore?.();
      });

      expect(result.current.videoAutoPlay).toBe(true);
      expect(result.current.audioAutoPlay).toBe(false);
      expect(result.current.keyboardSettings.loopCount).toBe(2);
    });

    it('should use default preferences if localStorage is empty', () => {
      const { result } = renderHook(() => useUiStore());

      expect(result.current.videoAutoPlay).toBe(false);
      expect(result.current.audioAutoPlay).toBe(false);
      expect(result.current.keyboardSettings.hoverSoundEnabled).toBe(true);
    });

    it('should toggle video auto play and persist', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.setVideoAutoPlay(true);
      });

      expect(result.current.videoAutoPlay).toBe(true);
      expect(JSON.parse(localStorage.getItem('videoAutoPlay') || 'false')).toBe(true);

      act(() => {
        result.current.setVideoAutoPlay(false);
      });

      expect(result.current.videoAutoPlay).toBe(false);
      expect(JSON.parse(localStorage.getItem('videoAutoPlay') || 'true')).toBe(false);
    });

    it('should toggle audio auto play and persist', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.setAudioAutoPlay(true);
      });

      expect(result.current.audioAutoPlay).toBe(true);
      expect(JSON.parse(localStorage.getItem('audioAutoPlay') || 'false')).toBe(true);
    });

    it('should update keyboard settings and persist', () => {
      const { result } = renderHook(() => useUiStore());

      const newSettings = {
        hoverSoundEnabled: false,
        hoverSoundDelay: 1000,
        loopCount: 3,
      };

      act(() => {
        result.current.setKeyboardSettings(newSettings);
      });

      expect(result.current.keyboardSettings).toEqual(newSettings);

      const stored = JSON.parse(localStorage.getItem('keyboardSettings') || '{}');
      expect(stored.loopCount).toBe(3);
      expect(stored.hoverSoundDelay).toBe(1000);
    });

    it('should toggle hover sound and persist', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.setKeyboardSettings({
          ...result.current.keyboardSettings,
          hoverSoundEnabled: false,
        });
      });

      expect(result.current.keyboardSettings.hoverSoundEnabled).toBe(false);

      const stored = JSON.parse(localStorage.getItem('keyboardSettings') || '{}');
      expect(stored.hoverSoundEnabled).toBe(false);
    });

    it('should update hover sound delay and persist', () => {
      const { result } = renderHook(() => useUiStore());

      const delayInMs = 2000;

      act(() => {
        result.current.setKeyboardSettings({
          ...result.current.keyboardSettings,
          hoverSoundDelay: delayInMs,
        });
      });

      expect(result.current.keyboardSettings.hoverSoundDelay).toBe(delayInMs);

      const stored = JSON.parse(localStorage.getItem('keyboardSettings') || '{}');
      expect(stored.hoverSoundDelay).toBe(delayInMs);
    });

    it('should update loop count and persist', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.setKeyboardSettings({
          ...result.current.keyboardSettings,
          loopCount: 4,
        });
      });

      expect(result.current.keyboardSettings.loopCount).toBe(4);

      const stored = JSON.parse(localStorage.getItem('keyboardSettings') || '{}');
      expect(stored.loopCount).toBe(4);
    });

    it('should persist preferences across store instances', () => {
      const { result: result1 } = renderHook(() => useUiStore());

      act(() => {
        result1.current.setVideoAutoPlay(true);
        result1.current.setAudioAutoPlay(true);
      });

      // Create new instance - should load from localStorage
      const { result: result2 } = renderHook(() => useUiStore());

      expect(result2.current.videoAutoPlay).toBe(true);
      expect(result2.current.audioAutoPlay).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all modal states', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openLogoutModal();
        result.current.openProgressModal();
        result.current.openDeleteAccountModal();
        result.current.openCompletionModal();
      });

      act(() => {
        result.current.resetModalStates();
      });

      expect(result.current.isLogoutModalOpen).toBe(false);
      expect(result.current.isProgressModalOpen).toBe(false);
      expect(result.current.isDeleteAccountOpen).toBe(false);
      expect(result.current.isCompletionModalOpen).toBe(false);
    });

    it('should reset all UI flags', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.setIsFullScreen(true);
        result.current.setClueButton(true);
        result.current.setIsAnswerIncorrect(true);
      });

      act(() => {
        result.current.resetUiFlags();
      });

      expect(result.current.isFullScreen).toBe(false);
      expect(result.current.clueButton).toBe(false);
      expect(result.current.isAnswerIncorrect).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid modal toggle', () => {
      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.openLogoutModal();
        result.current.closeLogoutModal();
        result.current.openLogoutModal();
        result.current.openLogoutModal(); // Double open
      });

      expect(result.current.isLogoutModalOpen).toBe(true);

      act(() => {
        result.current.closeLogoutModal();
        result.current.closeLogoutModal(); // Double close
      });

      expect(result.current.isLogoutModalOpen).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('keyboardSettings', 'invalid json');

      const { result } = renderHook(() => useUiStore());

      act(() => {
        result.current.resetStore?.();
      });

      // Should fall back to defaults instead of crashing
      expect(result.current.keyboardSettings).toBeDefined();
      expect(result.current.keyboardSettings.hoverSoundEnabled).toBe(true);
    });

    it('should handle missing keyboard settings keys', () => {
      localStorage.setItem('keyboardSettings', JSON.stringify({
        hoverSoundEnabled: true,
        // missing hoverSoundDelay and loopCount
      }));

      const { result } = renderHook(() => useUiStore());

      expect(result.current.keyboardSettings.hoverSoundDelay).toBeDefined();
      expect(result.current.keyboardSettings.loopCount).toBeDefined();
    });
  });
});
