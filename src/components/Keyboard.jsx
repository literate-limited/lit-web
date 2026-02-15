import React, { useContext, useEffect, useRef, useState } from "react";
import enKeyboardWithSound from "../utils/en.keyboardSounds.utils";
import qwertyKeyboard from "../utils/qwertyEnglish.utils";
import { RiDeleteBack2Fill } from "react-icons/ri";
import { LuSpace } from "react-icons/lu";
import { AiOutlineEnter } from "react-icons/ai";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import useMediaQuery from "../hooks/useMediaQuery";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useLessonGame } from "../hooks/useLesson";
import { useLessonPreferences } from "../hooks/useLessonUI";

const KEYBOARD_OPTIONS = {
  en: enKeyboardWithSound,
  qwerty: qwertyKeyboard,
};

const Keyboard = () => {
  const { handleButtonClick } = useLessonGame();
  const { keyboardSettings: settings } = useLessonPreferences();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { currentTheme } = useContext(ThemeContext);

  const [keyboardType, setKeyboardType] = useState(
    localStorage.getItem("keyboardType") || "en"
  );
  const [isShifted, setIsShifted] = useState(false);

  const currentKeyboard = React.useMemo(() => {
    return KEYBOARD_OPTIONS[keyboardType] || enKeyboardWithSound;
  }, [keyboardType]);

  // persist keyboard choice
  useEffect(() => {
    localStorage.setItem("keyboardType", keyboardType);
  }, [keyboardType]);

  // detect physical Shift key
  useEffect(() => {
    const downHandler = (e) => {
      if (e.key === "Shift") setIsShifted(true);
    };
    const upHandler = (e) => {
      if (e.key === "Shift") setIsShifted(false);
    };
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

  const baseKeyClass =
    "key h-12 text-xl rounded-md shadow-sm select-none cursor-pointer flex justify-center items-center bg-[#f9e3d2] hover:scale-105 transition-transform duration-200 ease-in-out sm:w-12";

  const getKeySizeClass = (eyeDee) => {
    switch (eyeDee) {
      case "space":
        return "w-44 md:w-64";
      case "submitDesktop":
        return "w-12 md:w-20";
      case "deleteDesktop":
        return "w-12 md:w-24";
      case "submitMobile":
        return "w-8";
      case "shift":
        return "w-16";
      case "deleteMobile":
        return "w-12";
      default:
        return "w-8 md:w-12";
    }
  };

  const hoverTimeoutRef = useRef(null);
  const audioRef = useRef(null);

  const handleMouseOver = (key) => {
    if (!settings.hoverSoundEnabled) return;

    const keyData = currentKeyboard
      .flatMap((row) => Object.entries(row))
      .find(([k, data]) => k === key && data.audio instanceof Audio);

    if (keyData && keyData[1].audio) {
      const audio = keyData[1].audio;
      audioRef.current = audio;
      audio.currentTime = 0;

      hoverTimeoutRef.current = setTimeout(() => {
        audio.play().catch(() => {});
        if (settings.loopCount > 1) {
          let loopCounter = 0;
          const handleAudioEnd = () => {
            loopCounter++;
            if (loopCounter >= settings.loopCount) {
              audio.pause();
              audio.currentTime = 0;
              audio.removeEventListener("ended", handleAudioEnd);
            } else {
              audio.play().catch(() => {});
            }
          };
          audio.addEventListener("ended", handleAudioEnd);
        }
      }, settings.hoverSoundDelay);
    }
  };

  const handleMouseOut = () => {
    clearTimeout(hoverTimeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  return (
    <div
      id="keyboard"
      className="flex flex-col items-center py-2 mt-2 w-full"
      style={{ backgroundColor: currentTheme.headerBg }}
    >
      {currentKeyboard.map((row, rowIndex) => (
        <div
          className="row flex flex-wrap gap-1 md:gap-2 items-center justify-center mb-1 w-full"
          key={rowIndex}
        >
          {Object.keys(row).map((key, keyIndex) => {
            const keyData = row[key];

            if (keyData.desktopOnly && !isDesktop) return null;
            if (keyData.mobileOnly && isDesktop) return null;

            const keySizeClass = getKeySizeClass(keyData.eyeDee);

            const displayValue =
              isShifted && keyData.shiftValue
                ? keyData.shiftValue
                : keyData.keyAssociated || key;

            const handleClick = () => {
              if (key === "Shift") return; // don't insert "Shift"
              handleButtonClick(displayValue);
              if (isShifted) setIsShifted(false); // auto-release
            };

            return (
              <button
                style={{
                  color: currentTheme.textColor,
                  backgroundColor: currentTheme.keyboardKey,
                }}
                key={keyIndex}
                className={`${baseKeyClass} ${keySizeClass} ${
                  keyData.className || ""
                }`}
                id={keyData.eyeDee || ""}
                onClick={handleClick}
                onMouseOver={() => handleMouseOver(key)}
                onMouseOut={handleMouseOut}
                onMouseDown={() => {
                  if (key === "Shift") setIsShifted(true);
                }}
                onMouseUp={() => {
                  if (key === "Shift") setIsShifted(false);
                }}
              >
                {key === "Delete" ? (
                  <RiDeleteBack2Fill />
                ) : key === "Space" ? (
                  <LuSpace />
                ) : key === "em" ? (
                  <MdOutlineEmojiEmotions />
                ) : key === "Submit" ? (
                  <AiOutlineEnter />
                ) : key === "Shift" ? (
                  <span className="font-bold">Shift</span>
                ) : (
                  <span className="absolute font-semibold">{displayValue}</span>
                )}
                <span className="keyAssociated hidden sm:inline text-[0.6em] relative top-[1.1em] left-[0.7em]">
                  {keyData?.keyAssociated}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
