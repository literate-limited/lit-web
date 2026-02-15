import { useMemo, useState } from "react";
import { FiArrowRight, FiFolder, FiFileText, FiLink2, FiRefreshCw } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const fetchJson = async (url, errorMessage) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errorMessage);
  return res.json();
};

const parseRepoUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("git@github.com:")) {
    const cleaned = trimmed.replace("git@github.com:", "").replace(/\.git$/, "");
    const [owner, repo] = cleaned.split("/");
    return owner && repo ? { owner, repo } : null;
  }
  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("github.com")) return null;
    const [owner, repo] = url.pathname.replace(/^\/+/, "").replace(/\.git$/, "").split("/");
    return owner && repo ? { owner, repo } : null;
  } catch {
    return null;
  }
};

const buildTree = (items) => {
  const root = { name: "root", path: "", type: "dir", children: [] };
  const cache = { "": root };
  items.forEach((item) => {
    const parts = item.path.split("/");
    let currentPath = "";
    let parent = root;
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!cache[currentPath]) {
        const node = {
          name: part,
          path: currentPath,
          type: index === parts.length - 1 ? item.type : "tree",
          children: [],
        };
        cache[currentPath] = node;
        parent.children.push(node);
      }
      parent = cache[currentPath];
    });
  });

  const sortNodes = (node) => {
    node.children.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "tree" ? -1 : 1;
    });
    node.children.forEach(sortNodes);
  };
  sortNodes(root);
  return root;
};

const buildTreeSummary = (items) => items.slice(0, 240).map((item) => item.path);

const truncateText = (text, limit = 20000) => {
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n...truncated`;
};

const TreeNode = ({ node, depth, openFolders, toggleFolder, onSelectFile, selectedPath }) => {
  const isFolder = node.type === "tree" || node.type === "dir";
  const isOpen = openFolders.has(node.path);
  const paddingLeft = `${depth * 14 + 12}px`;

  if (node.path === "") return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isFolder ? toggleFolder(node.path) : onSelectFile(node.path))}
        className={`w-full flex items-center gap-2 py-1.5 pr-3 text-left text-sm rounded-lg transition ${
          selectedPath === node.path
            ? "bg-orange-500/20 text-orange-100"
            : "hover:bg-slate-800/60 text-slate-200"
        }`}
        style={{ paddingLeft }}
      >
        {isFolder ? <FiFolder /> : <FiFileText />}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ChatBubble = ({ role, content }) => {
  const isUser = role === "user";
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-orange-500/90 text-white self-end"
          : "bg-slate-900/70 text-slate-100 self-start border border-slate-800/70"
      }`}
    >
      {content}
    </div>
  );
};

