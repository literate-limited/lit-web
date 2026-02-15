import axios from "axios";
import { resolveBrand } from "../brand/resolveBrand";
import { resolveApiUrl } from "./resolveApiUrl";
import {
  shouldSyncCreditsForRequest,
  triggerTtvCreditSync,
  recordTtvLedgerEvent,
} from "../features/ttv/utils/ttvCreditSync";

// Resolve brand and API URL at runtime (no build-time env vars)
const brand = resolveBrand();
const baseURL = resolveApiUrl();

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Inject ?channel=<brand> or body.channel = <brand>
api.interceptors.request.use((config) => {
  if (config.method === "get" || config.method === "delete") {
    config.params = {
      ...(config.params || {}),
      channel: brand,
    };
  } else {
    config.data = {
      ...(config.data || {}),
      channel: brand,
    };
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const isTtv = brand?.toLowerCase() === "ttv";
    if (isTtv && shouldSyncCreditsForRequest(response?.config)) {
      recordTtvLedgerEvent({
        endpoint: response?.config?.url || "",
        status: response?.status,
        ok: true,
        reason: "ok",
      });
      triggerTtvCreditSync("ttv-response");
    }

    // V2 API Response Format: { success: true, data: {...}, meta: {...} }
    // Auto-unwrap the data field for backward compatibility
    if (response.data && typeof response.data === "object" && "success" in response.data) {
      // Preserve meta in a custom property for pagination/etc
      if (response.data.meta) {
        response.meta = response.data.meta;
      }
      // Unwrap the data field
      response.data = response.data.data;
    }

    return response;
  },
  (error) => {
    const isTtv = brand?.toLowerCase() === "ttv";
    if (isTtv && shouldSyncCreditsForRequest(error?.config)) {
      recordTtvLedgerEvent({
        endpoint: error?.config?.url || "",
        status: error?.response?.status ?? "ERR",
        ok: false,
        reason: error?.response?.data?.error || error?.message || "error",
      });
      triggerTtvCreditSync("ttv-error");
    }

    // V2 API Error Format: { success: false, error: { code, message, details } }
    // Extract the error object for better error messages
    if (error.response?.data && typeof error.response.data === "object") {
      if (error.response.data.success === false && error.response.data.error) {
        const apiError = error.response.data.error;
        // Enhance the error object with V2 error details
        error.message = apiError.message || error.message;
        error.code = apiError.code;
        error.details = apiError.details;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
