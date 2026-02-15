import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const styles =
    status === "approved"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`px-3 py-1 text-xs rounded-full border ${styles}`}>
      {status === "approved" ? "Approved" : "Rejected"}
    </span>
  );
};

const ProposalActions = ({ status, onApprove, onReject }) => (
  <div className="flex items-center gap-3">
    <StatusBadge status={status} />
    <button
      type="button"
      onClick={onApprove}
      className="px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 text-sm"
    >
      Approve
    </button>
    <button
      type="button"
      onClick={onReject}
      className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm"
    >
      Reject
    </button>
  </div>
);

export default function AdminAgents() {
  const [trees, setTrees] = useState([]);
  const [treeKey, setTreeKey] = useState("");
  const [rootNodes, setRootNodes] = useState([]);
  const [rootNodeKey, setRootNodeKey] = useState("");

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  const [structureProposal, setStructureProposal] = useState(null);
  const [populateProposal, setPopulateProposal] = useState(null);
  const [structureStatus, setStructureStatus] = useState(null);
  const [populateStatus, setPopulateStatus] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [populateLoading, setPopulateLoading] = useState(false);
  const [structureError, setStructureError] = useState("");
  const [populateError, setPopulateError] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }),
    [token]
  );

  useEffect(() => {
    fetchTrees();
    fetchModels();
  }, []);

  useEffect(() => {
    if (!treeKey) return;
    fetchRootNodes(treeKey);
  }, [treeKey]);

  const fetchTrees = async () => {
    try {
      const res = await axios.get(`${API_URL}/knowledge-trees`);
      const list = res.data?.trees || [];
      setTrees(list);
      if (list.length && !treeKey) {
        setTreeKey(list[0].treeKey);
      }
    } catch (err) {
      console.error("Failed to load knowledge trees:", err);
    }
  };

  const fetchRootNodes = async (selectedTreeKey) => {
    try {
      const forestRes = await axios.get(
        `${API_URL}/knowledge-trees/${selectedTreeKey}/forest`,
        { headers: authHeaders }
      );
      let nodes = forestRes.data?.forestRoots || [];

      if (!nodes.length) {
        const rootRes = await axios.get(
          `${API_URL}/knowledge-trees/${selectedTreeKey}/roots`,
          { headers: authHeaders }
        );
        nodes = rootRes.data?.nodes || [];
      }

      const normalized = nodes.map((node) => ({
        nodeKey: node.nodeKey || node.id,
        label: node.label || node.name || node.nodeKey || node.id,
      })).filter((node) => node.nodeKey);

      setRootNodes(normalized);
      if (normalized.length && !normalized.some((n) => n.nodeKey === rootNodeKey)) {
        setRootNodeKey(normalized[0].nodeKey);
      }
    } catch (err) {
      console.error("Failed to load root nodes:", err);
      setRootNodes([]);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await axios.get(`${API_URL}/lessons/models`, {
        headers: authHeaders,
      });
      const list = res.data?.models || [];
      setModels(list);
      if (list.length && !list.includes(selectedModel)) {
        setSelectedModel(list[0]);
      }
    } catch (err) {
      console.error("Failed to load AI models:", err);
    }
  };

  const runStructureAgent = async () => {
    if (!treeKey || !rootNodeKey) {
      setStructureError("Please select a tree and a root node.");
      return;
    }
    setStructureLoading(true);
    setStructureError("");
    setStructureProposal(null);
    setStructureStatus(null);

    try {
      const res = await axios.post(
        `${API_URL}/admin/agents/tree-structure`,
        { treeKey, rootNodeKey, model: selectedModel },
        { headers: authHeaders }
      );
      setStructureProposal(res.data?.proposal || null);
    } catch (err) {
      setStructureError(err.response?.data?.message || err.message);
    } finally {
      setStructureLoading(false);
    }
  };

  const runPopulateAgent = async () => {
    if (!treeKey || !rootNodeKey) {
      setPopulateError("Please select a tree and a root node.");
      return;
    }
    setPopulateLoading(true);
    setPopulateError("");
    setPopulateProposal(null);
    setPopulateStatus(null);

    try {
      const res = await axios.post(
        `${API_URL}/admin/agents/populate-tree`,
        { treeKey, rootNodeKey, model: selectedModel },
        { headers: authHeaders }
      );
      setPopulateProposal(res.data?.proposal || null);
    } catch (err) {
      setPopulateError(err.response?.data?.message || err.message);
    } finally {
      setPopulateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Agents</h1>
        <p className="text-sm text-gray-600">
          Run focused AI agents to suggest improvements or content gaps in the knowledge tree.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Knowledge Tree
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={treeKey}
              onChange={(e) => setTreeKey(e.target.value)}
            >
              {trees.length === 0 && <option>Loading...</option>}
              {trees.map((tree) => (
                <option key={tree.treeKey} value={tree.treeKey}>
                  {tree.treeKey}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Root Node / App
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={rootNodeKey}
              onChange={(e) => setRootNodeKey(e.target.value)}
            >
              {rootNodes.length === 0 && <option>No roots found</option>}
              {rootNodes.map((node) => (
                <option key={node.nodeKey} value={node.nodeKey}>
                  {node.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              AI Model
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.length === 0 && <option>Loading...</option>}
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Suggest Tree Structure Improvement</h2>
              <p className="text-sm text-gray-600">
                Generate one structural improvement for the selected app tree.
              </p>
            </div>
            <button
              type="button"
              onClick={runStructureAgent}
              disabled={structureLoading}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {structureLoading ? "Running..." : "Run Agent"}
            </button>
          </div>

          {structureError && (
            <div className="text-sm text-red-600">{structureError}</div>
          )}

          {structureProposal ? (
            <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {structureProposal.summary || "Proposed Improvement"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {structureProposal.rationale || "No rationale provided."}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  Confidence: {structureProposal.confidence ?? "?"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Action Type</div>
                  <div>{structureProposal.action?.type || "n/a"}</div>
                </div>
                <div>
                  <div className="font-semibold">Target Node</div>
                  <div>
                    {structureProposal.action?.targetNodeLabel || "n/a"}{" "}
                    {structureProposal.action?.targetNodeKey
                      ? `(${structureProposal.action.targetNodeKey})`
                      : ""}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Parent Node</div>
                  <div>{structureProposal.action?.parentNodeKey || "n/a"}</div>
                </div>
                <div>
                  <div className="font-semibold">Notes</div>
                  <div>{structureProposal.action?.notes || "n/a"}</div>
                </div>
              </div>

              {Array.isArray(structureProposal.action?.newNodes) &&
                structureProposal.action.newNodes.length > 0 && (
                  <div>
                    <div className="font-semibold text-sm mb-2">New Nodes</div>
                    <div className="space-y-2">
                      {structureProposal.action.newNodes.map((node, index) => (
                        <div
                          key={`${node.label}-${index}`}
                          className="border rounded-lg p-3 bg-white text-sm"
                        >
                          <div className="font-semibold">{node.label || "Untitled"}</div>
                          <div className="text-gray-600">{node.description || "n/a"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <ProposalActions
                status={structureStatus}
                onApprove={() => setStructureStatus("approved")}
                onReject={() => setStructureStatus("rejected")}
              />

              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer">View JSON</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(structureProposal, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No suggestion generated yet.
            </div>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Populate Tree</h2>
              <p className="text-sm text-gray-600">
                Suggest lessons or units to fill a content gap.
              </p>
            </div>
            <button
              type="button"
              onClick={runPopulateAgent}
              disabled={populateLoading}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {populateLoading ? "Running..." : "Run Agent"}
            </button>
          </div>

          {populateError && (
            <div className="text-sm text-red-600">{populateError}</div>
          )}

          {populateProposal ? (
            <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {populateProposal.targetNode?.label || "Target Node"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {populateProposal.reason || "No reason provided."}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  Confidence: {populateProposal.confidence ?? "?"}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                Node Key: {populateProposal.targetNode?.nodeKey || "n/a"}
              </div>

              {Array.isArray(populateProposal.proposal?.units) &&
                populateProposal.proposal.units.length > 0 && (
                  <div>
                    <div className="font-semibold text-sm mb-2">Unit Suggestions</div>
                    <div className="space-y-2">
                      {populateProposal.proposal.units.map((unit, index) => (
                        <div
                          key={`${unit.title}-${index}`}
                          className="border rounded-lg p-3 bg-white text-sm"
                        >
                          <div className="font-semibold">{unit.title || "Untitled Unit"}</div>
                          <div className="text-gray-600">{unit.description || "n/a"}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Lessons: {unit.lessonCount ?? "n/a"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(populateProposal.proposal?.lessons) &&
                populateProposal.proposal.lessons.length > 0 && (
                  <div>
                    <div className="font-semibold text-sm mb-2">Lesson Suggestions</div>
                    <div className="space-y-2">
                      {populateProposal.proposal.lessons.map((lesson, index) => (
                        <div
                          key={`${lesson.title}-${index}`}
                          className="border rounded-lg p-3 bg-white text-sm"
                        >
                          <div className="font-semibold">{lesson.title || "Untitled Lesson"}</div>
                          <div className="text-gray-600">{lesson.description || "n/a"}</div>
                          {Array.isArray(lesson.levelTypes) && lesson.levelTypes.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Level types: {lesson.levelTypes.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <ProposalActions
                status={populateStatus}
                onApprove={() => setPopulateStatus("approved")}
                onReject={() => setPopulateStatus("rejected")}
              />

              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer">View JSON</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(populateProposal, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No suggestion generated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
