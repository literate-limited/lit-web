/**
 * SSO Authentication Service
 *
 * Implements OAuth 2.0 Authorization Code + PKCE flow for client-side authentication.
 *
 * Usage:
 * 1. Call initiateLogin() to redirect user to SSO authorization page
 * 2. Handle callback with handleAuthCallback() to exchange code for token
 * 3. Use logout() to clear session
 */

import { getSSOUrl } from './getApiUrl';

// SSO Configuration
// Uses centralized getApiUrl utility to eliminate double /api path issues
const SSO_BASE_URL = getSSOUrl();
const CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || "lit_web_client";
// IMPORTANT: redirect_uri must match the actual callback origin.
// A build-time env var here is risky because each brand has its own domain.
const DEFAULT_REDIRECT_URI = `${window.location.origin}/auth/callback`;

/**
 * Generate a cryptographically secure random string for PKCE
 * @returns {string} Base64URL-encoded random string
 */
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate PKCE code challenge from verifier
 * @param {string} verifier - Code verifier
 * @returns {Promise<string>} Base64URL-encoded SHA256 hash
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Base64URL encode (RFC 4648)
 * @param {Uint8Array} buffer - Buffer to encode
 * @returns {string} Base64URL-encoded string
 */
function base64URLEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate random state for CSRF protection
 * @returns {string} Random state string
 */
function generateState() {
  return generateCodeVerifier();
}

/**
 * Initiate SSO login flow
 *
 * Redirects user to SSO authorization page with PKCE parameters.
 *
 * @param {Object} options - Login options
 * @param {string} options.brandId - Target brand ID (optional)
 * @param {string} options.redirectUri - Callback URI (default: VITE_REDIRECT_URI or current origin + /auth/callback)
 */
export async function initiateLogin({ brandId, redirectUri } = {}) {
  try {
    // Generate PKCE parameters
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    // Store verifier and state in sessionStorage for callback
    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("pkce_state", state);

    // Build authorization URL
    const callbackUri = redirectUri || DEFAULT_REDIRECT_URI;
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: callbackUri,
      response_type: "code",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });

    if (brandId) {
      params.set("brand_id", brandId);
    }

    const authUrl = `${SSO_BASE_URL}/authorize?${params.toString()}`;

    // Redirect to SSO
    window.location.href = authUrl;
  } catch (error) {
    console.error("SSO login initiation failed:", error);
    throw new Error("Failed to initiate login");
  }
}

/**
 * Handle OAuth callback and exchange code for token
 *
 * Call this from your /auth/callback route.
 *
 * @param {string} code - Authorization code from URL params
 * @param {string} state - State from URL params
 * @param {string} redirectUri - Same redirect URI used in initiateLogin
 * @returns {Promise<Object>} Token response { access_token, token_type, expires_in }
 */
