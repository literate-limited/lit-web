import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useBrand } from "../brands/BrandContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ParentOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brand } = useBrand();
  const appName = brand?.name || "Lit";

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [step, setStep] = useState("CHILDREN");
  const [childRows, setChildRows] = useState([{ name: "", status: "idle" }]);
  const [existingChildren, setExistingChildren] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const inviterName = invitation?.inviter?.name || "your teacher";

  const authToken = localStorage.getItem("token");

  const loadParentStatus = async () => {
    if (!authToken) return;
    const { data } = await axios.get(`${API_URL}/parents/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const stage = data?.parentProfile?.onboardingStage || "CHILDREN";
    setStep(stage);
  };

  const loadChildren = async () => {
    if (!authToken) return;
    const { data } = await axios.get(`${API_URL}/parents/children`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    setExistingChildren(Array.isArray(data.children) ? data.children : []);
  };

  useEffect(() => {
    if (step === "DONE") {
      navigate("/parent-dashboard", { replace: true });
    }
  }, [step, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!authToken) {
          navigate(`/login?redirect=/parent-onboarding${inviteToken ? `?invite=${inviteToken}` : ""}`);
          return;
        }

        if (inviteToken) {
          const { data } = await axios.get(`${API_URL}/invitations/validate/${inviteToken}`);
          if (cancelled) return;
          if (!data?.success) {
            setPageError(data?.message || "Invite is invalid or expired.");
            setLoading(false);
            return;
          }
          if (data.invitation?.inviteType && data.invitation.inviteType !== "parent") {
            setPageError("This invite is not for a parent account.");
            setLoading(false);
            return;
          }
          setInvitation(data.invitation);
        }

        await loadParentStatus();
        await loadChildren();
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setPageError(e.response?.data?.message || e.message || "Failed to load parent onboarding.");
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authToken, inviteToken, navigate]);

  const addRow = () => {
    setChildRows((prev) => [...prev, { name: "", status: "idle" }]);
  };

  const updateRow = (idx, field, value) => {
    setChildRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value, status: "idle" } : row))
    );
  };

  const submitChildren = async () => {
    setSubmitting(true);
    setInlineError(null);

    try {
      const payload = {
        children: childRows
          .filter((row) => row.name.trim())
          .map((row) => ({ name: row.name.trim() })),
      };

      if (payload.children.length === 0) {
        setInlineError("Please add at least one child.");
        setSubmitting(false);
        return;
      }

      const { data } = await axios.post(`${API_URL}/parents/children`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const results = Array.isArray(data.results) ? data.results : [];

      setChildRows((prev) =>
        prev.map((row, idx) => {
          const result = results[idx];
          if (!result) return row;
          if (result.status === "conflict") {
            return { ...row, status: "conflict", existingUser: result.existingUser };
          }
          if (result.status === "added") {
            return { ...row, status: "added" };
          }
          if (result.status === "already_added") {
            return { ...row, status: "added" };
          }
          if (result.status === "invalid") {
            return { ...row, status: "invalid" };
          }
          return row;
        })
      );

      await loadChildren();
    } catch (e) {
      setInlineError(e.response?.data?.message || "Failed to add children.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmChild = async (rowIdx, childId) => {
    setSubmitting(true);
    setInlineError(null);
    try {
      await axios.post(
        `${API_URL}/parents/children/confirm`,
        { childId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setChildRows((prev) =>
        prev.map((row, idx) => (idx === rowIdx ? { ...row, status: "pending" } : row))
      );
      await loadChildren();
    } catch (e) {
      setInlineError(e.response?.data?.message || "Failed to send confirmation request.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmContact = async () => {
    if (!inviteToken) {
      setInlineError("Missing invite token.");
      return;
    }
    setSubmitting(true);
    setInlineError(null);
    try {
      await axios.post(
        `${API_URL}/parents/confirm-contact`,
        { token: inviteToken },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setStep("LEARNING");
    } catch (e) {
      setInlineError(e.response?.data?.message || "Failed to confirm contact.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLearningChoice = async (optIn) => {
    setSubmitting(true);
    setInlineError(null);
    try {
      if (optIn) {
        await axios.post(
          `${API_URL}/parents/learning-opt-in`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        navigate("/onboarding?redirect=/parent-dashboard", { replace: true });
      } else {
        await axios.post(
          `${API_URL}/parents/complete`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        navigate("/parent-dashboard", { replace: true });
      }
    } catch (e) {
      setInlineError(e.response?.data?.message || "Failed to save your choice.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnyChildren = useMemo(() => {
    return existingChildren.length > 0 || childRows.some((row) => row.status === "added");
  }, [existingChildren, childRows]);

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const inputBg = theme?.surface?.interactive ?? currentTheme?.placeholderBg ?? "#ffffff";
  const surfaceSubtle = theme?.surface?.containerSubtle ?? currentTheme?.innerContainerColor ?? "#f7edd1";
  const successText = theme?.feedback?.successText ?? "#15803d";
  const errorText = theme?.feedback?.errorText ?? "#b91c1c";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  const cardStyle = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    boxShadow: `0 0 35px ${glow}`,
    color: textPrimary,
  };

  const primaryButtonBase =
    "px-5 py-2.5 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50";
  const primaryButtonStyle = {
    backgroundColor: accent,
    color: inverseText,
    boxShadow: `0 0 20px ${glow}`,
  };
  const secondaryButtonBase =
    "px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:opacity-90";
  const secondaryButtonStyle = {
    borderColor: accent,
    color: accent,
    backgroundColor: surfaceSubtle,
  };

  if (loading) {
    return (
      <section className="min-h-screen w-full flex items-center justify-center p-6 relative" style={{ backgroundColor: pageBg, color: textPrimary }}>
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="text-sm opacity-70" style={{ color: textSecondary }}>Loading parent onboarding...</div>
        </div>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="min-h-screen w-full flex items-center justify-center p-6 relative" style={{ backgroundColor: pageBg, color: textPrimary }}>
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <div className="max-w-md w-full rounded-xl p-6" style={cardStyle}>
          <div className="text-4xl mb-3">😔</div>
          <div className="font-semibold mb-2">Parent onboarding issue</div>
          <div className="text-sm opacity-70 mb-4" style={{ color: textSecondary }}>{pageError}</div>
          <button
            type="button"
            className="px-6 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={primaryButtonStyle}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen w-full flex items-center justify-center p-6 relative" style={{ backgroundColor: pageBg, color: textPrimary }}>
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-2xl">
        <div className="rounded-xl p-6 sm:p-7" style={cardStyle}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={brand?.logo} alt={appName} className="h-10 w-10" />
              <div>
                <div className="text-lg font-bold">Parent Onboarding</div>
                <div className="text-xs opacity-70" style={{ color: textSecondary }}>Invite from {inviterName}</div>
              </div>
            </div>
            <div className="text-xs opacity-70" style={{ color: textSecondary }}>
              Step {step === "CHILDREN" ? 1 : step === "CONTACT" ? 2 : 3} of 3
            </div>
          </div>

          {inlineError && (
            <div className="mb-4 text-xs" style={{ color: errorText }}>{inlineError}</div>
          )}

          {step === "CHILDREN" && (
            <div>
              <div className="text-sm font-semibold mb-2">Add your children</div>
              <div className="text-xs opacity-70 mb-4" style={{ color: textSecondary }}>
                Please enter your kids' names to add them.
              </div>

              <div className="space-y-3">
                {childRows.map((row, idx) => (
                  <div
                    key={`${idx}-${row.status}`}
                    className="rounded-lg border p-3"
                    style={{ borderColor: cardBorder, backgroundColor: surfaceSubtle }}
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                        style={{
                          color: textPrimary,
                          backgroundColor: inputBg,
                          borderColor: cardBorder,
                          "--tw-ring-color": accent,
                        }}
                        placeholder="Child name"
                        value={row.name}
                        onChange={(e) => updateRow(idx, "name", e.target.value)}
                      />
                    </div>

                    {row.status === "conflict" && row.existingUser && (
                      <div className="mt-3 text-sm">
                        <div className="font-semibold">Is this your child?</div>
                        <div className="text-xs opacity-70 mb-2" style={{ color: textSecondary }}>
                          {row.existingUser.name} ({row.existingUser.email})
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                          style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 15px ${glow}` }}
                          onClick={() => confirmChild(idx, row.existingUser._id)}
                          disabled={submitting}
                        >
                          Yes, send confirmation
                        </button>
                      </div>
                    )}

                    {row.status === "pending" && (
                      <div className="mt-2 text-xs" style={{ color: successText }}>Confirmation sent to child ✅</div>
                    )}

                    {row.status === "added" && (
                      <div className="mt-2 text-xs" style={{ color: successText }}>Child added ✅</div>
                    )}

                    {row.status === "invalid" && (
                      <div className="mt-2 text-xs" style={{ color: errorText }}>Please provide your child's name.</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={addRow}
                  className="text-xs underline"
                  style={{ color: textSecondary }}
                >
                  + Add another child
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full font-semibold shadow-md transition-all duration-200 disabled:opacity-50 text-sm"
                  style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 15px ${glow}` }}
                  onClick={submitChildren}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save children"}
                </button>
              </div>

              {existingChildren.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold mb-2">Children on file</div>
                  <div className="space-y-2 text-xs opacity-70" style={{ color: textSecondary }}>
                    {existingChildren.map((child) => (
                      <div key={child._id}>
                        {child.child?.name || child.childName || "Child"} • {child.child?.email || child.childEmail || ""} • {child.status}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className={primaryButtonBase}
                  style={primaryButtonStyle}
                  disabled={!hasAnyChildren}
                  onClick={() => setStep("CONTACT")}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === "CONTACT" && (
            <div>
              <div className="text-sm font-semibold mb-2">Confirm teacher contact</div>
              <div className="text-xs opacity-70 mb-4" style={{ color: textSecondary }}>
                Do you want to be a contact of {inviterName} for updates about your child?
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={primaryButtonBase}
                  style={primaryButtonStyle}
                  onClick={confirmContact}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Yes, confirm"}
                </button>
              </div>
            </div>
          )}

          {step === "LEARNING" && (
            <div>
              <div className="text-sm font-semibold mb-2">Learning account</div>
              <div className="text-xs opacity-70 mb-4" style={{ color: textSecondary }}>
                Would you like to make an account for learning as well?
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  className={primaryButtonBase}
                  style={primaryButtonStyle}
                  onClick={() => handleLearningChoice(true)}
                  disabled={submitting}
                >
                  Yes, set up learning
                </button>
                <button
                  type="button"
                  className={secondaryButtonBase}
                  style={secondaryButtonStyle}
                  onClick={() => handleLearningChoice(false)}
                  disabled={submitting}
                >
                  Not now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
