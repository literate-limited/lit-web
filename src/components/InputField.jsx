import { useContext } from "react";
import { ThemeContext } from "../utils/themes/ThemeContext";
import useMediaQuery from "../hooks/useMediaQuery";
import { handleKeyDown } from "../utils/handleKeyDown.utils";
import { KEYBOARD_OPTIONS } from "../utils/keyboardMappings";
import { useTranslation } from "../translator/hooks/useTranslation";
import Translations from "../translations/playButtonContainer";
import { useLessonGame } from "../hooks/useLesson";
import { useLessonUIFlags } from "../hooks/useLessonUI";

const InputField = () => {
  const {
    inputValue,
    setInputValue,
    handleCheckAnswer,
    currentLevelType,
    handleClueClick,
  } = useLessonGame();
  const { clueButton } = useLessonUIFlags();
  const { currentTheme } = useContext(ThemeContext);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
  const { t } = useTranslation(Translations);

  const keyboardType = localStorage.getItem("keyboardType") || "en";
  const customKeyMapping =
    KEYBOARD_OPTIONS[keyboardType] || KEYBOARD_OPTIONS.en;

  return (
    <div className="flex gap-4 items-center justify-center">
      <input
        type="text"
        style={{
          backgroundColor: currentTheme.placeholderBg,
          color: currentTheme.textColor,
        }}
        id="inputField"
        readOnly={isMobile}
        onKeyDown={(e) =>
          handleKeyDown(e, setInputValue, handleCheckAnswer, customKeyMapping)
        }
        className="center w-11/12 p-3 text-xl mx-auto block border border-white rounded-full"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={t("enterYourAnswer")}
      />
      {currentLevelType === "sound" && clueButton && (
        <button
          style={{
            backgroundColor: currentTheme.buttonColor,
            color: currentTheme.textColor,
          }}
          className="relative w-22 h-14 text-3xl cursor-pointer p-6 rounded-full 
                     transition-transform duration-300 ease-in-out 
                     hover:text-purple-500 hover:transform hover:scale-125 
                     flex items-center justify-center"
          id="clueButton"
          onClick={handleClueClick}
        >
          <span className="mb-2">💡</span>
          <span className="absolute bottom-0 text-sm text-center">
            {t("clueButton")}
          </span>
        </button>
      )}
    </div>
  );
};

export default InputField;
