import { useContext } from "react";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import Reader from "../../components/Reader";

const ReadingLevel = () => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <div
  className="min-h-screen p-4 flex justify-center items-center"
  style={{ backgroundColor: currentTheme.quizContainer, color: currentTheme.textColor }}
>
<div
  className="w-full max-w-5xl flex flex-col h-[90vh] rounded-lg shadow-md p-6"
  style={{ backgroundColor: currentTheme.headerBg }}
>
  <Reader />
</div>

</div>

  );
};

export default ReadingLevel;
