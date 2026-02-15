import { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Props:
 *   open        – boolean   (controls visibility)
 *   onClose     – fn        (called when modal closed)
 */
export default function BuyCreditsModal({ open, onClose }) {
  const [packs, setPacks]     = useState([]);          // fetched packs
  const [busyId, setBusyId]  = useState(null);        // id of pack being purchased
  const [loading, setLoading] = useState(true);        // fetching packs

  /* ───────────────── Fetch packs once ───────────────── */
  useEffect(() => {
    
    if (!open) return;          // fetch only when modal opens
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/credit-packs`);
        if (mounted) setPacks(data.packs);
      } catch (err) {
        console.error("📉 pack fetch failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  /* ───────────────── Stripe checkout ───────────────── */
  const handleBuy = async (packId) => {
    const token = localStorage.getItem("token");
    try {
      setBusyId(packId);
      const { data } = await axios.post(`${API_URL}/buy-credits`, { packId }, 
        {
                headers: {
      Authorization: `Bearer ${token}`},
         });
      window.location.href = data.url; // redirect to Stripe hosted checkout
    } catch (err) {
      alert(err.response?.data?.msg || "Checkout failed");
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-scale-in">
        {/* close */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">Buy Credits</h2>

        {/* loader while fetching packs */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {packs.map((p) => (
              <div key={p._id} className="border rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.credits} credits</p>
                </div>

                <button
                  disabled={busyId === p._id}
                  onClick={() => handleBuy(p._id)}
                  className="inline-flex items-center gap-1 bg-teal-600 text-white px-4 py-1.5 rounded hover:bg-teal-700 disabled:bg-gray-400"
                >
                  {busyId === p._id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Buy ${p.priceUSD.toFixed(2)}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
