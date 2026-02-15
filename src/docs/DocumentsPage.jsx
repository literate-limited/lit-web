import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function DocsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch docs on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/docs`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch docs");

        const data = await res.json();
        setDocs(data.documents || []); // backend returns { documents: [...] }
      } catch (err) {
        console.error("❌ Error fetching docs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  // Create a new doc
  const createDoc = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Untitled Document" }),
      });

      if (!res.ok) throw new Error("Failed to create doc");

      const data = await res.json();
      navigate(`/docs/${data._id || data.document._id}`);
    } catch (err) {
      console.error("❌ Error creating doc:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Docs</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        onClick={createDoc}
      >
        + New Doc
      </button>

      {docs.length === 0 ? (
        <p>No docs yet. Create your first one!</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div
              key={doc._id}
              className="border p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/docs/${doc._id}`)}
            >
              <h2 className="font-semibold truncate">{doc.title}</h2>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(doc.updatedAt).toLocaleString()}
              </p>
              <p className="mt-2 text-gray-700 line-clamp-3">{doc.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocsPage;
