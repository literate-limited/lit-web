import { useMemo } from "react";

const mockAgents = [
  { name: "Danton", task: "Monitoring pipelines", status: "running" },
  { name: "Alex", task: "Deploy checks", status: "running" },
  { name: "Yogon", task: "UI polish", status: "idle" },
];

const CallStackPage = () => {
  const overview = useMemo(() => {
    const running = mockAgents.filter((a) => a.status === "running").length;
    return { running, total: mockAgents.length };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Call Stack</h1>
      <p className="text-slate-600 mb-4">
        Overview of active agents. Ensure at least one agent is always running.
      </p>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 mb-4">
        <p className="text-sm text-slate-700">
          Running agents: {overview.running} / {overview.total}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm divide-y">
        {mockAgents.map((agent) => (
          <div key={agent.name} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-semibold">{agent.name}</p>
              <p className="text-sm text-slate-600">{agent.task}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                agent.status === "running"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {agent.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallStackPage;
