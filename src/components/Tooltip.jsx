import { useState, useRef, useEffect } from "react";

const Tooltip = ({ text, children, position = "bottom" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200); // 0.2 second delay
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-cyan-300 backdrop-blur-sm text-slate-950 text-xs font-bold whitespace-nowrap shadow-2xl pointer-events-none animate-in fade-in duration-100`}
        >
          {text}
          {/* Arrow */}
          <div
            className={`absolute ${
              position === "bottom"
                ? "-top-1.5 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-cyan-500"
                : position === "top"
                ? "-bottom-1.5 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-cyan-500"
                : ""
            }`}
            style={{
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
