import React from "react";
import ClueButton from "../gameplay/components/ClueButton";
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import imageViewTranslations from "../translations/imageView";
import { useLessonGame } from "../hooks/useLesson";
import { useLessonUIFlags } from "../hooks/useLessonUI";

const ImageView = () => {
  const { t } = useTranslation(imageViewTranslations); // Use the translation hook
  const { currentImage } = useLessonGame();
  const { clueButton, isFullScreen } = useLessonUIFlags();


  // ✅ Add these logs right after destructuring context
  console.log("🖼️ ImageView loaded");
  console.log("currentImage from context:", currentImage);
  console.log("clueButton:", clueButton);
  console.log("isFullScreen:", isFullScreen);

  if (!currentImage) {
    return <div>{t("loading")}</div>; // Dynamic translation for loading message
  }

  return (
    <div className="flex flex-col items-center justify-center mt-4 mb-8">

      <div className={`relative p-2 sm:mt-40 xl:mt-20 ${isFullScreen ? 'lg:top-20 lg:max-w-[calc(100vw-1000px)] xxs:max-w-[calc(100vw-120px)] xxs:min-w-[150px] min-w-[300px] lg:min-w-[200px]' : 'max-w-[400px]'}`}>
        {clueButton && <ClueButton />}
        <img
          className={`rounded-lg ${isFullScreen ? 'w-128' : 'xxs:w-60 xs:w-80 lg:w-80'} h-auto`}
          src={currentImage.link}
          alt={t("altText")} // Dynamic translation for alt text
        />
      </div>
    </div>
  );
};

export default ImageView;
