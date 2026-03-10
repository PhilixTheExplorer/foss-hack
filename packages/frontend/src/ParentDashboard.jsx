import { useEffect, useMemo, useState } from "react";

function clampScore(score) {
  const numeric = Number(score ?? 0);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function createAlertId(data) {
  const reasonKey = (Array.isArray(data?.reasons) ? data.reasons : []).join("|");
  return `${data?.type ?? "alert"}-${data?.contactName ?? "unknown"}-${data?.riskScore ?? 0}-${reasonKey}-${Date.now()}`;
}

function normalizeAlert(data) {
  if (!data?.contactName) return null;
  const messageType = data.type ?? "alert";
  if (messageType !== "alert" && messageType !== "report-submitted") return null;

  return {
    id: data.id ?? createAlertId(data),
    type: messageType,
    contactName: data.contactName,
    riskScore: data.riskScore ?? 0,
    reasons: Array.isArray(data.reasons) ? data.reasons : [],
    createdAt: data.createdAt ?? new Date().toISOString()
  };
}

function mergeIncomingAlerts(previousAlerts, incomingAlerts) {
  if (!incomingAlerts.length) return previousAlerts;

  const next = [...previousAlerts];
  for (const incoming of incomingAlerts) {
    const exists = next.some((item) => item.id === incoming.id);
    if (!exists) {
      next.unshift(incoming);
    }
  }

  return next;
}

export default function ParentDashboard({ initialAlerts = [] }) {
  const [alerts, setAlerts] = useState(() =>
    initialAlerts
      .map((alert, index) => normalizeAlert({ ...alert, id: alert?.id ?? `initial-${index}` }))
      .filter(Boolean)
  );
  const [activeAlertId, setActiveAlertId] = useState(() => {
    const firstAlert = initialAlerts[0];
    return firstAlert?.id ?? "initial-0";
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const normalized = initialAlerts
      .map((alert, index) => normalizeAlert({ ...alert, id: alert?.id ?? `initial-${index}` }))
      .filter(Boolean);
    if (!normalized.length) return;

    setAlerts((previous) => mergeIncomingAlerts(previous, normalized));
    setActiveAlertId((current) => current || normalized[0].id);
    setExpanded(false);
  }, [initialAlerts]);

  useEffect(() => {
    const parentChannel = new BroadcastChannel("safenest-parent");

    parentChannel.onmessage = (event) => {
      const data = event?.data;
      const normalized = normalizeAlert(data);
      if (!normalized) return;

      setAlerts((previous) => mergeIncomingAlerts(previous, [normalized]));
      setActiveAlertId(normalized.id);
      setExpanded(false);
    };

    return () => {
      parentChannel.close();
    };
  }, []);

  const activeAlert = alerts.find((item) => item.id === activeAlertId) ?? alerts[0] ?? null;

  const riskWidth = useMemo(
    () => `${clampScore(activeAlert?.riskScore)}%`,
    [activeAlert?.riskScore]
  );

  const sendCheckIn = () => {
    const teenChannel = new BroadcastChannel("safenest-teen");
    teenChannel.postMessage({ type: "parent-check-in" });
    teenChannel.close();
  };

  if (!activeAlert) {
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

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">SafeNest Parent Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;ll be notified if unusual patterns are detected.
        </p>

        <div
          className={`mt-8 rounded-lg p-5 ${
            activeAlert.type === "report-submitted"
              ? "border border-emerald-300 bg-emerald-100"
              : "border border-amber-300 bg-amber-100"
          }`}
        >
          {activeAlert.type === "report-submitted" ? (
            <>
              <h2 className="text-lg font-semibold text-emerald-900">
                ✅ Your child reported an unusual contact anonymously. No action needed.
              </h2>
              <p className="mt-2 text-sm text-emerald-900/90">
                Contact: {activeAlert.contactName}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-amber-900">
                ⚠️ Unusual Contact Pattern Detected
              </h2>
              <p className="mt-1 text-sm text-amber-900/90">
                An unusual contact pattern was detected on your child&apos;s account.
              </p>

              <div className="mt-4 space-y-3 text-sm text-gray-800">
                <p>
                  <span className="font-medium">Contact:</span> {activeAlert.contactName}
                </p>

                <div>
                  <p className="mb-1 font-medium">Risk score: {activeAlert.riskScore}</p>
                  <div className="h-2 w-full rounded-full bg-amber-200">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: riskWidth }} />
                  </div>
                </div>

                {activeAlert.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeAlert.reasons.map((reason) => (
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
                    {(
                      activeAlert.reasons.length
                        ? activeAlert.reasons
                        : ["Unusual pattern detected"]
                    ).map((reason) => (
                      <li key={`detail-${reason}`}>{reason}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-gray-700">
                    Frequency pattern description: message activity appears unusually elevated over
                    a short period and may indicate escalating contact behavior.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {activeAlert.type !== "report-submitted" && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
              >
                Tell Me More
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setAlerts((previous) => previous.filter((item) => item.id !== activeAlert.id));
                setActiveAlertId((current) => (current === activeAlert.id ? "" : current));
                setExpanded(false);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Dismiss This Alert
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

        {alerts.length > 1 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Alert History</h3>
              <span className="text-xs text-gray-500">{alerts.length} total</span>
            </div>

            <div className="mt-3 space-y-2">
              {alerts.map((item) => {
                const isActive = item.id === activeAlert.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveAlertId(item.id);
                      setExpanded(false);
                    }}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                        : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <p className="font-medium">{item.contactName}</p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {item.type === "report-submitted" ? "Report submitted" : `Risk ${item.riskScore}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
