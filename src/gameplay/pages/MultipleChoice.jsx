import { useState, useContext } from "react";
import { useTranslation } from "../../translator/hooks/useTranslation"; // Import the translation hook
import { ThemeContext } from "../../utils/themes/ThemeContext";
import gameplayTranslations from "../translations";
import { useLessonGame } from "../../hooks/useLesson";

const Quiz = () => {
  // starts by pulling the translation hook and context from LevelContext. I wonder
  // why it's pulling
  const { t } = useTranslation(gameplayTranslations);

  const {
    currentQuestion,
    currentOptions,
    handleCheckAnswer,
    level,
  } = useLessonGame();

  console.log("Current question (printed from MCQ page: ", currentQuestion);
  console.log("Current options ", currentOptions);

  const { currentTheme } = useContext(ThemeContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFullQuestion, setShowFullQuestion] = useState(false);

  const handleOptionClick = (option, index) => {
    console.log("Option Clicked:", option);
    console.log("Index Clicked:", index);
    setSelectedOption({ text: option, index }); // ✅ Just use `option` directly
  };
  

  const handleNextQuestion = () => {
    if (selectedOption) {
      console.log("Submitting Answer Index:", selectedOption.index); // Pass the index
      console.log(selectedOption.text);
      
      handleCheckAnswer(selectedOption.index); // Pass the actual index text to LevelContextProvider
      
      setSelectedOption(null);
      setShowFullQuestion(false);
    }
  };

  const getTruncatedQuestion = (question) => {
    if (!question || question.length <= 300) return question;
    return `${question.substring(0, 300)}...`;
  };

  return (
    <div style={{backgroundColor: currentTheme.quizContainer, color:currentTheme.textColor}} className="flex flex-col items-center justify-start min-h-screen pt-30 p-4">
      <div style={{backgroundColor: currentTheme.headerBg}} className=" shadow-md rounded-lg p-6 w-full sm:w-3/4 md:w-2/3 lg:w-3/5 xl:w-4/5 max-w-4xl">
        {currentQuestion && (
          <div style={{backgroundColor: currentTheme.questionBox}} className=" p-4 mb-4 rounded">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium mb-4 text-center">
              {showFullQuestion
                ? currentQuestion
                : getTruncatedQuestion(currentQuestion)}
            </h2>
            {currentQuestion.length > 300 && !showFullQuestion && (
              <button
                onClick={() => setShowFullQuestion(true)}
                className="text-cyan-500 underline text-sm sm:text-base"
              >
                {t("quiz.readMore")} {/* Dynamic translation for "Read More" */}
              </button>
            )}
          </div>
        )}
<ul className="space-y-2">
  {currentOptions &&
    currentOptions.map((option, index) => (
      <li
        key={index}
        style={selectedOption?.index === index ? 
          {backgroundColor: currentTheme.selectedOptionButton} :
          {backgroundColor: currentTheme.unSelectedOptionButton}
        }
        className="p-2 sm:p-3 md:p-4 border rounded cursor-pointer text-sm sm:text-base md:text-lg lg:text-xl"
        onClick={() => handleOptionClick(option, index)}
      >
        {typeof option === "string" ? option : option.text} {/* ✅ Ensure rendering text */}
      </li>
    ))}
</ul>

        <div className="flex justify-end items-center mt-4">
          <button
          style={selectedOption?{backgroundColor: currentTheme.buttonColor}:{backgroundColor: currentTheme.disabledButtonColor}}
            className={`py-2 px-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg ${
              selectedOption
                ? "bg-cyan-500 text-white hover:bg-cyan-700"
                : "bg-cyan-500 text-white opacity-50 cursor-not-allowed"
            }`}
            onClick={handleNextQuestion}
            disabled={!selectedOption}
          >
            {t("quiz.next")} {/* Dynamic translation for "Next" */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
