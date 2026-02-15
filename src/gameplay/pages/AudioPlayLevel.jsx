import { useEffect } from "react";
import { useLessonGame } from "../../hooks/useLesson";

const AudioPlayLevel = () => {
  const { currentLevel, updateUserLevel, levelIndex } =
    useLessonGame();

  useEffect(() => {
    if (!currentLevel?.audio?.url) return;

    const audio = new Audio(currentLevel.audio.url);

    audio.onended = () => {
      updateUserLevel(levelIndex + 1);
    };

    audio.play();

    return () => {
      audio.pause();
    };
  }, [currentLevel, levelIndex, updateUserLevel]);

  return null;
};

export default AudioPlayLevel;
