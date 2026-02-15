import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const EmailVerificationPage = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setMessage("Verification token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
      `${API_URL}/verify-email?token=${encodeURIComponent(token)}`,
      { method: "GET" }
      );


        const data = await response.json();

        if (data.success) {
          setMessage("Email verified successfully!");
          // You can redirect to dashboard or home page after success
          setTimeout(() => navigate("/admin-dashboard"), 3000);
        } else {
          setMessage("Invalid or expired token.");
        }
      } catch (error) {
        setMessage("An error occurred while verifying your email.");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="verification-page">
      {loading ? <p>Loading...</p> : <p>{message}</p>}
    </div>
  );
};

export default EmailVerificationPage;
