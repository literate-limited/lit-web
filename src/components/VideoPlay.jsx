import React, { useContext } from "react";
import ClueButton from "../gameplay/components/ClueButton";
import { useTranslation } from "../translator/hooks/useTranslation";
import videoPlayTranslations from "./videoPlayTranslations";
import { useLessonGame } from "../hooks/useLesson";
import { useLessonUIFlags, useLessonPreferences } from "../hooks/useLessonUI";


const VideoPlay = () => {
  const { currentVideo } = useLessonGame();
  const { clueButton, isFullScreen } = useLessonUIFlags();
  const { videoAutoPlay } = useLessonPreferences();
  const { t } = useTranslation(videoPlayTranslations);


  if (!currentVideo) {
    return <div>{t("videoPlay.loading")}</div>;
  }

  console.log("current video: ", currentVideo);

  return (
    <div className="relative top-0 bottom-0 xxs:top-28 xs:top-0 md:mb-24 md:top-0 lg:bottom-0 xl:bottom-0 2xl:top-10 flex m-auto items-center h-[500px] sm:h-[280px] justify-center">
      <div className={`relative p-2 sm:mt-40 xl:mt-20 ${isFullScreen ? 'lg:bottom-16 lg:max-w-[calc(100vw-1000px)] xxs:max-w-[calc(100vw-120px)] xxs:min-w-[150px] min-w-[300px] lg:min-w-[200px]  ' : 'max-w-[400px]'}`}>
        {clueButton && <ClueButton />}
        <video
          className={`rounded-lg ${isFullScreen ? 'w-128' : 'xxs:w-60 xs:w-80 lg:w-80'} h-auto`} // Use custom width for fullscreen
          playsInline
          controls
          autoPlay={videoAutoPlay} // Set autoplay based on the prop
          onError={(e) => console.error("Error loading video:", e)}
        >
          <source src={currentVideo.link} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default VideoPlay;
