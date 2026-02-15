import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import paymentTranslations from "./translations";

function Success() {
    const { t } = useTranslation(paymentTranslations);
    const location = useLocation();
    const sessionId = new URLSearchParams(location.search).get('session_id');

    useEffect(() => {
        const updateUserStatus = async () => {
            await fetch('/api/update-premium-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            });
        };
        updateUserStatus();
    }, [sessionId]);

    return <h1 className="text-3xl font-bold text-center mt-10">{t("success.paymentSuccess")}</h1>; // Dynamic translation
}

export default Success;
