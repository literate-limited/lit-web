import React, {useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../translator/hooks/useTranslation"; 
import { ThemeContext } from "../utils/themes/ThemeContext";
import Translations from "../translations/forgotPassword";

const API_URL = import.meta.env.VITE_API_URL;


const ForgotPassword = () => {
  const { t } = useTranslation(Translations);
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
      .email(t("invalidEmail"))
      .required(t("emailRequired")),
  });
  const handleForgotPassword = async (values, { setSubmitting }) => {
    setLoading(true);
    setError("");
    setMessage("");
  
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email: values.email,
      });
  
      setMessage(t("emailSent"));
    } catch (err) {
      setError(err.response?.data?.message || t("error"));
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };
  

  return (
    <div
    className="w-full min-h-screen flex flex-col items-center justify-center bg-background pt-20">
      <Formik
        initialValues={{ email: "" }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleForgotPassword}
      >
        {({ isSubmitting, isValid }) => (
          <Form 
          style={{
            backgroundColor: currentTheme.headerBg, color:currentTheme.textColor}}  className="w-full max-w-md px-6 py-8  shadow-lg rounded-lg">
            <h2 className="font-bold text-2xl mb-5 text-center">{t("title")}</h2>

            <div className="flex flex-col">
              <label className="font-semibold my-2" htmlFor="forgot-password-email">
                {t("emailLabel")}
              </label>
              <Field
                style={{
                  backgroundColor: currentTheme.placeholderBg}}
                  placeholder={t("emailPlaceholder")}
                   className="px-3 py-2 rounded-md border " name="email" />
              <ErrorMessage className="text-red-600 text-sm mt-1" name="email" component="div" />
            </div>

            {error && <div className="text-red-600 mt-3">{error}</div>}
            {message && <div className="text-green-600 mt-3">{message}</div>}

            <button 
             style={{backgroundColor:currentTheme.buttonColor}}className=" w-full text-white font-semibold rounded-md py-2 mt-6 disabled:opacity-50" type="submit" disabled={isSubmitting || loading || !isValid}>
              {isSubmitting || loading ? <Circles height="20" width="100%" color="purple" /> : t("submitButton")}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPassword;
