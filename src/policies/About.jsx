import React, { useContext } from 'react';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import { ThemeContext } from "../utils/themes/ThemeContext";
import aboutTranslations from "../translations/about";

const About = () => {
  const { t } = useTranslation(aboutTranslations); // Use the translation hook
  const { currentTheme } = useContext(ThemeContext);

  return (
    <div
      style={{
        backgroundColor: currentTheme.headerBg,
        color: currentTheme.textColor
      }}
      className="mx-auto mt-28 px-4 rounded-xl sm:pz-10 lg:w-2/3 py-10 font-sans "
    >
      <h1 className="text-3xl font-bold mb-6 text-center">{t("title")}</h1> {/* Dynamic translation */}

      <p className="mb-4">
        {t("paragraph1")} {/* Dynamic translation */}
      </p>

      <p className="mb-4">
        {t("paragraph2")} {/* Dynamic translation */}
      </p>

      <p className="mb-4">
        {t("paragraph3")} {/* Dynamic translation */}
      </p>

      <p className="mb-4">
        {t("paragraph4")} {/* Dynamic translation */}
      </p>

      <p className="mb-4">
        {t("paragraph5")} {/* Dynamic translation */}
      </p>

      <p className="mb-4">
        {t("paragraph6")} {/* Dynamic translation */}
      </p>

      {/* <p className="mb-4">
        {t("paragraph7")} 
      </p> */}

      {/* <p className="mb-4">
        {t("paragraph8")} 
      </p> */}
    </div>
  );
};

export default About;
