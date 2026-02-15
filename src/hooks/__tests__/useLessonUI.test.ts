/**
 * Tests for useLessonUI adapter hooks
 *
 * Semantic wrapper hooks over useUiStore that:
 * - Provide clear, focused API for modals and preferences
 * - Separate concerns (modals vs. UI flags vs. preferences)
 * - Persist preferences to localStorage
 */

import { renderHook, act } from '@testing-library/react';
import {
  useLessonModals,
  useLessonUIFlags,
  useLessonPreferences,
} from '../useLessonUI';
import { useUiStore } from '../../stores/useUiStore';

describe('Lesson UI Adapter Hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    const { result } = renderHook(() => useUiStore());
    act(() => {
      result.current.resetToDefaults?.();
    });
  });

  describe('useLessonModals()', () => {
    it('should provide all modal state and controls', () => {
      const { result } = renderHook(() => useLessonModals());

      // State
      expect(result.current).toHaveProperty('isLogoutModalOpen');
      expect(result.current).toHaveProperty('isProgressModalOpen');
      expect(result.current).toHaveProperty('isDeleteAccountOpen');
      expect(result.current).toHaveProperty('isCompletionModalOpen');

      // Controls
      expect(typeof result.current.openLogoutModal).toBe('function');
      expect(typeof result.current.closeLogoutModal).toBe('function');
      expect(typeof result.current.openProgressModal).toBe('function');
      expect(typeof result.current.closeProgressModal).toBe('function');
    });

    it('should open and close logout modal independently', () => {
      const { result } = renderHook(() => useLessonModals());

      act(() => {
        result.current.openLogoutModal();
      });
      expect(result.current.isLogoutModalOpen).toBe(true);

      act(() => {
        result.current.closeLogoutModal();
      });
      expect(result.current.isLogoutModalOpen).toBe(false);
    });

    it('should open and close progress modal independently', () => {
      const { result } = renderHook(() => useLessonModals());

      act(() => {
        result.current.openProgressModal();
      });
      expect(result.current.isProgressModalOpen).toBe(true);

      act(() => {
        result.current.closeProgressModal();
      });
      expect(result.current.isProgressModalOpen).toBe(false);
    });

    it('should open and close delete account modal independently', () => {
      const { result } = renderHook(() => useLessonModals());

      act(() => {
        result.current.openDeleteAccountModal();
      });
      expect(result.current.isDeleteAccountOpen).toBe(true);

      act(() => {
        result.current.closeDeleteAccountModal();
      });
      expect(result.current.isDeleteAccountOpen).toBe(false);
    });

    it('should open and close completion modal independently', () => {
      const { result } = renderHook(() => useLessonModals());

      act(() => {
        result.current.openCompletionModal();
      });
      expect(result.current.isCompletionModalOpen).toBe(true);

      act(() => {
        result.current.closeCompletionModal();
      });
      expect(result.current.isCompletionModalOpen).toBe(false);
    });

    it('should manage multiple modals open simultaneously', () => {
      const { result } = renderHook(() => useLessonModals());

      act(() => {
        result.current.openLogoutModal();
        result.current.openProgressModal();
      });

      expect(result.current.isLogoutModalOpen).toBe(true);
      expect(result.current.isProgressModalOpen).toBe(true);

      act(() => {
        result.current.closeLogoutModal();
      });

      expect(result.current.isLogoutModalOpen).toBe(false);
      expect(result.current.isProgressModalOpen).toBe(true);
    });

  });

  describe('useLessonUIFlags()', () => {
    it('should provide UI flag state', () => {
      const { result } = renderHook(() => useLessonUIFlags());

      expect(result.current).toHaveProperty('isFullScreen');
      expect(result.current).toHaveProperty('clueButton');
      expect(result.current).toHaveProperty('isAnswerIncorrect');
      expect(result.current).toHaveProperty('setIsFullScreen');
      expect(result.current).toHaveProperty('setClueButton');
      expect(result.current).toHaveProperty('setIsAnswerIncorrect');
    });

    it('should toggle fullscreen mode', () => {
      const { result } = renderHook(() => useLessonUIFlags());

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

    it('should control clue button visibility', () => {
      const { result } = renderHook(() => useLessonUIFlags());

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

    it('should track answer correctness flag', () => {
      const { result } = renderHook(() => useLessonUIFlags());

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

  describe('useLessonPreferences()', () => {
    it('should provide preference state and controls', () => {
      const { result } = renderHook(() => useLessonPreferences());

      expect(result.current).toHaveProperty('videoAutoPlay');
      expect(result.current).toHaveProperty('audioAutoPlay');
      expect(result.current).toHaveProperty('keyboardSettings');
      expect(typeof result.current.setVideoAutoPlay).toBe('function');
      expect(typeof result.current.setAudioAutoPlay).toBe('function');
      expect(typeof result.current.setKeyboardSettings).toBe('function');
    });

    it('should initialize video autoplay from localStorage', () => {
      localStorage.setItem('videoAutoPlay', 'true');

      const { result } = renderHook(() => useLessonPreferences());

      act(() => {
        result.current.resetStore?.();
      });

      expect(result.current.videoAutoPlay).toBe(true);
    });

    it('should initialize audio autoplay from localStorage', () => {
      localStorage.setItem('audioAutoPlay', 'true');

      const { result } = renderHook(() => useLessonPreferences());

      act(() => {
        result.current.resetStore?.();
      });

      expect(result.current.audioAutoPlay).toBe(true);
    });

    it('should toggle video autoplay and persist', () => {
      const { result } = renderHook(() => useLessonPreferences());

      expect(result.current.videoAutoPlay).toBe(false);

      act(() => {
        result.current.setVideoAutoPlay(true);
      });

      expect(result.current.videoAutoPlay).toBe(true);
      expect(localStorage.getItem('videoAutoPlay')).toBe('true');

      act(() => {
        result.current.setVideoAutoPlay(false);
      });

      expect(result.current.videoAutoPlay).toBe(false);
      expect(localStorage.getItem('videoAutoPlay')).toBe('false');
    });

    it('should toggle audio autoplay and persist', () => {
      const { result } = renderHook(() => useLessonPreferences());

      expect(result.current.audioAutoPlay).toBe(false);

      act(() => {
        result.current.setAudioAutoPlay(true);
      });

      expect(result.current.audioAutoPlay).toBe(true);
      expect(localStorage.getItem('audioAutoPlay')).toBe('true');
    });

    it('should manage keyboard settings with defaults', () => {
      const { result } = renderHook(() => useLessonPreferences());

      expect(result.current.keyboardSettings.hoverSoundEnabled).toBe(true);
      expect(result.current.keyboardSettings.hoverSoundDelay).toBe(500);
      expect(result.current.keyboardSettings.loopCount).toBe(1);
    });

    it('should update keyboard settings and persist', () => {
      const { result } = renderHook(() => useLessonPreferences());

      const newSettings = {
        hoverSoundEnabled: false,
        hoverSoundDelay: 1500,
        loopCount: 3,
      };

      act(() => {
        result.current.setKeyboardSettings(newSettings);
      });

      expect(result.current.keyboardSettings).toEqual(newSettings);

      const stored = JSON.parse(localStorage.getItem('keyboardSettings') || '{}');
      expect(stored.hoverSoundEnabled).toBe(false);
      expect(stored.hoverSoundDelay).toBe(1500);
      expect(stored.loopCount).toBe(3);
    });

    it('should toggle hover sound within keyboard settings', () => {
      const { result } = renderHook(() => useLessonPreferences());

      act(() => {
        result.current.setKeyboardSettings({
          ...result.current.keyboardSettings,
          hoverSoundEnabled: false,
        });
      });

      expect(result.current.keyboardSettings.hoverSoundEnabled).toBe(false);
    });

    it('should update hover sound delay', () => {
      const { result } = renderHook(() => useLessonPreferences());

      const delays = [500, 1000, 1500, 2000, 3000];

      delays.forEach((delay) => {
        act(() => {
          result.current.setKeyboardSettings({
            ...result.current.keyboardSettings,
            hoverSoundDelay: delay,
          });
        });

        expect(result.current.keyboardSettings.hoverSoundDelay).toBe(delay);
      });
    });

    it('should update loop count', () => {
      const { result } = renderHook(() => useLessonPreferences());

      act(() => {
        result.current.setKeyboardSettings({
          ...result.current.keyboardSettings,
          loopCount: 5,
        });
      });

      expect(result.current.keyboardSettings.loopCount).toBe(5);
    });

    it('should persist preferences across hook instances', () => {
      const { result: result1 } = renderHook(() => useLessonPreferences());

      act(() => {
        result1.current.setVideoAutoPlay(true);
        result1.current.setAudioAutoPlay(true);
        result1.current.setKeyboardSettings({
          hoverSoundEnabled: false,
          hoverSoundDelay: 2000,
          loopCount: 4,
        });
      });

      // New hook instance should load from localStorage
      const { result: result2 } = renderHook(() => useLessonPreferences());

      expect(result2.current.videoAutoPlay).toBe(true);
      expect(result2.current.audioAutoPlay).toBe(true);
      expect(result2.current.keyboardSettings.hoverSoundEnabled).toBe(false);
      expect(result2.current.keyboardSettings.hoverSoundDelay).toBe(2000);
      expect(result2.current.keyboardSettings.loopCount).toBe(4);
    });

  });

  describe('Hook Integration', () => {
    it('should allow independent use of all three hooks', () => {
      const { result: modalsResult } = renderHook(() => useLessonModals());
      const { result: uiFlagsResult } = renderHook(() => useLessonUIFlags());
      const { result: prefsResult } = renderHook(() => useLessonPreferences());

      // All should initialize independently
      expect(modalsResult.current.isLogoutModalOpen).toBe(false);
      expect(uiFlagsResult.current.isFullScreen).toBe(false);
      expect(prefsResult.current.videoAutoPlay).toBe(false);

      // Changes should not affect other hooks
      act(() => {
        modalsResult.current.openLogoutModal();
      });

      expect(modalsResult.current.isLogoutModalOpen).toBe(true);
      expect(uiFlagsResult.current.isFullScreen).toBe(false);
      expect(prefsResult.current.videoAutoPlay).toBe(false);
    });

  });
});
