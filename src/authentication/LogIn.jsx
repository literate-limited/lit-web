import { useContext, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useTranslation } from "../translator/hooks/useTranslation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useBrand } from "../brands/BrandContext";
import authTranslations from "./translations";
import { ssoLogin } from "../api/auth.service";

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required"),
});

const LogIn = () => {
  const { t } = useTranslation(authTranslations);
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brandId, brand } = useBrand();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleFormLogin = async (values, { setSubmitting }) => {
    try {
      setError("");

      // Submit to central SSO service
      const redirectUrl = await ssoLogin({
        email: values.email,
        password: values.password,
        brandId,
        redirectPath,
      });

      // Redirect to callback with auth code
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.message || "Invalid email or password");
      setSubmitting(false);
    }
  };

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const signupHref = redirectPath
    ? `/signup?redirect=${encodeURIComponent(redirectPath)}`
    : "/signup";

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden py-8"
      style={{ backgroundColor: pageBg, color: textPrimary }}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="flex min-h-full items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div
            className="rounded-xl p-6 sm:p-8 shadow-[0_0_35px_rgba(255,200,120,0.4)]"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex justify-center mb-6">
              <Link to="/" className="inline-block">
                <img
                  className="h-16 w-16 sm:h-20 sm:w-20 cursor-pointer"
                  src={brand?.logo}
                  alt={brand?.name || "Logo"}
                />
              </Link>
            </div>

            <h2 className="font-bold text-2xl sm:text-3xl text-center mb-2">
              {t("login.title")}
            </h2>

            <p className="text-center text-sm mb-6" style={{ color: textPrimary, opacity: 0.8 }}>
              Sign in to your LitSuite account
            </p>

            {error && (
              <div className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Formik
              initialValues={{
                email: "",
                password: "",
              }}
              validationSchema={loginSchema}
              onSubmit={handleFormLogin}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="mb-6">
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Field
                      as="input"
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: errors.email && touched.email ? "#dc2626" : cardBorder,
                        backgroundColor: "#ffffff",
                        color: textPrimary,
                      }}
                    />
                    <ErrorMessage name="email">
                      {(msg) => <div className="text-red-600 text-sm mt-1">{msg}</div>}
                    </ErrorMessage>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Field
                        as="input"
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{
                          borderColor: errors.password && touched.password ? "#dc2626" : cardBorder,
                          backgroundColor: "#ffffff",
                          color: textPrimary,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                        style={{ color: accent }}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <ErrorMessage name="password">
                      {(msg) => <div className="text-red-600 text-sm mt-1">{msg}</div>}
                    </ErrorMessage>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full py-3
                      font-semibold text-sm
                      rounded-full
                      shadow-[0_0_20px_rgba(255,200,120,0.3)]
                      hover:shadow-[0_0_30px_rgba(255,200,120,0.5)]
                      hover:scale-[1.02]
                      transition-all duration-200
                      focus:outline-none focus:ring-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    style={{ backgroundColor: accent, color: theme?.text?.inverse ?? "#f3e7c3" }}
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="mt-6 text-center text-sm">
              Don't have an account?
              <Link
                className="font-semibold underline underline-offset-2 ml-1"
                style={{ color: textPrimary }}
                to={signupHref}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogIn;
