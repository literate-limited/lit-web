import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../translator/hooks/useTranslation";

const API_URL = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Get the token from URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const ResetPasswordSchema = Yup.object().shape({
    password: Yup.string().min(8, t("resetPassword.passwordMin")).required(t("resetPassword.passwordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], t("resetPassword.passwordsMustMatch"))
      .required(t("resetPassword.confirmPasswordRequired")),
  });
  const handleResetPassword = async (values, { setSubmitting }) => {
    setLoading(true);
    setError("");
    setMessage("");
  
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        token, // Send token in request body
        newPassword: values.password, // Rename password field to newPassword
      });
  
      setMessage(t("resetPassword.successMessage"));
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("❌ Reset Password Error:", err);
      setError(t("resetPassword.errorMessage"));
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };
  

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background">
      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={ResetPasswordSchema}
        onSubmit={handleResetPassword}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="w-[300px]" id="resetPasswordForm">
            <h2 className="font-bold text-2xl mb-5">{t("resetPassword.title")}</h2>

            <div className="relative flex flex-col">
              <label className="font-semibold my-2" htmlFor="reset-password">
                {t("resetPassword.passwordLabel")}
              </label>
              <Field
                type="password"
                name="password"
                id="reset-password"
                placeholder={t("resetPassword.passwordPlaceholder")}
                autoComplete="off"
                className="px-3 py-2 rounded-md mb-3"
              />
              <ErrorMessage className="text-red-600" name="password" component="div" />
            </div>

            <div className="relative flex flex-col">
              <label className="font-semibold my-2" htmlFor="confirm-password">
                {t("resetPassword.confirmPasswordLabel")}
              </label>
              <Field
                type="password"
                name="confirmPassword"
                id="confirm-password"
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                autoComplete="off"
                className="px-3 py-2 rounded-md mb-3"
              />
              <ErrorMessage className="text-red-600" name="confirmPassword" component="div" />
            </div>

            {error && <div className="text-red-600">{error}</div>}
            {message && <div className="text-green-600">{message}</div>}

            <button
              className={`bg-blue-500 hover:bg-blue-300 w-full px-1 py-2 text-white font-semibold rounded-md mt-5 transition-opacity duration-300 ${
                !isValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
              type="submit"
              disabled={isSubmitting || loading || !isValid}
            >
              {isSubmitting || loading ? (
                <Circles height="20" width="100%" color="purple" ariaLabel="loading" margin="auto" />
              ) : (
                t("resetPassword.submitButton")
              )}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ResetPassword;
