// src/context/AdminContextProvider.jsx
import { useCallback, useMemo, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "./UserContext";

export const AdminContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Custom hooks for admin queries
 * Each resource is independently cached and can be refetched
 */

function useAdminAudios() {
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  return useQuery({
    queryKey: ["admin", "audios"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/sounds`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data?.sounds || [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useAdminVideos() {
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  return useQuery({
    queryKey: ["admin", "videos"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/all-videos`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data?.videos || [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

function useAdminMcqs() {
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  return useQuery({
    queryKey: ["admin", "mcqs"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/mcqs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data?.mcqs || [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

function useAdminUsers() {
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data?.users || [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

function useAdminBadges() {
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  return useQuery({
    queryKey: ["admin", "badges"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/badges`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data?.badges || [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

function useAdminImages() {
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  return useQuery({
    queryKey: ["admin", "images"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/all-images`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data || [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * AdminContextProvider
 * Provides admin resource queries and a simple UI tab state
 */
export default function AdminContextProvider({ children }) {
  const queryClient = useQueryClient();
  const { userRoles } = useUser() || { userRoles: [] };
  const isAdmin = (userRoles || []).includes("admin");

  // Queries
  const audiosQuery = useAdminAudios();
  const videosQuery = useAdminVideos();
  const mcqsQuery = useAdminMcqs();
  const usersQuery = useAdminUsers();
  const badgesQuery = useAdminBadges();
  const imagesQuery = useAdminImages();

  // Refresh helper
  const refetchAll = useCallback(async () => {
    if (!isAdmin) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "audios"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "videos"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "mcqs"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "badges"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "images"] }),
    ]);
  }, [queryClient, isAdmin]);

  const value = useMemo(
    () => ({
      // Data
      audios: audiosQuery.data || [],
      videos: videosQuery.data || [],
      mcqs: mcqsQuery.data || [],
      users: usersQuery.data || [],
      badges: badgesQuery.data || [],
      images: imagesQuery.data || [],

      // Loading states
      isLoadingAudios: audiosQuery.isLoading,
      isLoadingVideos: videosQuery.isLoading,
      isLoadingMcqs: mcqsQuery.isLoading,
      isLoadingUsers: usersQuery.isLoading,
      isLoadingBadges: badgesQuery.isLoading,
      isLoadingImages: imagesQuery.isLoading,

      // Error states
      audiosError: audiosQuery.error,
      videosError: videosQuery.error,
      mcqsError: mcqsQuery.error,
      usersError: usersQuery.error,
      badgesError: badgesQuery.error,
      imagesError: imagesQuery.error,

      // Refetch helpers
      refetchAudios: audiosQuery.refetch,
      refetchVideos: videosQuery.refetch,
      refetchMcqs: mcqsQuery.refetch,
      refetchUsers: usersQuery.refetch,
      refetchBadges: badgesQuery.refetch,
      refetchImages: imagesQuery.refetch,
      refetchAll,
    }),
    [
      audiosQuery.data,
      videosQuery.data,
      mcqsQuery.data,
      usersQuery.data,
      badgesQuery.data,
      imagesQuery.data,
      audiosQuery.isLoading,
      videosQuery.isLoading,
      mcqsQuery.isLoading,
      usersQuery.isLoading,
      badgesQuery.isLoading,
      imagesQuery.isLoading,
      audiosQuery.error,
      videosQuery.error,
      mcqsQuery.error,
      usersQuery.error,
      badgesQuery.error,
      imagesQuery.error,
      audiosQuery.refetch,
      videosQuery.refetch,
      mcqsQuery.refetch,
      usersQuery.refetch,
      badgesQuery.refetch,
      imagesQuery.refetch,
      refetchAll,
    ]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within AdminContextProvider");
  }
  return ctx;
};
