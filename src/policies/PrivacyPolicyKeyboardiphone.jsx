import React from 'react';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import policyTranslations from "./translations";

const KeyboardPrivacyPolicyiPhone = () => {
  const { t } = useTranslation(policyTranslations);

  return (
    <div className="mt-28 flex justify-center items-center min-h-screen bg-[#a0c1ca]">
      <div className="w-full max-w-2xl p-5 bg-[#bdd8dd] border-8 border-[#a0c1ca] shadow-md font-sans text-black">
        <h1 className="text-center text-3xl font-bold mb-5">{t("privacyPolicyIos.title")}</h1>
        <p className="text-center"><strong>{t("privacyPolicyIos.effectiveDate")}</strong> 13/08/2024</p>

        <h2 className="text-xl font-semibold text-center mt-5">1. {t("privacyPolicyIos.introduction.title")}</h2>
        <p>{t("privacyPolicyIos.introduction.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">2. {t("privacyPolicyIos.informationWeCollect.title")}</h2>
        <p><strong>{t("privacyPolicyIos.informationWeCollect.personalData")}</strong> {t("privacyPolicyIos.informationWeCollect.personalDataDescription")}</p>
        <p><strong>{t("privacyPolicyIos.informationWeCollect.inputData")}</strong> {t("privacyPolicyIos.informationWeCollect.inputDataDescription")}</p>
        <p><strong>{t("privacyPolicyIos.informationWeCollect.usageData")}</strong> {t("privacyPolicyIos.informationWeCollect.usageDataDescription")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">3. {t("privacyPolicyIos.howWeUseYourInformation.title")}</h2>
        <p>{t("privacyPolicyIos.howWeUseYourInformation.text")}</p>
        <ul className="list-disc list-inside ml-5">
          <li>{t("privacyPolicyIos.howWeUseYourInformation.bullet1")}</li>
          <li>{t("privacyPolicyIos.howWeUseYourInformation.bullet2")}</li>
          <li>{t("privacyPolicyIos.howWeUseYourInformation.bullet3")}</li>
        </ul>

        <h2 className="text-xl font-semibold text-center mt-5">4. {t("privacyPolicyIos.thirdPartyServices.title")}</h2>
        <p>{t("privacyPolicyIos.thirdPartyServices.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">5. {t("privacyPolicyIos.dataSecurity.title")}</h2>
        <p>{t("privacyPolicyIos.dataSecurity.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">6. {t("privacyPolicyIos.yourChoices.title")}</h2>
        <p>{t("privacyPolicyIos.yourChoices.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">7. {t("privacyPolicyIos.childrensPrivacy.title")}</h2>
        <p>{t("privacyPolicyIos.childrensPrivacy.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">8. {t("privacyPolicyIos.changesToPolicy.title")}</h2>
        <p>{t("privacyPolicyIos.changesToPolicy.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">9. {t("privacyPolicyIos.contactUs.title")}</h2>
        <p>{t("privacyPolicyIos.contactUs.text")}</p>
        <p className="text-center font-semibold">{t("privacyPolicyIos.contactUs.email")}</p>
      </div>
    </div>
  );
};

export default KeyboardPrivacyPolicyiPhone;