const CodeExplorerPage = () => {
  const [activeTab, setActiveTab] = useState("enter");
  const [repoInput, setRepoInput] = useState("");
  const [repoInfo, setRepoInfo] = useState(null);
  const [treeItems, setTreeItems] = useState([]);
  const [treeRoot, setTreeRoot] = useState(null);
  const [openFolders, setOpenFolders] = useState(new Set());
  const [selectedPath, setSelectedPath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState("");
  const [localHandles, setLocalHandles] = useState({});

  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Drop me a question about the repo or file." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [mode, setMode] = useState("document"); // "code" | "document"

  const tabList = useMemo(() => {
    const base = [{ id: "enter", label: "Enter URL / Open local" }];
    if (repoInfo) base.push({ id: "explore", label: "Explore" });
    return base;
  }, [repoInfo]);

  const treeSummary = useMemo(() => buildTreeSummary(treeItems), [treeItems]);

  const resetWorkspace = () => {
    setRepoInput("");
    setRepoInfo(null);
    setTreeItems([]);
    setTreeRoot(null);
    setOpenFolders(new Set());
    setSelectedPath("");
    setFileContent("");
    setError("");
    setActiveTab("enter");
    setLocalHandles({});
  };

  const handleLoadRepo = async (event) => {
    event?.preventDefault?.();
    setError("");
    const parsed = parseRepoUrl(repoInput);
    if (!parsed) {
      setError("Paste a valid GitHub repo URL.");
      return;
    }

    setLoadingTree(true);
    setSelectedPath("");
    setFileContent("");
    try {
      const repoData = await fetchJson(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
        "Unable to fetch repo metadata."
      );
      const defaultBranch = repoData.default_branch || "main";

      const treeData = await fetchJson(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${defaultBranch}?recursive=1`,
        "Unable to fetch repo tree."
      );
      const items = (treeData.tree || [])
        .filter((item) => item.type === "blob" || item.type === "tree")
        .map((item) => ({
          path: item.path,
          type: item.type === "tree" ? "tree" : "blob",
        }));

      const root = buildTree(items);
      setRepoInfo({ ...parsed, defaultBranch });
      setTreeItems(items);
      setTreeRoot(root);
      setOpenFolders(new Set(["src", "lib", "packages", "app"]));
      setActiveTab("explore");
    } catch (err) {
      setError(err.message || "Failed to load repo.");
    } finally {
      setLoadingTree(false);
    }
  };

  const walkLocalDirectory = async (dirHandle, prefix = "") => {
    const items = [];
    const handles = {};

    for await (const entry of dirHandle.values()) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === "file") {
        items.push({ path: relPath, type: "blob" });
        handles[relPath] = entry;
      } else if (entry.kind === "directory") {
        items.push({ path: relPath, type: "tree" });
        const child = await walkLocalDirectory(entry, relPath);
        items.push(...child.items);
        Object.assign(handles, child.handles);
      }
    }

    return { items, handles };
  };

  const handleOpenLocal = async () => {
    if (!window.showDirectoryPicker) {
      setError("Your browser does not support local directory access.");
      return;
    }
    setLoadingTree(true);
    setError("");
    try {
      const dirHandle = await window.showDirectoryPicker();
      const { items, handles } = await walkLocalDirectory(dirHandle);
      const root = buildTree(items);
      setRepoInfo({ type: "local", name: dirHandle.name });
      setLocalHandles(handles);
      setTreeItems(items);
      setTreeRoot(root);
      setOpenFolders(new Set(Object.keys(handles).map((p) => p.split("/")[0])));
      setActiveTab("explore");
    } catch (err) {
      setError(err?.message || "Failed to open local folder.");
    } finally {
      setLoadingTree(false);
    }
  };

  const fetchFileContent = async (path) => {
    if (!repoInfo) return;
    setLoadingFile(true);
    setError("");
    try {
      if (repoInfo.type === "local") {
        const handle = localHandles[path];
        if (!handle) throw new Error("File handle not found.");
        const file = await handle.getFile();
        const text = await file.text();
        setFileContent(text);
        setSelectedPath(path);
      } else {
        const data = await fetchJson(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${path}?ref=${repoInfo.defaultBranch}`,
          "Unable to fetch file."
        );
        if (data.encoding !== "base64" || !data.content) {
          throw new Error("File format unsupported.");
        }
        const decoded = atob(data.content.replace(/\n/g, ""));
        setFileContent(decoded);
        setSelectedPath(path);
      }
    } catch (err) {
      setError(err.message || "Failed to load file.");
    } finally {
      setLoadingFile(false);
    }
  };

  const toggleFolder = (path) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const sendChat = async (event) => {
    event?.preventDefault?.();
    if (!chatInput.trim()) return;
    if (!repoInfo) {
      setError("Load a repo before chatting.");
      return;
    }
    const nextMessages = [...chatMessages, { role: "user", content: chatInput.trim() }];
    setChatMessages(nextMessages);
    setChatInput("");
    setSendingChat(true);

    const token = localStorage.getItem("token");
    const context = {
      repo:
        repoInfo.type === "local"
          ? `local:${repoInfo.name || "workspace"}`
          : `${repoInfo.owner}/${repoInfo.repo}`,
      branch: repoInfo.type === "local" ? "local" : repoInfo.defaultBranch,
      filePath: selectedPath,
      fileContent: truncateText(fileContent),
      tree: treeSummary,
      mode,
    };

    try {
      const res = await fetch(`${API_URL}/code-monkey/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          messages: nextMessages.slice(-8),
          context,
        }),
      });
      if (!res.ok) throw new Error("AI response failed.");
      const data = await res.json();
      const reply = data.reply || "No response.";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.message || "Chat failed." },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="codemonkey-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Explorer</p>
          <h1 className="text-2xl font-semibold">Turn code or documents into a workspace</h1>
          <p className="text-sm text-slate-300/80">
            Load a GitHub URL or open local files, browse them, and talk with the AI about code,
            legal documents, or scientific papers.
          </p>
        </div>
        {repoInfo && (
          <div className="codemonkey-chip">
            <FiLink2 />
            {repoInfo.type === "local"
              ? `local:${repoInfo.name || "workspace"}`
              : `${repoInfo.owner}/${repoInfo.repo}`}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="uppercase tracking-[0.2em] text-slate-500">Mode</span>
          <div className="flex items-center gap-1 rounded-full border border-slate-700/60 p-1">
            {["document", "code"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mode === id
                    ? "bg-orange-500 text-slate-950"
                    : "text-slate-200 hover:bg-slate-800/70"
                }`}
              >
                {id === "document" ? "Docs" : "Code"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="codemonkey-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabList.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-orange-500 text-slate-950"
                  : "border border-slate-700/60 text-slate-200 hover:bg-slate-800/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetWorkspace}
          className="flex items-center gap-2 rounded-full border border-slate-700/60 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/70"
        >
          <FiRefreshCw />
          Reset
        </button>
      </div>

      {error && (
        <div className="codemonkey-card p-3 text-sm text-rose-200 border border-rose-500/40">
          {error}
        </div>
      )}

      {activeTab === "enter" && (
        <form onSubmit={handleLoadRepo} className="codemonkey-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiLink2 />
            Paste a GitHub repository URL (public only).
          </div>
          <input
            type="url"
            value={repoInput}
            onChange={(event) => setRepoInput(event.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loadingTree}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/30"
          >
            {loadingTree ? "Loading repo..." : "Enter workspace"}
            <FiArrowRight />
          </button>
          <div className="border-t border-slate-800/60 pt-4">
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <FiFolder />
              Or open a local folder (supported browsers only).
            </p>
            <button
              type="button"
              onClick={handleOpenLocal}
              disabled={loadingTree}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/70"
            >
              {loadingTree ? "Opening..." : "Open local folder"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "explore" && (
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_320px] gap-4">
          <div className="codemonkey-card p-4 max-h-[72vh] overflow-y-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-3">
              Directory
            </div>
            {treeRoot ? (
              <div className="space-y-1">
                {treeRoot.children.map((node) => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    openFolders={openFolders}
                    toggleFolder={toggleFolder}
                    onSelectFile={fetchFileContent}
                    selectedPath={selectedPath}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No repo loaded yet.</p>
            )}
          </div>

          <div className="codemonkey-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Document reader
                </p>
                <h2 className="text-lg font-semibold">
                  {selectedPath || "Select a file"}
                </h2>
              </div>
              {loadingFile && <span className="text-xs text-slate-400">Loading...</span>}
            </div>
            <div className="flex-1 rounded-xl border border-slate-800/70 bg-slate-950/80 p-4 overflow-auto">
              {fileContent ? (
                <pre className="codemonkey-mono text-xs text-slate-100 whitespace-pre-wrap">
                  {fileContent}
                </pre>
              ) : (
                <p className="text-sm text-slate-400">
                  Pick a file from the tree to read it here.
                </p>
              )}
            </div>
          </div>

          <div className="codemonkey-card p-4 flex flex-col gap-3 max-h-[72vh]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI chat</p>
              <h3 className="text-lg font-semibold">Ask Code Monkey</h3>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
              {chatMessages.map((msg, index) => (
                <ChatBubble key={`${msg.role}-${index}`} role={msg.role} content={msg.content} />
              ))}
            </div>
            <form onSubmit={sendChat} className="space-y-2">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                rows={3}
                placeholder="Ask about architecture, bugs, or file behavior..."
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingChat}
                className="w-full rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                {sendingChat ? "Thinking..." : "Send question"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeExplorerPage;
