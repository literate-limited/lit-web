/**
 * OAuth Callback Handler
 *
 * Handles the redirect from SSO authorization server.
 * Exchanges the authorization code for a token and stores it.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleAuthCallback } from "../api/auth.service";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function processCallback() {
      try {
        // Get OAuth parameters from URL
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Handle OAuth errors
        if (error) {
          console.error("OAuth error:", error, errorDescription);
          navigate(`/login?error=${error}`);
          return;
        }

        // Seamless SSO: the authorization endpoint can redirect back here with no code
        // when no global session exists. Treat it as "not logged in" (no scary error).
        const ssoLoginRequired = searchParams.get("sso_login_required");
        if (!code && ssoLoginRequired === "true") {
          navigate("/login");
          return;
        }

        // Validate code exists
        if (!code) {
          console.error("No authorization code received");
          navigate("/login?error=no_code");
          return;
        }

        // Exchange code for token
        // OAuth requires the redirect_uri used in the token exchange to match
        // the redirect_uri used when initiating the flow (including redirect_to).
        const redirectUriUrl = new URL(window.location.href);
        redirectUriUrl.searchParams.delete("code");
        redirectUriUrl.searchParams.delete("state");
        redirectUriUrl.searchParams.delete("error");
        redirectUriUrl.searchParams.delete("error_description");
        const redirectUri = redirectUriUrl.toString();

        await handleAuthCallback(code, state, redirectUri);

        // Redirect to home (or redirect_to param if provided)
        const redirectTo = searchParams.get("redirect_to") || "/";
        navigate(redirectTo);

        // Reload to ensure user context is updated
        window.location.href = redirectTo;
      } catch (error) {
        console.error("Auth callback failed:", error.message);
        navigate(`/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
      }
    }

    processCallback();
  }, [navigate, searchParams]);

  // Show loading while processing
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#0b0703",
        color: "#f3e7c3",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3e7c3",
          borderTop: "4px solid #b67b2c",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p>Signing you in...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
