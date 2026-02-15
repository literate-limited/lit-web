import { useContext } from "react";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import { useLessonGame } from "../../hooks/useLesson";

const DisplayText = () => {
  const { currentLevel } = useLessonGame();
  const { currentTheme } = useContext(ThemeContext);


console.log("This is the DisplayText component. currentLevel: ", currentLevel);

if (!currentLevel || !currentLevel.texts || currentLevel.texts.length === 0) {
  return null;
}


return (
  <div
    className="my-6 p-4 rounded-lg shadow-md text-center max-w-2xl mx-auto"
    style={{
      backgroundColor: currentTheme.placeholderBg,
      color: currentTheme.textColor,
    }}
  >
    <p className="text-lg font-medium">{currentLevel.texts[0]}</p>
  </div>
);
};

export default DisplayText;
