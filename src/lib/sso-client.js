/**
 * Seamless SSO Client
 * 
 * Handles invisible Single Sign-On across LIT Suite brands.
 * Users never realize they're being redirected to litsuite.app!
 * 
 * Flow:
 * 1. User visits Brand A (e.g., teleprompttv.tv)
 * 2. Check for existing SSO session via hidden iframe or redirect
 * 3. If session exists -> auto-login (invisible!)
 * 4. If no session -> show login form
 * 5. After login on Brand A -> set SSO cookie on .litsuite.app
 * 6. User visits Brand B -> automatically logged in (invisible!)
 */

import { getApiUrl, getSSOUrl } from '../api/getApiUrl';

const LITSUITE_DOMAIN = import.meta.env.VITE_LITSUITE_DOMAIN || 'https://litsuite.app';

/**
 * Generate PKCE parameters for OAuth
 */
async function generatePKCE() {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 128);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { verifier, challenge };
}

/**
 * Seamless SSO Client
 */
export class SeamlessSSO {
  constructor(config = {}) {
    this.brand = config.brand || 'lit';
    this.clientId = config.clientId || `${this.brand}-web`;
    this.redirectUri = config.redirectUri || `${window.location.origin}/auth/sso/callback`;
    this.apiUrl = config.apiUrl || getApiUrl();
    this.ssoUrl = getSSOUrl();
    
    // Check for SSO code in URL (from seamless redirect)
    this._checkForSSOCallback();
  }

  /**
   * Check if we're returning from SSO redirect
   */
  _checkForSSOCallback() {
    const params = new URLSearchParams(window.location.search);
    const ssoCode = params.get('sso_code');
    const state = params.get('state');
    
    if (ssoCode) {
      // We're returning from SSO - exchange code for token
      this._exchangeCodeForToken(ssoCode, state);
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('sso_code');
      newUrl.searchParams.delete('state');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }

  /**
   * Exchange SSO code for access token
   */
  async _exchangeCodeForToken(code, state) {
    try {
      // Get code verifier from sessionStorage
      const pkceData = JSON.parse(sessionStorage.getItem('sso_pkce') || '{}');
      
      if (pkceData.state !== state) {
        console.error('SSO state mismatch');
        return;
      }
      
      const response = await fetch(`${this.apiUrl}/auth/sso/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand': this.brand
        },
        body: JSON.stringify({
          code,
          code_verifier: pkceData.verifier
        })
      });
      
      if (!response.ok) {
        throw new Error('Token exchange failed');
      }
      
      const data = await response.json();
      
      // Store token
      this._storeToken(data.token);
      
      // Store user
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Notify app of successful login
      window.dispatchEvent(new CustomEvent('sso:login', { detail: data }));
      
    } catch (error) {
      console.error('SSO exchange error:', error);
      window.dispatchEvent(new CustomEvent('sso:error', { detail: error }));
    }
  }

  /**
   * Attempt seamless login
   * 
   * This tries to log in the user without them noticing:
   * 1. Quick redirect to litsuite.app to check for session
   * 2. If session exists, redirect back with code
   * 3. If no session, stay on current page
   */
  async attemptSeamlessLogin() {
    // Check if already logged in
    if (this.isLoggedIn()) {
      return { success: true, method: 'existing' };
    }
    
    try {
      // Generate PKCE
      const { verifier, challenge } = await generatePKCE();
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(36).padStart(2, '0'))
        .join('');
      
      // Store PKCE for later
      sessionStorage.setItem('sso_pkce', JSON.stringify({ verifier, state }));
      
      // Build SSO URL
      const ssoUrl = new URL(`${LITSUITE_DOMAIN}/api/sso/authorize`);
      ssoUrl.searchParams.set('client_id', this.clientId);
      ssoUrl.searchParams.set('redirect_uri', this.redirectUri);
      ssoUrl.searchParams.set('response_type', 'code');
      ssoUrl.searchParams.set('code_challenge', challenge);
      ssoUrl.searchParams.set('code_challenge_method', 'S256');
      ssoUrl.searchParams.set('state', state);
      ssoUrl.searchParams.set('brand_id', this.brand);
      
      // Redirect to SSO (invisible if session exists!)
      window.location.href = ssoUrl.toString();
      
      return { success: true, method: 'redirect' };
      
    } catch (error) {
      console.error('Seamless login error:', error);
      return { success: false, error };
    }
  }

  /**
   * Check SSO session status via iframe (non-blocking)
   * 
   * This creates a hidden iframe to check for SSO session
   * without redirecting the main page
   */
  async checkSessionStatus() {
    // TODO: SSO endpoints (/api/sso/check, etc.) not yet implemented in lit-api
    // Disabled to prevent 404 errors on page load
    return new Promise((resolve) => {
      resolve({ hasSession: false });
    });
  }

  /**
   * Login with credentials
   * 
   * After successful login, also sets up SSO session
   */
  async login(email, password) {
    try {
      // Login to brand
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand': this.brand
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store token
      this._storeToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Also set SSO session (invisible to user)
      if (data.sso) {
        this._setSSOSession(data.token, data.user.id);
      }
      
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set SSO session cookie on .litsuite.app domain
   * This happens invisibly after login
   */
  async _setSSOSession(token, userId) {
    try {
      // Call litsuite.app to set SSO cookie
      await fetch(`${LITSUITE_DOMAIN}/api/sso/set-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          user_id: userId,
          brand: this.brand
        }),
        credentials: 'include' // Important: include cookies
      });
    } catch (error) {
      // SSO session setup failed, but login still succeeded
      console.warn('SSO session setup failed:', error);
    }
  }

  /**
   * Logout from brand and SSO
   */
  async logout() {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Logout from SSO
      await fetch(`${LITSUITE_DOMAIN}/api/sso/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this._getToken();
  }

  /**
   * Get current user
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }

  /**
   * Get auth token
   */
  _getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Store auth token
   */
  _storeToken(token) {
    localStorage.setItem('token', token);
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    const token = this._getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

/**
 * React Hook for Seamless SSO
 * 
 * Usage:
 *   import { useSeamlessSSO } from '@/lib/sso-client';
 *   
 *   function App() {
 *     const { user, isLoggedIn, login, logout, isLoading } = useSeamlessSSO({
 *       brand: 'ttv'
 *     });
 *     
 *     if (isLoading) return <Loading />;
 *     
 *     if (!isLoggedIn) {
 *       return <LoginForm onSubmit={login} />;
 *     }
 *     
 *     return <Dashboard user={user} />;
 *   }
 */
export function useSeamlessSSO(config = {}) {
  // Placeholder implementation
  // In a real React app, use useState, useEffect, etc.
  
  const sso = new SeamlessSSO(config);
  
  return {
    user: sso.getUser(),
    isLoggedIn: sso.isLoggedIn(),
    isLoading: false,
    login: (email, password) => sso.login(email, password),
    logout: () => sso.logout(),
    attemptSeamlessLogin: () => sso.attemptSeamlessLogin(),
    checkSessionStatus: () => sso.checkSessionStatus()
  };
}

export default SeamlessSSO;
