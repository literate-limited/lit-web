import { useContext, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useTranslation } from "../translator/hooks/useTranslation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useBrand } from "../brands/BrandContext";
import authTranslations from "./translations";
import { ssoSignup } from "../api/auth.service";

const signupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

const SignUp = () => {
  const { t } = useTranslation(authTranslations);
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brandId, brand } = useBrand();

  const [error, setError] = useState("");

  const handleFormSignUp = async (values, { setSubmitting }) => {
    try {
      setError("");

      // Submit to central SSO service
      const redirectUrl = await ssoSignup({
        name: values.name,
        email: values.email,
        password: values.password,
        brandId,
        redirectPath,
      });

      // Redirect to callback with auth code
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Sign up failed:", error);
      setError(error.message || "Sign up failed. Please try again.");
      setSubmitting(false);
    }
  };

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/login";

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
              {t("signup.title")}
            </h2>

            <p className="text-center text-sm mb-6" style={{ color: textPrimary, opacity: 0.8 }}>
              Create a LitSuite account
            </p>

            {error && (
              <div className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Formik
              initialValues={{
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
              }}
              validationSchema={signupSchema}
              onSubmit={handleFormSignUp}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="mb-6">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <Field
                      as="input"
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: errors.name && touched.name ? "#dc2626" : cardBorder,
                        backgroundColor: "#ffffff",
                        color: textPrimary,
                      }}
                    />
                    <ErrorMessage name="name">
                      {(msg) => <div className="text-red-600 text-sm mt-1">{msg}</div>}
                    </ErrorMessage>
                  </div>

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

                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <Field
                      as="input"
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: errors.password && touched.password ? "#dc2626" : cardBorder,
                        backgroundColor: "#ffffff",
                        color: textPrimary,
                      }}
                    />
                    <ErrorMessage name="password">
                      {(msg) => <div className="text-red-600 text-sm mt-1">{msg}</div>}
                    </ErrorMessage>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <Field
                      as="input"
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: errors.confirmPassword && touched.confirmPassword ? "#dc2626" : cardBorder,
                        backgroundColor: "#ffffff",
                        color: textPrimary,
                      }}
                    />
                    <ErrorMessage name="confirmPassword">
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
                    {isSubmitting ? "Creating account..." : "Sign Up"}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="mt-6 text-center text-sm">
              Already have an account?
              <Link
                className="font-semibold underline underline-offset-2 ml-1"
                style={{ color: textPrimary }}
                to={loginHref}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
