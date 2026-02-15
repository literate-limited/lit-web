import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { IoMdCloseCircle } from "react-icons/io";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

export default function EditNodeModal({ treeKey, node, onClose, headers }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [children, setChildren] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // New child input state
  const [showNewChildInput, setShowNewChildInput] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const newChildInputRef = useRef(null);

  useEffect(() => {
    if (node) {
      setName(node.name || "");
      setDescription(node.description || "");
      fetchChildren();
    }
  }, [node]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/knowledge-trees/${treeKey}/nodes/${node.nodeKey}/children`,
        { headers }
      );
      setChildren(res.data.nodes || []);
    } catch (err) {
      console.error("Failed to fetch children:", err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await axios.put(
        `${API_URL}/knowledge-trees/${treeKey}/nodes/${node.nodeKey}`,
        { name: name.trim(), description: description.trim() },
        { headers }
      );
      setMessage("Saved!");
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error("Failed to save:", err);
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(
        `${API_URL}/knowledge-trees/${treeKey}/nodes/${node.nodeKey}`,
        { headers }
      );
      onClose();
    } catch (err) {
      console.error("Failed to delete:", err);
      setMessage("Failed to delete");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleShowNewChildInput = () => {
    setShowNewChildInput(true);
    setNewChildName("");
    // Focus the input after render
    setTimeout(() => {
      newChildInputRef.current?.focus();
    }, 50);
  };

  const handleCancelNewChild = () => {
    setShowNewChildInput(false);
    setNewChildName("");
  };

  const handleAddChild = async () => {
    const childName = newChildName.trim();
    if (!childName) {
      setMessage("Child name is required");
      return;
    }

    setAddingChild(true);
    try {
      await axios.post(
        `${API_URL}/knowledge-trees/${treeKey}/nodes`,
        { name: childName, parentKey: node.nodeKey },
        { headers }
      );
      setShowNewChildInput(false);
      setNewChildName("");
      fetchChildren();
      setMessage("");
    } catch (err) {
      console.error("Failed to add child:", err);
      setMessage("Failed to add child");
    } finally {
      setAddingChild(false);
    }
  };

  const handleNewChildKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddChild();
    } else if (e.key === "Escape") {
      handleCancelNewChild();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg w-[90%] max-w-lg max-h-[90vh] p-6 overflow-y-auto relative shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-3xl text-gray-800 hover:text-red-600"
        >
          <IoMdCloseCircle />
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Node</h2>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Node name"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Optional description"
          />
        </div>

        {/* Children */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Children ({children.length})
          </label>
          <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto">
            {children.length > 0 ? (
              children.map((child) => (
                <div
                  key={child.nodeKey}
                  className="text-sm py-1 px-2 bg-white rounded mb-1"
                >
                  {child.name}
                </div>
              ))
            ) : (
              !showNewChildInput && (
                <p className="text-sm text-gray-500 py-1">No children</p>
              )
            )}

            {/* Inline new child input */}
            {showNewChildInput && (
              <div className="flex items-center gap-2 py-1">
                <input
                  ref={newChildInputRef}
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  onKeyDown={handleNewChildKeyDown}
                  placeholder="Enter child name..."
                  disabled={addingChild}
                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                />
                <button
                  onClick={handleAddChild}
                  disabled={addingChild || !newChildName.trim()}
                  className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                  title="Add child"
                >
                  <FaCheck size={14} />
                </button>
                <button
                  onClick={handleCancelNewChild}
                  disabled={addingChild}
                  className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                  title="Cancel"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            )}
          </div>

          {!showNewChildInput && (
            <button
              onClick={handleShowNewChildInput}
              className="mt-2 text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              + Add Child
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <p
            className={`text-center text-sm mb-3 ${
              message.includes("Failed") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              confirmDelete
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            <FaTrash />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
