import { useSearchParams, Link } from "react-router-dom";

export default function BookingCancel() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. The booking request has been saved but requires payment to confirm.
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            Your booking slot is being held temporarily. Complete payment soon to secure your lesson time.
          </p>
        </div>

        <div className="space-y-3">
          {bookingId && (
            <Link
              to={`/booking?retry=${bookingId}`}
              className="block w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition"
            >
              Try Payment Again
            </Link>
          )}
          <Link
            to="/booking"
            className="block w-full py-3 px-4 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Back to Calendar
          </Link>
          <Link
            to="/"
            className="block w-full py-3 px-4 text-gray-500 rounded-lg font-medium hover:text-gray-700 transition"
          >
            Return Home
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
