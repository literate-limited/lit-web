import React from 'react';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import policyTranslations from "./translations";

const TruePhoneticsPrivacyPolicy = () => {
  const { t } = useTranslation(policyTranslations);

  return (
    <div className="flex mt-28 justify-center items-center rounded min-h-screen bg-[#a0c1ca]">
      <div className="w-full max-w-2xl p-5 bg-[#bdd8dd] border-8 rounded-lg border-[#a0c1ca] shadow-md font-sans text-black">
        <h1 className="text-center text-3xl font-bold mb-5">{t("privacyPolicy.title")}</h1>
        <p className="text-center"><strong>{t("privacyPolicy.effectiveDate")}</strong> 19/01/2025</p>

        <h2 className="text-xl font-semibold text-center mt-5">1. {t("privacyPolicy.introduction.title")}</h2>
        <p>{t("privacyPolicy.introduction.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">2. {t("privacyPolicy.informationWeCollect.title")}</h2>
        <p><strong>{t("privacyPolicy.informationWeCollect.personalData")}</strong> {t("privacyPolicy.informationWeCollect.personalDataDescription")}</p>
        <p><strong>{t("privacyPolicy.informationWeCollect.usageData")}</strong> {t("privacyPolicy.informationWeCollect.usageDataDescription")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">3. {t("privacyPolicy.howWeUseYourInformation.title")}</h2>
        <p>{t("privacyPolicy.howWeUseYourInformation.text")}</p>
        <ul className="list-disc list-inside ml-5">
          <li>{t("privacyPolicy.howWeUseYourInformation.bullet1")}</li>
          <li>{t("privacyPolicy.howWeUseYourInformation.bullet2")}</li>
          <li>{t("privacyPolicy.howWeUseYourInformation.bullet3")}</li>
        </ul>

        <h2 className="text-xl font-semibold text-center mt-5">4. {t("privacyPolicy.dataStorageAndRetention.title")}</h2>
        <p>{t("privacyPolicy.dataStorageAndRetention.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">5. {t("privacyPolicy.thirdPartyServices.title")}</h2>
        <p>{t("privacyPolicy.thirdPartyServices.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">6. {t("privacyPolicy.childrensPrivacy.title")}</h2>
        <p>{t("privacyPolicy.childrensPrivacy.text")}</p>
        <p className="text-center font-semibold">{t("privacyPolicy.childrensPrivacy.contact")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">7. {t("privacyPolicy.dataSecurity.title")}</h2>
        <p>{t("privacyPolicy.dataSecurity.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">8. {t("privacyPolicy.changesToPolicy.title")}</h2>
        <p>{t("privacyPolicy.changesToPolicy.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">9. {t("privacyPolicy.contactUs.title")}</h2>
        <p>{t("privacyPolicy.contactUs.text")}</p>
        <p className="text-center font-semibold">{t("privacyPolicy.contactUs.email")}</p>
      </div>
    </div>
  );
};

export default TruePhoneticsPrivacyPolicy;
