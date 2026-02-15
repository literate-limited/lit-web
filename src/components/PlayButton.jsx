import { useContext, useRef, useEffect } from "react";
import { HiMiniPlay } from "react-icons/hi2";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useTranslation } from "../translator/hooks/useTranslation";
import Translations from "../translations/playButtonContainer";
import { useLessonGame } from "../hooks/useLesson";
import { useLessonPreferences } from "../hooks/useLessonUI";

const PlayButton = () => {
  const { currentSound } = useLessonGame();
  const { audioAutoPlay } = useLessonPreferences();
  const { currentTheme } = useContext(ThemeContext);
  const { t } = useTranslation(Translations);
  const pronunciationRef = useRef(null);

  useEffect(() => {
    if (currentSound && pronunciationRef.current) {
      pronunciationRef.current.src = currentSound.sound;
      pronunciationRef.current.load();
    }
  }, [currentSound]);

  const playSound = () => {
    if (pronunciationRef.current) {
      pronunciationRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
    }
  };

  return (
    <div className="flex items-center justify-center">
      <audio ref={pronunciationRef} autoPlay={audioAutoPlay} />
      <button
        style={{
          backgroundColor: currentTheme.playbuttonColor,
          color: currentTheme.textColor,
        }}
        className="relative w-22 h-14 text-3xl cursor-pointer p-6 rounded-full 
                   transition-transform duration-300 ease-in-out 
                   hover:text-purple-500 hover:transform hover:scale-125 
                   flex items-center justify-center"
        id="playButton"
        onClick={playSound}
      >
        <HiMiniPlay className="mb-2" />
        <span className="absolute bottom-0 text-sm text-center">
          {t("playButton")}
        </span>
      </button>
    </div>
  );
};

export default PlayButton;
