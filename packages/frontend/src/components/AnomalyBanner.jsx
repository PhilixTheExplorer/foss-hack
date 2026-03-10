export default function AnomalyBanner({
  level,
  reasons = [],
  onReport,
  onDismiss
}) {
  if (level === "safe") {
    return null;
  }

  if (level === "medium") {
    return (
      <div className="border-b border-yellow-300 bg-yellow-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none">⚠️</span>
            <p className="text-sm font-medium text-yellow-900">
              Someone you don&apos;t know well has been messaging you a lot. Heads up.
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md border border-yellow-400 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-900 transition hover:bg-yellow-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-red-300 bg-red-100 px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none">🚨</span>
        <p className="text-sm font-medium text-red-900">
          This contact has unusual patterns. You can report them anonymously — no one will
          know it was you.
        </p>
      </div>

      {reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {reasons.map((reason, index) => (
            <span
              key={`${reason}-${index}`}
              className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onReport}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          Report Anonymously
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 transition hover:bg-red-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
