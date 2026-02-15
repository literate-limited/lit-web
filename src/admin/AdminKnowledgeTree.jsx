import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import EditNodeModal from "./EditNodeModal";

const API_URL = import.meta.env.VITE_API_URL;
const TREE_KEY = "lit-tree"; // Single tree for all apps

export default function AdminKnowledgeTree() {
  const [rootNodes, setRootNodes] = useState([]);
  const [currentRootIndex, setCurrentRootIndex] = useState(0);
  const [treeData, setTreeData] = useState(null); // nested tree structure
  const [loading, setLoading] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // View state for pan/zoom
  const [view, setView] = useState({ tx: 0, ty: 0, scale: 1 });
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, stx: 0, sty: 0 });

  // Drag-and-drop state for reparenting nodes
  const [draggedNode, setDraggedNode] = useState(null);
  const [dropTargetNode, setDropTargetNode] = useState(null);
  const nodeDragRef = useRef({ dragging: false, startX: 0, startY: 0, nodeKey: null });

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }),
    [token]
  );

  const currentRoot = rootNodes[currentRootIndex] || null;

  // Fetch all root nodes
  useEffect(() => {
    fetchRootNodes();
  }, []);

  // Fetch tree when root changes
  useEffect(() => {
    if (currentRoot) {
      fetchTreeFromRoot(currentRoot.nodeKey);
    } else {
      setTreeData(null);
    }
  }, [currentRoot?.nodeKey]);

  const fetchRootNodes = async () => {
    try {
      const res = await axios.get(`${API_URL}/knowledge-trees/${TREE_KEY}/roots`, { headers });
      setRootNodes(res.data.nodes || []);
    } catch (err) {
      console.error("Failed to fetch roots:", err);
      setRootNodes([]);
    }
  };

  const fetchTreeFromRoot = async (rootKey) => {
    setLoading(true);
    try {
      // Build nested tree recursively
      const tree = await buildTree(rootKey);
      setTreeData(tree);
      // Reset view when tree changes
      setView({ tx: 0, ty: 0, scale: 1 });
    } catch (err) {
      console.error("Failed to fetch tree:", err);
      setTreeData(null);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = async (nodeKey, depth = 0) => {
    const [nodeRes, childrenRes] = await Promise.all([
      axios.get(`${API_URL}/knowledge-trees/${TREE_KEY}/nodes/${nodeKey}`, { headers }),
      axios.get(`${API_URL}/knowledge-trees/${TREE_KEY}/nodes/${nodeKey}/children`, { headers }),
    ]);

    const node = nodeRes.data.node;
    const childrenData = childrenRes.data.nodes || [];

    // Recursively build children (limit depth to prevent infinite loops)
    const children = depth < 10
      ? await Promise.all(childrenData.map((c) => buildTree(c.nodeKey, depth + 1)))
      : [];

    return { ...node, children };
  };

  const handleCreateRoot = async () => {
    try {
      await axios.post(
        `${API_URL}/knowledge-trees/${TREE_KEY}/nodes`,
        { name: "New App", parentKey: null },
        { headers }
      );
      await fetchRootNodes();
      setCurrentRootIndex(rootNodes.length); // Select newly created
    } catch (err) {
      console.error("Failed to create root:", err);
    }
  };

  const handlePrevRoot = () => {
    if (currentRootIndex > 0) {
      setCurrentRootIndex(currentRootIndex - 1);
    }
  };

  const handleNextRoot = () => {
    if (currentRootIndex < rootNodes.length - 1) {
      setCurrentRootIndex(currentRootIndex + 1);
    }
  };

  const handleNodeClick = (node) => {
    setEditingNode(node);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNode(null);
    fetchRootNodes();
    if (currentRoot) {
      fetchTreeFromRoot(currentRoot.nodeKey);
    }
  };

  // Reparent node (move node under a new parent)
  const handleReparentNode = async (nodeKey, newParentKey) => {
    if (nodeKey === newParentKey) return; // Can't parent to self

    try {
      await axios.put(
        `${API_URL}/knowledge-trees/${TREE_KEY}/nodes/${nodeKey}`,
        { parentKey: newParentKey },
        { headers }
      );
      // Refresh tree
      fetchRootNodes();
      if (currentRoot) {
        fetchTreeFromRoot(currentRoot.nodeKey);
      }
    } catch (err) {
      console.error("Failed to reparent node:", err);
    }
  };

  // Estimate text width (rough calculation)
  const getTextWidth = (text, fontSize = 14) => {
    if (!text) return 40;
    return Math.max(60, text.length * fontSize * 0.6 + 24);
  };

  // Layout calculation for tree visualization - RADIAL/CIRCULAR layout
  const layoutTree = useMemo(() => {
    if (!treeData) return { nodes: [], edges: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };

    const nodes = [];
    const edges = [];
    const RING_RADIUS_BASE = 120; // Base radius for first ring
    const RING_RADIUS_INCREMENT = 100; // Additional radius per depth level

    // Recursively count all descendants for spacing calculation
    const countDescendants = (node) => {
      if (!node.children || node.children.length === 0) return 1;
      return node.children.reduce((sum, child) => sum + countDescendants(child), 0);
    };

    // Position nodes in radial layout
    const positionNode = (node, x, y, depth, startAngle, endAngle) => {
      const nodeWidth = getTextWidth(node.name);
      nodes.push({ ...node, x, y, width: nodeWidth, depth });

      if (node.children && node.children.length > 0) {
        const radius = RING_RADIUS_BASE + (depth * RING_RADIUS_INCREMENT);
        const totalDescendants = node.children.reduce((sum, c) => sum + countDescendants(c), 0);

        let currentAngle = startAngle;
        const angleRange = endAngle - startAngle;

        node.children.forEach((child) => {
          const childWeight = countDescendants(child);
          const childAngleSpan = (childWeight / totalDescendants) * angleRange;
          const childAngle = currentAngle + childAngleSpan / 2;

          // Calculate child position on the circle
          const childX = x + radius * Math.cos(childAngle);
          const childY = y + radius * Math.sin(childAngle);

          edges.push({
            from: { x, y },
            to: { x: childX, y: childY },
            depth
          });

          // Recursively position child's children
          positionNode(
            child,
            childX,
            childY,
            depth + 1,
            currentAngle,
            currentAngle + childAngleSpan
          );

          currentAngle += childAngleSpan;
        });
      }
    };

    // Start with root at center, children spread in full circle (0 to 2π)
    positionNode(treeData, 0, 0, 0, 0, 2 * Math.PI);

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      const halfWidth = (n.width || 60) / 2 + 20;
      minX = Math.min(minX, n.x - halfWidth);
      maxX = Math.max(maxX, n.x + halfWidth);
      minY = Math.min(minY, n.y - 25);
      maxY = Math.max(maxY, n.y + 25);
    });

    return { nodes, edges, bounds: { minX, maxX, minY, maxY } };
  }, [treeData, getTextWidth]);

  // Fit view to content
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || layoutTree.nodes.length === 0) return;

    const fit = () => {
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 600;
      const pad = 60;

      const bw = Math.max(1, layoutTree.bounds.maxX - layoutTree.bounds.minX);
      const bh = Math.max(1, layoutTree.bounds.maxY - layoutTree.bounds.minY);

      const scale = Math.min(2, Math.min((w - pad * 2) / bw, (h - pad * 2) / bh));
      const cx = (layoutTree.bounds.minX + layoutTree.bounds.maxX) / 2;
      const cy = (layoutTree.bounds.minY + layoutTree.bounds.maxY) / 2;

      setView({
        tx: w / 2 - cx * scale,
        ty: h / 2 - cy * scale,
        scale: Math.max(0.3, scale),
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layoutTree]);

  // Pan handlers
  const onPointerDown = (e) => {
    if (e.target?.dataset?.node === "1") return;
    svgRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, stx: view.tx, sty: view.ty };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    setView((v) => ({
      ...v,
      tx: dragRef.current.stx + (e.clientX - dragRef.current.sx),
      ty: dragRef.current.sty + (e.clientY - dragRef.current.sy),
    }));
  };

  const onPointerUp = () => {
    dragRef.current.dragging = false;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setView((v) => {
      const zoom = Math.exp(-e.deltaY * 0.002);
      const nextScale = Math.max(0.2, Math.min(3, v.scale * zoom));
      const wx = (mx - v.tx) / v.scale;
      const wy = (my - v.ty) / v.scale;
      return { tx: mx - wx * nextScale, ty: my - wy * nextScale, scale: nextScale };
    });
  };

  // Node drag handlers for reparenting
  const onNodeDragStart = useCallback((e, node) => {
    e.stopPropagation();
    // Don't allow dragging root nodes
    if (node.parentKey === null) return;

    nodeDragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      nodeKey: node.nodeKey
    };
    setDraggedNode(node);
  }, []);

  const onNodeDragMove = useCallback((e) => {
    if (!nodeDragRef.current.dragging || !draggedNode) return;
    // Visual feedback is handled by hover states
  }, [draggedNode]);

  const onNodeDragEnd = useCallback((e) => {
    if (!nodeDragRef.current.dragging) return;

    if (draggedNode && dropTargetNode && draggedNode.nodeKey !== dropTargetNode.nodeKey) {
      // Check if dropping onto a descendant (not allowed)
      const isDescendant = (parent, childKey) => {
        if (!parent.children) return false;
        for (const child of parent.children) {
          if (child.nodeKey === childKey) return true;
          if (isDescendant(child, childKey)) return true;
        }
        return false;
      };

      if (!isDescendant(draggedNode, dropTargetNode.nodeKey)) {
        handleReparentNode(draggedNode.nodeKey, dropTargetNode.nodeKey);
      }
    }

    nodeDragRef.current.dragging = false;
    setDraggedNode(null);
    setDropTargetNode(null);
  }, [draggedNode, dropTargetNode, handleReparentNode]);

  const onNodeEnter = useCallback((node) => {
    if (nodeDragRef.current.dragging && draggedNode && draggedNode.nodeKey !== node.nodeKey) {
      setDropTargetNode(node);
    }
  }, [draggedNode]);

  const onNodeLeave = useCallback(() => {
    setDropTargetNode(null);
  }, []);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header with root navigation */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        {/* Left spacer */}
        <div className="w-24" />

        {/* Center: Root node navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevRoot}
            disabled={currentRootIndex <= 0}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaChevronLeft size={20} />
          </button>

          {currentRoot ? (
            <div
              onClick={() => handleNodeClick(currentRoot)}
              className="min-w-[200px] text-center cursor-pointer hover:bg-teal-50 p-3 rounded-lg border-2 border-teal-500"
            >
              <h2 className="text-xl font-bold">{currentRoot.name}</h2>
              <p className="text-sm text-gray-500">Root Node (App)</p>
            </div>
          ) : (
            <div className="min-w-[200px] text-center p-3 text-gray-400">
              No root nodes yet
            </div>
          )}

          <button
            onClick={handleNextRoot}
            disabled={currentRootIndex >= rootNodes.length - 1}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaChevronRight size={20} />
          </button>
        </div>

        {/* Right: Add root button */}
        <button
          onClick={handleCreateRoot}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <FaPlus />
        </button>
      </div>

      {/* Tree visualization */}
      <div ref={wrapRef} className="flex-1 bg-white relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Loading...
          </div>
        ) : !treeData ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            {rootNodes.length === 0
              ? "Click + to create your first root node"
              : "Select a root node to view its tree"}
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => {
              if (nodeDragRef.current.dragging) return;
              onPointerDown(e);
            }}
            onPointerMove={(e) => {
              onPointerMove(e);
              onNodeDragMove(e);
            }}
            onPointerUp={(e) => {
              onPointerUp(e);
              onNodeDragEnd(e);
            }}
            onPointerCancel={(e) => {
              onPointerUp(e);
              onNodeDragEnd(e);
            }}
            onWheel={onWheel}
          >
            {/* Grid pattern */}
            <defs>
              <pattern id="adminGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#adminGrid)" />

            <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
              {/* Edges - curved lines for radial layout */}
              {layoutTree.edges.map((edge, i) => {
                // Calculate control point for smooth curve
                const dx = edge.to.x - edge.from.x;
                const dy = edge.to.y - edge.from.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Control point at 40% distance, perpendicular offset for curve
                const midX = edge.from.x + dx * 0.5;
                const midY = edge.from.y + dy * 0.5;

                // Slight curve by offsetting control point
                const perpX = -dy / dist * 15;
                const perpY = dx / dist * 15;
                const ctrlX = midX + perpX;
                const ctrlY = midY + perpY;

                return (
                  <path
                    key={i}
                    d={`M ${edge.from.x} ${edge.from.y} Q ${ctrlX} ${ctrlY} ${edge.to.x} ${edge.to.y}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={2}
                  />
                );
              })}

              {/* Nodes */}
              {layoutTree.nodes.map((node) => {
                const nodeWidth = node.width || 60;
                const nodeHeight = 36;
                const isRoot = node.parentKey === null;
                const isDragging = draggedNode?.nodeKey === node.nodeKey;
                const isDropTarget = dropTargetNode?.nodeKey === node.nodeKey;

                // Determine fill/stroke colors based on state
                let fillColor = isRoot ? "#0d9488" : "#f0fdfa";
                let strokeColor = isRoot ? "#0f766e" : "#14b8a6";
                let strokeWidth = 2;

                if (isDragging) {
                  fillColor = "#fef3c7"; // Yellow tint when dragging
                  strokeColor = "#f59e0b";
                  strokeWidth = 3;
                } else if (isDropTarget) {
                  fillColor = "#dcfce7"; // Green tint when valid drop target
                  strokeColor = "#22c55e";
                  strokeWidth = 3;
                }

                return (
                  <g
                    key={node.nodeKey}
                    transform={`translate(${node.x} ${node.y})`}
                    onClick={(e) => {
                      if (!nodeDragRef.current.dragging) handleNodeClick(node);
                    }}
                    onPointerDown={(e) => onNodeDragStart(e, node)}
                    onPointerMove={onNodeDragMove}
                    onPointerUp={onNodeDragEnd}
                    onPointerEnter={() => onNodeEnter(node)}
                    onPointerLeave={onNodeLeave}
                    style={{
                      cursor: isDragging ? "grabbing" : isRoot ? "pointer" : "grab",
                      opacity: isDragging ? 0.7 : 1,
                    }}
                    data-node="1"
                  >
                    {/* Node rounded rectangle */}
                    <rect
                      x={-nodeWidth / 2}
                      y={-nodeHeight / 2}
                      width={nodeWidth}
                      height={nodeHeight}
                      rx={8}
                      ry={8}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      data-node="1"
                    />

                    {/* Node label */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={14}
                      fontWeight={isRoot ? "bold" : "normal"}
                      fill={isRoot && !isDragging && !isDropTarget ? "#fff" : "#0f766e"}
                      data-node="1"
                      style={{ pointerEvents: "none" }}
                    >
                      {node.name || "Unnamed"}
                    </text>

                    {/* Children count badge */}
                    {node.children && node.children.length > 0 && (
                      <g transform={`translate(${nodeWidth / 2 - 5}, ${-nodeHeight / 2 - 5})`}>
                        <circle r={12} fill="#6366f1" data-node="1" />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight="bold"
                          fill="#fff"
                          data-node="1"
                          style={{ pointerEvents: "none" }}
                        >
                          {node.children.length}
                        </text>
                      </g>
                    )}

                    {/* Drag indicator for non-root nodes */}
                    {!isRoot && !isDragging && (
                      <g transform={`translate(${-nodeWidth / 2 + 8}, 0)`}>
                        <circle r={4} fill="#94a3b8" data-node="1" />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Drag-and-drop instruction overlay */}
      {draggedNode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Dragging: <span className="font-bold">{draggedNode.name}</span>
          {dropTargetNode ? (
            <span> → Drop on <span className="font-bold text-green-700">{dropTargetNode.name}</span></span>
          ) : (
            <span> — Hover over a node to reparent</span>
          )}
        </div>
      )}

      {/* Help text */}
      {!draggedNode && treeData && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Tip: Drag nodes to reparent them • Click to edit
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingNode && (
        <EditNodeModal
          treeKey={TREE_KEY}
          node={editingNode}
          onClose={handleModalClose}
          headers={headers}
        />
      )}
    </div>
  );
}
