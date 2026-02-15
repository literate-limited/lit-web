// src/context/UserContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCloudBalance } from "../utils/cloudBank";
import { resolveBrand } from "../brand/resolveBrand";
import { resolveApiUrl } from "../api/resolveApiUrl";
import { useDevModeStore } from "../stores/useDevModeStore";

/**
 * UserContext
 * - Provides user/auth state via React Query (server state)
 * - Provides auth headers and token utilities
 * - NO local useState duplication - uses Query directly
 */
const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const API_URL = resolveApiUrl();
  const brand = resolveBrand();
  const queryClient = useQueryClient();

  // Local-only state (not from server)
  const [cloudBalance, setCloudBalance] = useState(getCloudBalance());

  // Get JWT token from storage (SSO uses 'access_token', direct login uses 'token')
  const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token");

  // ====== React Query: Fetch /me ======
  const {
    data: meData,
    isLoading: isMeLoading,
    error: meError,
    refetch: refetchMe,
  } = useQuery({
    queryKey: ["me", brand],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const url = new URL(`${API_URL}/social/users/me`);
      url.searchParams.set("channel", brand);

      const response = await fetch(url.toString(), { headers });
      if (!response.ok) {
        if (response.status === 401) {
          // Token invalid - remove both token formats
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          return null;
        }
        const error = new Error("Failed to fetch user");
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    // Only run if we have a token
    enabled: !!getToken(),
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // On error, clear the query
    retry: false,
  });

  // ====== Mutation: Update Avatar ======
  const updateAvatarMutation = useMutation({
    mutationFn: async (file) => {
      if (!file) throw new Error("No file provided");
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.error || `Upload failed (HTTP ${res.status})`;
        const error = new Error(msg);
        error.status = res.status;
        throw error;
      }

      return data?.user;
    },
    onSuccess: (updatedUser) => {
      // Optimistically update the cache
      queryClient.setQueryData(["me", brand], (old) => ({
        ...old,
        user: updatedUser,
      }));
    },
  });

  // ====== Derived Values (from Query) ======
  const user = useMemo(() => {
    const u = meData?.user;
    if (!u) return null;

    // Normalize user shape
    const normalized = {
      ...u,
      _id: u._id || u.id,
      cloud: (u.cloud ?? 0) + cloudBalance,
    };
    return normalized;
  }, [meData, cloudBalance]);

  const userRoles = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  }, [user]);

  const userRole = useMemo(() => {
    return userRoles[0] || user?.role || "user";
  }, [userRoles, user]);

  const userLoggedIn = !!user;
  const userVerified = !!user?.verified;
  const authChecked = !isMeLoading;

  // ====== Auth Headers (always fresh) ======
  const getAccessToken = useCallback(() => getToken(), []);

  const getAuthHeaders = useCallback(() => {
    const t = getToken();
    return {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
  }, []);

  const headers = useMemo(() => {
    const t = getToken();
    return {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
  }, []);

  // ====== Logout Helper ======
  const logout = useCallback(() => {
    // Remove both token formats (SSO uses access_token, direct login uses token)
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    queryClient.setQueryData(["me", brand], null);
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [queryClient, brand]);

  // ====== Listen for cloud currency updates ======
  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail || {};
      const balance =
        typeof detail.balance === "number" ? detail.balance : getCloudBalance();
      setCloudBalance(balance);
    };
    window.addEventListener("cloud:updated", handler);
    return () => window.removeEventListener("cloud:updated", handler);
  }, []);

  // ====== Set dev mode permissions ======
  useEffect(() => {
    const canAccessDev = (userRoles || []).includes("dev") || (userRoles || []).includes("admin");
    useDevModeStore.setState({ canAccessDevMode: canAccessDev });
  }, [userRoles]);

  // ====== Context Value ======
  const ctxValue = useMemo(
    () => ({
      // Server state (from React Query)
      user,
      userRole,
      userRoles,
      userLoggedIn,
      userVerified,
      authChecked,
      isLoadingUser: isMeLoading,
      userError: meError,

      // Local state
      cloudBalance,

      // Auth utilities
      headers,
      getAccessToken,
      getAuthHeaders,

      // Actions
      updateAvatar: updateAvatarMutation.mutate,
      updateAvatarAsync: updateAvatarMutation.mutateAsync,
      isUpdatingAvatar: updateAvatarMutation.isPending,
      refetchMe,
      logout,
    }),
    [
      user,
      userRole,
      userRoles,
      userLoggedIn,
      userVerified,
      authChecked,
      isMeLoading,
      meError,
      cloudBalance,
      headers,
      getAccessToken,
      getAuthHeaders,
      updateAvatarMutation.mutate,
      updateAvatarMutation.mutateAsync,
      updateAvatarMutation.isPending,
      refetchMe,
      logout,
    ]
  );

  return (
    <UserContext.Provider value={ctxValue}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
};
