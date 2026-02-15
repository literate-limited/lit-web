import { moduleRegistry } from "./moduleRegistry";

export default function ProfileModulesRenderer({
  modules,
  viewMode,
  profileUser,
  viewer,
  inviteToken,
  inviteAccess,
  onProfileUpdate,
}) {
  const list = Array.isArray(modules) ? modules : [];

  const sorted = [...list]
    .filter((m) => m && m.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="flex flex-col gap-8">
      {sorted.map((mod) => {
        const Comp = moduleRegistry[mod.type];
        if (!Comp) {
          return (
            <div
              key={mod.id}
              className="border rounded-xl p-4 bg-yellow-50 text-yellow-900"
            >
              Unknown module type: <b>{mod.type}</b>
            </div>
          );
        }
        return (
          <Comp
            key={mod.id}
            module={mod}
            viewMode={viewMode}
            profileUser={profileUser}
            viewer={viewer}
            inviteToken={inviteAccess ? inviteToken : null}
            inviteAccess={inviteAccess}
            onProfileUpdate={onProfileUpdate}
          />
        );
      })}
    </div>
  );
}
