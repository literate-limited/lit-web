import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Achievement definitions for milestones
const MILESTONE_ACHIEVEMENTS = [
  { id: "streak_7", name: "Week Warrior", description: "7 day streak", icon: "🔥", threshold: 7, field: "streak" },
  { id: "streak_30", name: "Monthly Master", description: "30 day streak", icon: "🔥", threshold: 30, field: "streak" },
  { id: "streak_100", name: "Centurion", description: "100 day streak", icon: "💯", threshold: 100, field: "streak" },
  { id: "lessons_10", name: "Getting Started", description: "Complete 10 lessons", icon: "📚", threshold: 10, field: "lessonsCompleted" },
  { id: "lessons_50", name: "Dedicated Learner", description: "Complete 50 lessons", icon: "📖", threshold: 50, field: "lessonsCompleted" },
  { id: "lessons_100", name: "Century Scholar", description: "Complete 100 lessons", icon: "🎓", threshold: 100, field: "lessonsCompleted" },
  { id: "levels_5", name: "Level Up", description: "Complete 5 levels", icon: "⬆️", threshold: 5, field: "levelsCompleted" },
  { id: "levels_20", name: "High Achiever", description: "Complete 20 levels", icon: "🏔️", threshold: 20, field: "levelsCompleted" },
  { id: "lit_1000", name: "Lit Collector", description: "Earn 1,000 Lit", icon: "✨", threshold: 1000, field: "lit" },
  { id: "lit_10000", name: "Lit Master", description: "Earn 10,000 Lit", icon: "💎", threshold: 10000, field: "lit" },
];

function AchievementCard({ achievement, earned, progress }) {
  const progressPercent = Math.min(100, Math.round((progress / achievement.threshold) * 100));

  return (
    <div
      className={`relative p-4 rounded-xl border transition ${
        earned
          ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-sm"
          : "bg-slate-50 border-slate-200 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl ${earned ? "" : "grayscale"}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800">{achievement.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">{achievement.description}</div>

          {!earned && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {progress} / {achievement.threshold}
              </div>
            </div>
          )}
        </div>

        {earned && (
          <div className="absolute top-2 right-2 text-amber-500 text-lg">✓</div>
        )}
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm">
      {badge.imageURL ? (
        <img
          src={badge.imageURL}
          alt={badge.name}
          className="w-16 h-16 object-contain"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
          🏅
        </div>
      )}
      <div className="mt-2 text-sm font-semibold text-slate-800 text-center">{badge.name}</div>
      {badge.description && (
        <div className="text-xs text-slate-500 text-center mt-0.5">{badge.description}</div>
      )}
    </div>
  );
}

export default function AchievementsModule({
  module,
  viewMode,
  profileUser,
  viewer,
}) {
  const isSelf = viewMode === "self";
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("milestones");

  useEffect(() => {
    const loadBadges = async () => {
      setLoading(true);
      try {
        // If badges are already populated objects, use them
        if (Array.isArray(profileUser?.badges) && profileUser.badges.length > 0) {
          if (typeof profileUser.badges[0] === "object") {
            setBadges(profileUser.badges);
          } else {
            // Badges are just IDs, need to fetch
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.get(`${API_URL}/badges`, { headers });
            const userBadgeIds = profileUser.badges.map(String);
            const userBadges = (data.badges || []).filter((b) =>
              userBadgeIds.includes(String(b._id))
            );
            setBadges(userBadges);
          }
        }
      } catch (err) {
        console.error("Failed to load badges:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [profileUser?.badges]);

  // Calculate milestone achievements
  const milestoneStatus = MILESTONE_ACHIEVEMENTS.map((achievement) => {
    const currentValue = profileUser?.[achievement.field] ?? 0;
    const earned = currentValue >= achievement.threshold;
    return { achievement, earned, progress: currentValue };
  });

  const earnedCount = milestoneStatus.filter((m) => m.earned).length;
  const totalMilestones = MILESTONE_ACHIEVEMENTS.length;

  const tabs = [
    { id: "milestones", label: "Milestones", count: earnedCount },
    { id: "badges", label: "Badges", count: badges.length },
  ];

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">Achievements</div>
        <div className="text-sm text-slate-500">
          {earnedCount + badges.length} earned
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-600">{profileUser?.lit ?? 0}</div>
          <div className="text-xs text-slate-500">Lit Points</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">{profileUser?.streak ?? 0}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{profileUser?.lessonsCompleted ?? 0}</div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{profileUser?.levelsCompleted ?? 0}</div>
          <div className="text-xs text-slate-500">Levels</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs text-slate-400">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Milestones Tab */}
      {activeTab === "milestones" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestoneStatus
            .sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))
            .map(({ achievement, earned, progress }) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                earned={earned}
                progress={progress}
              />
            ))}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <>
          {loading ? (
            <div className="text-sm text-slate-500 py-4 text-center">Loading badges...</div>
          ) : badges.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              {isSelf ? "You haven't earned any badges yet. Keep learning!" : "No badges earned yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <BadgeCard key={badge._id} badge={badge} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
