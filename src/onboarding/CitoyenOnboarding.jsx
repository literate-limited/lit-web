import { useContext, useMemo, useState } from "react";
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage } from "formik";
import axios from "axios";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Circles } from "react-loader-spinner";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useBrand } from "../brands/BrandContext";

const API_URL = import.meta.env.VITE_API_URL;

const tt = (v, fallback) => (!v ? fallback : v);

const sanitizeHandle = (raw = "") => raw.trim().replace(/^@+/, "").toLowerCase();

export default function CitoyenOnboarding({ invite, inviteToken, onSignedUp }) {
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brand, brandId } = useBrand();
  const appName = brand?.name || "Lit";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const inviterLabel = useMemo(() => {
    const inv = invite?.inviter;
    return inv?.name
      ? `${inv.name}${inv.handle ? ` (@${inv.handle})` : ""}`
      : inv?.handle
      ? `@${inv.handle}`
      : "your referrer";
  }, [invite]);

  // lastName is optional now
  const schema = Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string(), // Optional
    handle: Yup.string()
      .transform((v) => sanitizeHandle(v))
      .required(tt("Handle is required", "Handle is required"))
      .min(3, "Handle must be at least 3 characters")
      .max(20, "Handle must be 20 characters or less")
      .matches(/^[a-z0-9_]+$/, "Handle can only use lowercase letters, numbers, and underscores"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    confirmPassword: Yup.string().oneOf([Yup.ref("password"), null], "Passwords must match").required("Confirm password is required"),
  });

  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    try {
      const fullName = values.lastName
        ? `${values.firstName} ${values.lastName}`.trim()
        : values.firstName.trim();

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName || "",
        name: fullName,
        handle: sanitizeHandle(values.handle),
        email: values.email,
        password: values.password,
        inviteToken,
      };

      const { data } = await axios.post(`${API_URL}/signup`, payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (brandId || brand?.id) {
        localStorage.setItem("brandId", brandId || brand.id);
      }

      onSignedUp?.(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const inputBg = theme?.surface?.interactive ?? currentTheme?.placeholderBg ?? "#ffffff";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6 relative"
      style={{ backgroundColor: pageBg, color: textPrimary }}
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Signup form */}
        <div
          className="rounded-xl p-6 sm:p-7"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 0 35px ${glow}` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <img className="h-14 w-14" src={brand?.logo} alt={appName} />
            <div>
              <div className="text-xl font-bold">Welcome to {appName}</div>
              <div className="text-sm opacity-80" style={{ color: textSecondary }}>
                You have been invited by <span className="font-semibold">{inviterLabel}</span>.
              </div>
            </div>
          </div>

          <Formik
            initialValues={{
              firstName: invite.firstName || "",
              lastName: invite.lastName || "",
              handle: invite.suggestedHandle || "",
              email: invite.inviteeEmail || "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={schema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, isValid, setFieldValue, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="font-semibold text-sm" htmlFor="firstName" style={{ color: textPrimary }}>
                      First Name *
                    </label>
                    <Field
                      id="firstName"
                      name="firstName"
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                      style={{
                        color: textPrimary,
                        backgroundColor: inputBg,
                        borderColor: cardBorder,
                        "--tw-ring-color": accent,
                      }}
                    />
                    <ErrorMessage name="firstName" component="div" className="text-red-600 text-xs mt-1" />
                  </div>

                  <div className="flex flex-col">
                    <label className="font-semibold text-sm" htmlFor="lastName" style={{ color: textPrimary }}>
                      Last Name
                    </label>
                    <Field
                      id="lastName"
                      name="lastName"
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                      style={{
                        color: textPrimary,
                        backgroundColor: inputBg,
                        borderColor: cardBorder,
                        "--tw-ring-color": accent,
                      }}
                      placeholder="(optional)"
                    />
                    <ErrorMessage name="lastName" component="div" className="text-red-600 text-xs mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="font-semibold text-sm" htmlFor="handle" style={{ color: textPrimary }}>
                      Handle *
                    </label>
                    <Field name="handle">
                      {({ field }) => (
                        <input
                          {...field}
                          id="handle"
                          className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                          style={{
                            color: textPrimary,
                            backgroundColor: inputBg,
                            borderColor: cardBorder,
                            "--tw-ring-color": accent,
                          }}
                          onChange={(e) => setFieldValue("handle", e.target.value)}
                          onBlur={() => setFieldValue("handle", sanitizeHandle(values.handle))}
                          placeholder="your_handle"
                          autoComplete="off"
                        />
                      )}
                    </Field>
                    <div className="text-xs opacity-70" style={{ color: textSecondary }}>
                      This becomes your @handle.
                    </div>
                    <ErrorMessage name="handle" component="div" className="text-red-600 text-xs mt-1" />
                  </div>

                  <div className="flex flex-col">
                    <label className="font-semibold text-sm" htmlFor="email" style={{ color: textPrimary }}>
                      Email *
                    </label>
                    <Field
                      id="email"
                      name="email"
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                      style={{
                        color: textPrimary,
                        backgroundColor: inputBg,
                        borderColor: cardBorder,
                        "--tw-ring-color": accent,
                      }}
                      autoComplete="off"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-600 text-xs mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative flex flex-col">
                    <label className="font-semibold text-sm" htmlFor="password" style={{ color: textPrimary }}>
                      Password *
                    </label>
                    <Field
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                      style={{
                        color: textPrimary,
                        backgroundColor: inputBg,
                        borderColor: cardBorder,
                        "--tw-ring-color": accent,
                      }}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: textSecondary }}
                    >
                      {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                    <ErrorMessage name="password" component="div" className="text-red-600 text-xs mt-1" />
                  </div>

                  <div className="relative flex flex-col">
                    <label className="font-semibold text-sm" htmlFor="confirmPassword" style={{ color: textPrimary }}>
                      Confirm *
                    </label>
                    <Field
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 text-sm"
                      style={{
                        color: textPrimary,
                        backgroundColor: inputBg,
                        borderColor: cardBorder,
                        "--tw-ring-color": accent,
                      }}
                      autoComplete="off"
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-600 text-xs mt-1" />
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className={`w-full py-3 rounded-full font-semibold shadow-lg hover:scale-[1.02] transition-all duration-200 hover:opacity-90 ${
                    !isValid ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
                >
                  {isSubmitting ? (
                    <Circles height="20" width="100%" color={inverseText} ariaLabel="loading" />
                  ) : (
                    `Enter ${appName}`
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Right: Lewis + speech bubble (placeholder visual) - hidden on mobile */}
        <div
          className="hidden md:flex rounded-xl p-6 sm:p-7 flex-col justify-end"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 0 35px ${glow}` }}
        >
          <div
            className="mb-4 p-4 rounded-2xl border"
            style={{ borderColor: cardBorder, backgroundColor: theme?.surface?.containerSubtle ?? currentTheme?.innerContainerColor ?? "#ffffff" }}
          >
            <div className="font-bold mb-1" style={{ color: textPrimary }}>
              Lewis says...
            </div>
            <div className="text-sm opacity-80" style={{ color: textSecondary }}>
              Hi, <span className="font-semibold">{invite.firstName}</span>!<br />
              You have been invited to join {appName} by <span className="font-semibold">{inviterLabel}</span>.
            </div>
          </div>

          <div className="flex justify-end items-end gap-3">
            {/* Replace with your real Lewis asset when ready */}
            <div
              className="w-40 h-40 rounded-2xl border flex items-center justify-center text-xs opacity-70"
              style={{ borderColor: cardBorder, color: textSecondary }}
            >
              Lewis image placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
