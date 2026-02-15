import { useContext, useEffect, useState } from "react";
import { QRCodeSVG } from "react-qr-code";
import axios from "axios";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ClassQRCodeModal({ open, classId, className, onClose }) {
  const { currentTheme } = useContext(ThemeContext);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const inner = currentTheme?.innerContainerColor ?? "#fff";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/class/${classId}/qr-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQrData(data);
    } catch (err) {
      console.error("Failed to generate QR:", err);
      setError(err.response?.data?.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generateQR();
    }
  }, [open, classId]);

  const handleCopyUrl = async () => {
    if (!qrData?.url) return;

    try {
      await navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy URL");
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${className?.replace(/\s+/g, "-")}-qr-code.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const svg = document.getElementById("qr-code-svg");

    if (!svg || !printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${className}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            h1 { margin-bottom: 20px; }
            .qr-container { margin: 20px 0; }
            .instructions {
              max-width: 600px;
              text-align: center;
              margin-top: 20px;
              font-size: 14px;
            }
            @media print {
              body { margin: 40px; }
            }
          </style>
        </head>
        <body>
          <h1>Join ${className}</h1>
          <div class="qr-container">${svg.outerHTML}</div>
          <div class="instructions">
            <p><strong>Scan this QR code to join the class</strong></p>
            <p>Or visit: ${qrData?.url}</p>
            <p>Valid until: ${new Date(qrData?.expiresAt).toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getTimeRemaining = () => {
    if (!qrData?.expiresAt) return "";

    const now = new Date();
    const expires = new Date(qrData.expiresAt);
    const diff = expires - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-xl p-6"
        style={{ backgroundColor: inner, borderColor }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Class QR Code</h2>
          <button
            onClick={onClose}
            className="text-2xl opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-lg font-semibold mb-2">Generating QR code...</div>
            <div className="text-sm opacity-70">Please wait</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-lg font-semibold text-red-500 mb-2">{error}</div>
            <button
              onClick={generateQR}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: buttonColor }}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && qrData && (
          <div>
            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-white rounded-xl border" style={{ borderColor }}>
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrData.url}
                  size={300}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Class Info */}
            <div className="text-center mb-4">
              <div className="font-semibold text-lg mb-1">{className}</div>
              <div className="text-sm opacity-70">{qrData.class?.subject}</div>
            </div>

            {/* Join URL */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 opacity-70">
                Join URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrData.url}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor }}
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap"
                  style={{ borderColor }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* Expiry Info */}
            <div className="mb-6 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm">
              <div className="font-semibold text-yellow-800 mb-1">
                ⏱️ {getTimeRemaining()}
              </div>
              <div className="text-yellow-700">
                Expires: {new Date(qrData.expiresAt).toLocaleString()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={handleDownloadQR}
                className="px-4 py-2 rounded-lg border text-sm font-semibold"
                style={{ borderColor }}
              >
                📥 Download
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg border text-sm font-semibold"
                style={{ borderColor }}
              >
                🖨️ Print
              </button>
              <button
                onClick={generateQR}
                className="px-4 py-2 rounded-lg border text-sm font-semibold"
                style={{ borderColor }}
              >
                🔄 Regenerate
              </button>
            </div>

            {/* Instructions */}
            <div className="text-xs opacity-70 text-center">
              <p>Students can scan this QR code with their phone camera</p>
              <p>to join your class instantly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
