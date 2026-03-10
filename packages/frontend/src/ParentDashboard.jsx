import { useEffect, useMemo, useState } from "react";

function clampScore(score) {
  const numeric = Number(score ?? 0);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

export default function ParentDashboard({ initialAlert = null }) {
  const [alert, setAlert] = useState(initialAlert);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!initialAlert?.contactName) return;
    setAlert(initialAlert);
    setExpanded(false);
  }, [initialAlert]);

  useEffect(() => {
    const parentChannel = new BroadcastChannel("safenest-parent");

    parentChannel.onmessage = (event) => {
      const data = event?.data;
      if (!data?.contactName) return;

      const messageType = data.type ?? "alert";
      if (messageType !== "alert" && messageType !== "report-submitted") return;

      setAlert({
        type: messageType,
        contactName: data.contactName,
        riskScore: data.riskScore ?? 0,
        reasons: Array.isArray(data.reasons) ? data.reasons : []
      });
      setExpanded(false);
    };

    return () => {
      parentChannel.close();
    };
  }, []);

  const riskWidth = useMemo(() => `${clampScore(alert?.riskScore)}%`, [alert?.riskScore]);

  const sendCheckIn = () => {
    const teenChannel = new BroadcastChannel("safenest-teen");
    teenChannel.postMessage({ type: "parent-check-in" });
    teenChannel.close();
  };

  if (!alert) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-gray-900">SafeNest Parent Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            You&apos;ll be notified if unusual patterns are detected.
          </p>

          <div className="mt-8 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-sm font-medium text-emerald-700">All clear</span>
          </div>
        </div>
      </div>
    );
  }

  if (alert.type === "report-submitted") {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-gray-900">SafeNest Parent Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            You&apos;ll be notified if unusual patterns are detected.
          </p>

          <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-100 p-5">
            <h2 className="text-lg font-semibold text-emerald-900">
              ✅ Your child reported an unusual contact anonymously. No action needed.
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">SafeNest Parent Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;ll be notified if unusual patterns are detected.
        </p>

        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-100 p-5">
          <h2 className="text-lg font-semibold text-amber-900">
            ⚠️ Unusual Contact Pattern Detected
          </h2>
          <p className="mt-1 text-sm text-amber-900/90">
            An unusual contact pattern was detected on your child&apos;s account.
          </p>

          <div className="mt-4 space-y-3 text-sm text-gray-800">
            <p>
              <span className="font-medium">Contact:</span> {alert.contactName}
            </p>

            <div>
              <p className="mb-1 font-medium">Risk score: {alert.riskScore}</p>
              <div className="h-2 w-full rounded-full bg-amber-200">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: riskWidth }} />
              </div>
            </div>

            {alert.reasons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {alert.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-gray-700"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>

          {expanded && (
            <div className="mt-4 rounded-md border border-amber-300 bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Details
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {(alert.reasons.length ? alert.reasons : ["Unusual pattern detected"]).map(
                  (reason) => (
                    <li key={`detail-${reason}`}>{reason}</li>
                  )
                )}
              </ul>
              <p className="mt-3 text-sm text-gray-700">
                Frequency pattern description: message activity appears unusually elevated over a
                short period and may indicate escalating contact behavior.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
            >
              Tell Me More
            </button>

            <button
              type="button"
              onClick={() => {
                setAlert(null);
                setExpanded(false);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Ignore
            </button>

            <button
              type="button"
              onClick={sendCheckIn}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Ask My Child First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
