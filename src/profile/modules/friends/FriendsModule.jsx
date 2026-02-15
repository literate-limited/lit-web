import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return "?";
}

function FriendAvatar({ friend }) {
  const bgColor = (() => {
    const s = String(friend?.handle || friend?.name || "x");
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return `#${(hash & 0xffffff).toString(16).padStart(6, "0")}`;
  })();

  return (
    <Link
      to={`/profile/${friend.handle}`}
      className="group flex flex-col items-center gap-1 w-20"
      title={friend.name}
    >
      <div
        className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition flex items-center justify-center text-white font-bold text-lg"
        style={{ backgroundColor: bgColor }}
      >
        {friend.profilePicture ? (
          <img
            src={friend.profilePicture}
            alt={friend.name}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(friend.name)
        )}
      </div>
      <span className="text-xs text-slate-700 truncate max-w-full text-center group-hover:text-cyan-600">
        {friend.name?.split(" ")[0] || friend.handle}
      </span>
    </Link>
  );
}

export default function FriendsModule({
  module,
  viewMode,
  profileUser,
  viewer,
}) {
  const isSelf = viewMode === "self";
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("friends");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // For self, use authenticated endpoints
        if (isSelf) {
          const token = localStorage.getItem("token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const [friendsRes, followersRes, followingRes] = await Promise.all([
            axios.get(`${API_URL}/friends`, { headers }),
            axios.get(`${API_URL}/followers`, { headers }),
            axios.get(`${API_URL}/following`, { headers }),
          ]);

          setFriends(friendsRes.data?.friends || []);
          setFollowers(followersRes.data?.followers || []);
          setFollowing(followingRes.data?.following || []);
        } else {
          // For other profiles, use profile data (already populated)
          setFriends(Array.isArray(profileUser?.friends) ? profileUser.friends : []);
          setFollowers(Array.isArray(profileUser?.followers) ? profileUser.followers : []);
          setFollowing(Array.isArray(profileUser?.following) ? profileUser.following : []);
        }
      } catch (err) {
        console.error("Failed to load friends:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isSelf, profileUser]);

  const tabs = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "followers", label: "Followers", count: followers.length },
    { id: "following", label: "Following", count: following.length },
  ];

  const currentList = activeTab === "friends" ? friends : activeTab === "followers" ? followers : following;
  const displayList = expanded ? currentList : currentList.slice(0, 8);
  const hasMore = currentList.length > 8;

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">Connections</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setExpanded(false);
            }}
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

      {loading ? (
        <div className="text-sm text-slate-500 py-4 text-center">Loading...</div>
      ) : currentList.length === 0 ? (
        <div className="text-sm text-slate-500 py-4 text-center">
          {activeTab === "friends" && "No friends yet"}
          {activeTab === "followers" && "No followers yet"}
          {activeTab === "following" && "Not following anyone yet"}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 justify-start">
            {displayList.map((person) => (
              <FriendAvatar key={person._id || person.handle} friend={person} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                {expanded ? "Show less" : `View all ${currentList.length}`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Friend Requests (self only) */}
      {isSelf && Array.isArray(profileUser?.friendRequests) && profileUser.friendRequests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Pending Friend Requests ({profileUser.friendRequests.length})
          </div>
          <div className="space-y-2">
            {profileUser.friendRequests.map((req) => (
              <div
                key={req.from?._id || req.from}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50"
              >
                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {req.from?.profilePicture ? (
                    <img src={req.from.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(req.from?.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{req.from?.name || "Unknown"}</div>
                  <div className="text-xs text-slate-500">@{req.from?.handle || "user"}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      await axios.post(
                        `${API_URL}/friend-request/accept`,
                        { fromUserId: req.from?._id || req.from },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      // Refresh friends list
                      window.location.reload();
                    } catch (err) {
                      console.error("Accept failed:", err);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
