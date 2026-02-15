const INVITE_TUTORIALS = {
  friend: [
    {
      id: "friend-hq",
      title: "HQ primer",
      summary: "Find your home base, quests, and messages in one place.",
      href: "/",
    },
    {
      id: "friend-chat",
      title: "Chats and overlays",
      summary: "Use the chat overlay and messages to stay connected.",
      href: "/message",
    },
    {
      id: "friend-docs",
      title: "Shared docs",
      summary: "Create, share, and co-edit documents.",
      href: "/docs",
    },
  ],
  multi: [
    {
      id: "multi-choose-role",
      title: "Choose your role",
      summary: "Pick the path that fits you: student, parent, or friend.",
      href: "/onboarding",
    },
    {
      id: "multi-tour",
      title: "Quick campus tour",
      summary: "See dashboards for each role before you dive in.",
      href: "/welcome",
    },
    {
      id: "multi-notifications",
      title: "Notifications & privacy",
      summary: "Learn how alerts and permissions differ by role.",
      href: "/privacy-policy",
    },
  ],
  student: [
    {
      id: "student-dashboard",
      title: "Student dashboard",
      summary: "Accept lessons, track progress, and message your teacher.",
      href: "/student-dashboard",
    },
    {
      id: "student-lessons",
      title: "Assignments + quests",
      summary: "Open lessons, see due dates, and submit work.",
      href: "/quest-log",
    },
    {
      id: "student-translate",
      title: "Translator + speaking lab",
      summary: "Practice pronunciation and translation with instant feedback.",
      href: "/speaking",
    },
  ],
  parent: [
    {
      id: "parent-onboarding",
      title: "Parent onboarding",
      summary: "Set up your contact, children, and notification preferences.",
      href: "/parent-onboarding",
    },
    {
      id: "parent-dashboard",
      title: "Parent dashboard",
      summary: "Monitor progress and manage approvals.",
      href: "/parent-dashboard",
    },
    {
      id: "parent-safety",
      title: "Safety + guardrails",
      summary: "See how we handle privacy, access, and reporting.",
      href: "/privacy-policy",
    },
  ],
  teacher: [
    {
      id: "teacher-dashboard",
      title: "Teacher dashboard",
      summary: "Create classes, invite students, and assign lessons.",
      href: "/teacher-dashboard",
    },
    {
      id: "teacher-lessons",
      title: "Lesson + quest builder",
      summary: "Draft lessons and quests with reusable templates.",
      href: "/quest-log",
    },
    {
      id: "teacher-forest",
      title: "Forest of Knowledge",
      summary: "Map topics and track mastery using the forest view.",
      href: "/forest",
    },
  ],
  default: [
    {
      id: "hq-start",
      title: "Start at HQ",
      summary: "Tour the main surfaces: HQ, Library, Docs, and Messages.",
      href: "/",
    },
    {
      id: "eagle-ffi",
      title: "Function Face Interface",
      summary: "Work with Edward to turn intent into functions and scaffolding.",
      href: "/eagle",
    },
    {
      id: "code-explorer",
      title: "Code Explorer",
      summary: "Browse, run, and learn from live code snippets.",
      href: "/code-monkey",
    },
  ],
};

const FALLBACK_ORDER = ["student", "parent", "teacher", "friend", "default"];

export function getTutorialsForInvites(invites = []) {
  const normalized = Array.isArray(invites)
    ? invites
        .map((v) => String(v || "").trim().toLowerCase())
        .filter(Boolean)
    : [];

  const seen = new Set();
  const result = [];

  const ordered =
    normalized.length > 1 ? ["multi", ...normalized] : normalized.length ? normalized : FALLBACK_ORDER;

  ordered.forEach((type) => {
    const list = INVITE_TUTORIALS[type] || [];
    list.forEach((item) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      result.push(item);
    });
  });

  // Always append defaults at the end
  INVITE_TUTORIALS.default.forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    result.push(item);
  });

  return result;
}

export { INVITE_TUTORIALS };
