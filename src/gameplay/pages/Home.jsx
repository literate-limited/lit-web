import { useEffect } from "react";
import Keyboard from "../../components/Keyboard";
import PlayButton from "../../components/PlayButton";
import VideoPlay from "../../components/VideoPlay";
import CompletionModal from "../components/modals/CompletionModal";
import Quiz from "./MultipleChoice";
import InfoLevel from "./InfoLevel";
import SpeakingPage from "./SpeakingPage";
import VocalizingPage from "./VocalizingPage";
import GaussianLevel from "./GaussianElimination";
import ListeningPage from "./ListeningPage";
import WritingPage from "./WritingPage";
import FillInBlankPage from "./FillInBlankPage";
import ReadingLevel from "./ReadingPage";
import LevelContainer from "../components/LevelContainer";
import SlImitationPage from "./SlImitationPage";
import { useLessonGame } from "../../hooks/useLesson";
import { useLessonModals } from "../../hooks/useLessonUI";



const Home = () => {
  const {
    currentLevelType,
    currentLevel,
  } = useLessonGame();
  const {
    closeCompletionModal,
    isCompletionModalOpen,
    setIsFullScreen,
  } = useLessonModals();

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullScreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullScreenChange);
    };
  }, [setIsFullScreen]);

  return (
    <div className="mt-4">
      {/* Modals */}
      <CompletionModal isOpen={isCompletionModalOpen} onClose={closeCompletionModal} />
      {/* Correct/Incorrect modals removed in favor of inline feedback */}
      {/* 
        <div className="max-w-2xl mx-auto">
          <WelcomeBlock expanded={expanded} />
          <div className="flex justify-start px-2 mt-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 text-xs underline"
            >
              {expanded ? "Hide Introduction" : "Show More"}
            </button>
          </div>
        </div> */}

      {/* Level Content */}
      {currentLevel && (
        <div key={currentLevel._id}>
          {/* Reading level - no container (will have its own ReadingLevelPage later) */}
          {currentLevelType === "reading" && <ReadingLevel />}

          {/* All other level types wrapped in LevelContainer */}
          {currentLevelType !== "reading" && (
            <LevelContainer>
              {currentLevelType === "info" && <InfoLevel />}
              {currentLevelType === "mcq" && <Quiz />}
              {currentLevelType === "speaking" && <SpeakingPage />}
              {currentLevelType === "vocalizing" && <VocalizingPage />}
              {currentLevelType === "gaussianElimination" && <GaussianLevel />}
              {currentLevelType === "writing" && <WritingPage />}
              {currentLevelType === "fill-in-the-blank" && <FillInBlankPage />}
              {currentLevelType === "sl-imitation" && <SlImitationPage />}
              {currentLevelType === "video" && (
                <div className="flex flex-col items-center justify-between">
                  <VideoPlay />
                  <PlayButton />
                  <Keyboard />
                </div>
              )}
              {currentLevelType === "sound" && <ListeningPage />}
            </LevelContainer>
          )}
        </div>
      )}
    </div>
  );
};
export default Home;
