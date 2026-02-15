import React, { useContext } from "react";
import { FcIdea } from "react-icons/fc";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import { useLessonGame } from "../../hooks/useLesson";

const ClueButton = () => {
    const { handleClueClick } = useLessonGame();
    const { currentTheme } = useContext(ThemeContext);
  return (
    <div className="absolute right-0 top-0">
        <button
        style={{
          backgroundColor: currentTheme.playbuttonColor, color: currentTheme.textColor }}
      className="relative w-12 h-12 z-50 text-3xl cursor-pointer  rounded-full transition-transform duration-300 ease-in-out hover:text-purple-500 hover:transform hover:scale-125 flex items-center justify-center"
      id="clueButton"
      onClick={handleClueClick}
    >
      <FcIdea className="mb-2" />
    </button>
    </div>
    
  );
};

export default ClueButton;