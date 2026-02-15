import { useContext } from "react";
import { ThemeContext } from "../../utils/themes/ThemeContext";

export default function StatsModule({ module, profileUser }) {
  const { currentTheme } = useContext(ThemeContext);

  const themeInner = currentTheme?.innerContainerColor || "#ffffff";
  const themeText = currentTheme?.textColor || "#0f172a";
  const themeAccent = currentTheme?.headingTextColor || "#06b6d4";

  const memberSince = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div
      style={{ backgroundColor: themeInner, borderColor: themeAccent }}
      className="w-full lg:w-64 border rounded-xl p-4 mx-auto lg:mx-0"
    >
      {/* Lit Points - Main stat */}
      <div className="text-center pb-3 border-b border-slate-200">
        <div style={{ color: themeText }} className="text-sm font-medium text-slate-600">
          Lit Points
        </div>
        <div style={{ color: themeAccent }} className="text-4xl font-bold mt-1">
          {profileUser?.lit ?? profileUser?.points ?? 0}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="text-center">
          <div className="text-2xl">🔥</div>
          <div className="text-lg font-bold" style={{ color: themeText }}>
            {profileUser?.streak ?? 0}
          </div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl">📚</div>
          <div className="text-lg font-bold" style={{ color: themeText }}>
            {profileUser?.lessonsCompleted ?? 0}
          </div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="text-center">
          <div className="text-2xl">🏆</div>
          <div className="text-lg font-bold" style={{ color: themeText }}>
            {profileUser?.levelsCompleted ?? 0}
          </div>
          <div className="text-xs text-slate-500">Levels</div>
        </div>
        <div className="text-center">
          <div className="text-2xl">🎖</div>
          <div className="text-lg font-bold" style={{ color: themeText }}>
            {Array.isArray(profileUser?.badges) ? profileUser.badges.length : 0}
          </div>
          <div className="text-xs text-slate-500">Badges</div>
        </div>
      </div>

      {/* Member Since */}
      {memberSince && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-center">
          <div className="text-xs text-slate-500">Member since {memberSince}</div>
        </div>
      )}
    </div>
  );
}
