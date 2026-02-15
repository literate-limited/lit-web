import { useContext, useEffect } from "react";
import { useTranslation } from "../../translator/hooks/useTranslation";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import gameplayTranslations from "../translations";
import { useLessonGame } from "../../hooks/useLesson";

const InfoLevel = () => {
  const { t } = useTranslation(gameplayTranslations);
  const { currentTheme } = useContext(ThemeContext);
  const { currentQuestion, handleCheckAnswer } = useLessonGame();

  useEffect(() => {
    console.log("🔍 InfoLevel Context:", currentQuestion);
  }, [currentQuestion]);

  if (!currentQuestion) {
    return <div>Error: No context found!</div>;
  }

  const handleContinue = () => {
    handleCheckAnswer(0); // Treats "Continue" as selecting answer 0
  };

  return (
    <div style={{backgroundColor: currentTheme.quizContainer, color: currentTheme.textColor}} className="flex flex-col items-center justify-start p-10 min-h-screen pt-30">
      <div style={{backgroundColor: currentTheme.headerBg}} className="shadow-md rounded-lg p-6 w-full sm:w-3/4 md:w-2/3 lg:w-3/5 xl:w-4/5 max-w-4xl">
        <div style={{backgroundColor: currentTheme.questionBox}} className="p-4 mb-4 rounded">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium mb-4 text-center">
            {currentQuestion}
          </h2>
        </div>
        <div className="flex justify-center items-center mt-4">
  <button
    style={{ backgroundColor: currentTheme.buttonColor }}
    className="py-2 px-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg text-white hover:bg-cyan-700"
    onClick={handleContinue}
  >
    {t("quiz.next")}
  </button>
</div>

      </div>
    </div>
  );
};

export default InfoLevel;
