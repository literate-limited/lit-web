/* eslint-disable react/prop-types */


export default function IncomingCallModal({
  call,
  onAccept,
  onReject,
}) {
  if (!call) return null;

  return (
    <div className="fixed right-2 top-[15%] -translate-y-1/2 z-50 ">
      <div className="w-72 bg-white rounded-xl shadow-xl border p-4">
        <p className="text-sm text-gray-500">Incoming</p>

        <h3 className="font-semibold text-lg">
          {call.callType === "video" ? "Video Call" : "Audio Call"}
        </h3>

        <p className="text-xs text-gray-500 mt-1">
          From user: {call.senderId}
        </p>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={onReject}
            className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
          <button
            onClick={onAccept}
            className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