export async function handleAuthCallback(code, state, redirectUri) {
  try {
    // Retrieve stored PKCE parameters
    const verifier = sessionStorage.getItem("pkce_verifier");
    const storedState = sessionStorage.getItem("pkce_state");

    if (!verifier || !storedState) {
      throw new Error("PKCE parameters not found - login may have expired");
    }

    // Validate state (CSRF protection)
    if (state !== storedState) {
      throw new Error("State mismatch - possible CSRF attack");
    }

    // Clear stored PKCE parameters
    sessionStorage.removeItem("pkce_verifier");
    sessionStorage.removeItem("pkce_state");

    // Exchange authorization code for access token
    const callbackUri = redirectUri || DEFAULT_REDIRECT_URI;
    const response = await fetch(`${SSO_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // Ensures the global SSO cookie is sent (and any server-side session checks can succeed).
      credentials: "include",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUri,
        client_id: CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || "Token exchange failed");
    }

    const tokenData = await response.json();

    // Store token in both keys so older/newer auth paths stay consistent.
    localStorage.setItem("access_token", tokenData.access_token);
    localStorage.setItem("auth_token", tokenData.access_token);

    return tokenData;
  } catch (error) {
    console.error("OAuth callback handling failed:", error);
    throw error;
  }
}

/**
 * Get stored access token
 * @returns {string|null} Access token or null if not logged in
 */
export function getAccessToken() {
  return localStorage.getItem("access_token");
}

/**
 * Check if user is logged in
 * @returns {boolean} True if access token exists
 */
export function isLoggedIn() {
  return !!getAccessToken();
}

/**
 * Decode JWT token (without verification - for display purposes only)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decode failed:", error);
    return null;
  }
}

/**
 * Get current user info from token
 * @returns {Object|null} User info { coreUserId, accountId, email, brandId, brand, role }
 */
export function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    coreUserId: decoded.coreUserId,
    accountId: decoded.accountId,
    email: decoded.email,
    brandId: decoded.brandId,
    brand: decoded.brand,
    role: decoded.role,
    roles: decoded.roles,
  };
}

/**
 * Logout from SSO
 *
 * Clears local token and calls SSO logout endpoint.
 */
export async function logout() {
  try {
    // Cookie-based global logout.
    await fetch(`${SSO_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    // Clear local tokens (both keys).
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
  } catch (error) {
    console.error("Logout failed:", error);
    // Still clear local storage even if API call fails
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
  }
}

/**
 * Check whether this browser has an active global SSO session cookie.
 */
export async function ssoCheckSession() {
  const response = await fetch(`${SSO_BASE_URL}/check`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("SSO session check failed");
  }

  return response.json();
}

/**
 * Make authenticated API request
 *
 * Helper function to make API requests with automatic token injection.
 *
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Not authenticated - please log in");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 (token expired) - redirect to login
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Session expired - please log in again");
  }

  return response;
}

/**
 * Submit login form to centralized SSO service
 *
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {string} credentials.brandId - Brand ID for multi-tenant support
 * @param {string} credentials.redirectPath - Path to redirect to after login (optional)
 * @returns {Promise<string>} Redirect URL with auth code
 */
export async function ssoLogin({ email, password, brandId, redirectPath }) {
  try {
    // Generate PKCE parameters
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    // Store verifier and state in sessionStorage for callback
    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("pkce_state", state);

    const redirectUri = DEFAULT_REDIRECT_URI;
    const redirectUriWithPath = redirectPath
      ? `${redirectUri}?redirect_to=${encodeURIComponent(redirectPath)}`
      : redirectUri;

    // IMPORTANT: Use a full-page form POST so `Set-Cookie` happens in a first-party
    // context on `api.litsuite.app` (3P cookies are blocked by default in modern browsers).
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${SSO_BASE_URL}/login?mode=redirect`;

    const add = (name, value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value == null ? "" : String(value);
      form.appendChild(input);
    };

    add("email", email);
    add("password", password);
    add("client_id", CLIENT_ID);
    add("redirect_uri", redirectUriWithPath);
    add("code_challenge", challenge);
    add("code_challenge_method", "S256");
    add("state", state);
    if (brandId) add("brand_id", brandId);
    add("response_mode", "redirect");

    document.body.appendChild(form);
    form.submit();
    return null;
  } catch (error) {
    console.error("SSO login failed:", error);
    throw error;
  }
}

/**
 * Submit signup form to centralized SSO service
 *
 * @param {Object} credentials - Signup credentials
 * @param {string} credentials.name - User full name
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {string} credentials.brandId - Brand ID for multi-tenant support
 * @param {string} credentials.redirectPath - Path to redirect to after signup (optional)
 * @returns {Promise<string>} Redirect URL with auth code
 */
export async function ssoSignup({ name, email, password, brandId, redirectPath }) {
  try {
    // Generate PKCE parameters
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    // Store verifier and state in sessionStorage for callback
    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("pkce_state", state);

    const redirectUri = DEFAULT_REDIRECT_URI;
    const redirectUriWithPath = redirectPath
      ? `${redirectUri}?redirect_to=${encodeURIComponent(redirectPath)}`
      : redirectUri;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${SSO_BASE_URL}/signup?mode=redirect`;

    const add = (field, value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = field;
      input.value = value == null ? "" : String(value);
      form.appendChild(input);
    };

    add("name", name);
    add("email", email);
    add("password", password);
    add("client_id", CLIENT_ID);
    add("redirect_uri", redirectUriWithPath);
    add("code_challenge", challenge);
    add("code_challenge_method", "S256");
    add("state", state);
    if (brandId) add("brand_id", brandId);
    add("response_mode", "redirect");

    document.body.appendChild(form);
    form.submit();
    return null;
  } catch (error) {
    console.error("SSO signup failed:", error);
    throw error;
  }
}

export default {
  initiateLogin,
  handleAuthCallback,
  getAccessToken,
  isLoggedIn,
  getCurrentUser,
  logout,
  authenticatedFetch,
  decodeToken,
  ssoLogin,
  ssoSignup,
};
