import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking");
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/payments/lesson/status/${bookingId}`);
        setBooking(data);
      } catch (err) {
        setError("Unable to verify payment status");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {booking?.paymentStatus === "paid" || !booking?.paymentRequired ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              {booking?.paymentRequired
                ? "Your payment was successful and your lesson is booked."
                : "Your lesson request has been sent to the teacher."}
            </p>
            {booking?.amountInCents > 0 && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  Amount paid: <span className="font-semibold">${(booking.amountInCents / 100).toFixed(2)} {booking.currency?.toUpperCase()}</span>
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              You'll receive an email confirmation shortly. The teacher will review and confirm your booking.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h1>
            <p className="text-gray-600 mb-6">
              Your booking request was created, but payment is still being processed.
              Please check your email for confirmation.
            </p>
          </>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition"
          >
            Go to Home
          </Link>
          <Link
            to="/student-dashboard"
            className="block w-full py-3 px-4 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            View My Lessons
          </Link>
        </div>

        {bookingId && (
          <p className="mt-6 text-xs text-gray-400">
            Booking ID: {bookingId}
          </p>
        )}
      </div>
    </div>
  );
}
