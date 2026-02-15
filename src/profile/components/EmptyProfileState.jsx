export default function EmptyProfileState({ isSelf, viewMode }) {
  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm text-center">
      <div className="text-lg font-bold text-slate-800">No features yet</div>
      <div className="mt-2 text-sm text-slate-600">
        {isSelf
          ? "Click the + button to add a feature module (like booking)."
          : viewMode === "guest"
          ? "This user hasn’t added any public features (or you’re not allowed to see them yet)."
          : "This user hasn’t added any public features you can see yet."}
      </div>
    </div>
  );
}
