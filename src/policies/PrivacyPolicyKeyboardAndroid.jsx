import React from 'react';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import policyTranslations from "./translations";

const KeyboardprivacyPolicyAndroidAndroid = () => {
  const { t } = useTranslation(policyTranslations);

  return (
    <div className="mt-28 flex justify-center items-center min-h-screen bg-[#a0c1ca]">
      <div className="w-full max-w-2xl p-5 bg-[#bdd8dd] border-8 border-[#a0c1ca] shadow-md font-sans text-black">
        <h1 className="text-center text-3xl font-bold mb-5">{t("privacyPolicyAndroid.title")}</h1>
        <p className="text-center"><strong>{t("privacyPolicyAndroid.effectiveDate")}</strong> 13/08/2024</p>

        <h2 className="text-xl font-semibold text-center mt-5">1. {t("privacyPolicyAndroid.introduction.title")}</h2>
        <p>{t("privacyPolicyAndroid.introduction.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">2. {t("privacyPolicyAndroid.informationWeCollect.title")}</h2>
        <p><strong>{t("privacyPolicyAndroid.informationWeCollect.personalData")}</strong> {t("privacyPolicyAndroid.informationWeCollect.personalDataDescription")}</p>
        <p><strong>{t("privacyPolicyAndroid.informationWeCollect.inputData")}</strong> {t("privacyPolicyAndroid.informationWeCollect.inputDataDescription")}</p>
        <p><strong>{t("privacyPolicyAndroid.informationWeCollect.usageData")}</strong> {t("privacyPolicyAndroid.informationWeCollect.usageDataDescription")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">3. {t("privacyPolicyAndroid.howWeUseYourInformation.title")}</h2>
        <p>{t("privacyPolicyAndroid.howWeUseYourInformation.text")}</p>
        <ul className="list-disc list-inside ml-5">
          <li>{t("privacyPolicyAndroid.howWeUseYourInformation.bullet1")}</li>
          <li>{t("privacyPolicyAndroid.howWeUseYourInformation.bullet2")}</li>
          <li>{t("privacyPolicyAndroid.howWeUseYourInformation.bullet3")}</li>
        </ul>

        <h2 className="text-xl font-semibold text-center mt-5">4. {t("privacyPolicyAndroid.thirdPartyServices.title")}</h2>
        <p>{t("privacyPolicyAndroid.thirdPartyServices.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">5. {t("privacyPolicyAndroid.dataSecurity.title")}</h2>
        <p>{t("privacyPolicyAndroid.dataSecurity.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">6. {t("privacyPolicyAndroid.yourChoices.title")}</h2>
        <p>{t("privacyPolicyAndroid.yourChoices.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">7. {t("privacyPolicyAndroid.childrensPrivacy.title")}</h2>
        <p>{t("privacyPolicyAndroid.childrensPrivacy.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">8. {t("privacyPolicyAndroid.changesToPolicy.title")}</h2>
        <p>{t("privacyPolicyAndroid.changesToPolicy.text")}</p>

        <h2 className="text-xl font-semibold text-center mt-5">9. {t("privacyPolicyAndroid.contactUs.title")}</h2>
        <p>{t("privacyPolicyAndroid.contactUs.text")}</p>
        <p className="text-center font-semibold">{t("privacyPolicyAndroid.contactUs.email")}</p>
      </div>
    </div>
  );
};

export default KeyboardprivacyPolicyAndroidAndroid;
