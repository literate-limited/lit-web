import React from 'react';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import policyTranslations from "./translations";

const TermsAndConditions = () => {
  const { t } = useTranslation(policyTranslations);

  return (
    <div className='mt-28'>
      {t("termsAndConditions.title")}
    </div>
  );
}

export default TermsAndConditions;
