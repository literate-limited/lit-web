import React from "react";
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import policyTranslations from "./translations";

const SupportInfo = () => {
  const { t } = useTranslation(policyTranslations);

  return (
    <div className="p-5 max-w-2xl mx-auto my-28 font-sans bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl text-center font-semibold text-gray-800 mb-2">{t("supportInfo.title")}</h2> {/* Dynamic translation */}
      <p className="text-gray-600 mb-4">
        {t("supportInfo.intro")} {/* Dynamic translation */}
      </p>

      <h3 className="text-xl font-semibold text-gray-700 mt-4">{t("supportInfo.contactSupport")}</h3>
      <p className="text-gray-600 mb-4">
        {t("supportInfo.email")} <a href="mailto:hello@truephonetics.com" className="text-blue-600 hover:underline">hello@truephonetics.com</a>
      </p>

      <h3 className="text-xl font-semibold text-gray-700 mt-4">{t("supportInfo.faqs")}</h3>
      <div className="mb-4">
        <h4 className="text-lg font-bold text-gray-600">{t("supportInfo.howToUse")}</h4>
        <p className="text-gray-600 mb-2">
          {t("supportInfo.howToUseInstructions")} {/* Dynamic translation */}
        </p>
        <ol className="list-decimal list-inside text-gray-600 mb-4">
          <li>{t("supportInfo.step1")}</li>
          <li>{t("supportInfo.step2")}</li>
          <li>{t("supportInfo.step3")}</li>
          <li>{t("supportInfo.step4")}</li>
        </ol>

        <h4 className="text-lg font-bold text-gray-600">{t("supportInfo.symbolsQuestion")}</h4>
        <p className="text-gray-600 mb-2">
          {t("supportInfo.symbolsExplanation")} {/* Dynamic translation */}
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-4">
          <li><strong>ϫ</strong> – {t("supportInfo.symbolCh")}</li>
          <li><strong>ʇ</strong> – {t("supportInfo.symbolT")}</li>
          <li><strong>ʞ</strong> – {t("supportInfo.symbolK")}</li>
          <li><strong>ʠ</strong> – {t("supportInfo.symbolP")}</li>
        </ul>
        <p className="text-gray-600">
          {t("supportInfo.npmExplanation")} {/* Dynamic translation */}
        </p>
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mt-4">{t("supportInfo.troubleshooting")}</h3>
      <ul className="list-disc list-inside text-gray-600 mb-4">
        <li>{t("supportInfo.troubleshootStep1")}</li>
        <li>{t("supportInfo.troubleshootStep2")}</li>
        <li>
          {t("supportInfo.troubleshootStep3")} <strong>{t("supportInfo.settingsPath")}</strong>.
        </li>
      </ul>

      <p className="mt-4 text-gray-500 text-sm">
        {t("supportInfo.dedication")} {/* Dynamic translation */}
      </p>
    </div>
  );
};

export default SupportInfo;
