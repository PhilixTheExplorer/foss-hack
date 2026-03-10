import { useEffect, useMemo, useState } from "react";
import scoreContact from "../anomalyScorer";

const LOADING_MS = 1500;

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
  );
}

export default function ReportFlow({ contact, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [serverLog, setServerLog] = useState(null);

  const scoreResult = useMemo(() => scoreContact(contact ?? {}), [contact]);
  const displayReasons = scoreResult.reasons?.length
    ? scoreResult.reasons
    : ["Unusual messaging pattern detected"];

  useEffect(() => {
    if (step !== 2 || !contact?.name) return;

    let cancelled = false;

    const runReport = async () => {
      const minDelay = new Promise((resolve) => setTimeout(resolve, LOADING_MS));

      const requestToken = fetch("http://localhost:3000/request-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).then((response) => response.json());

      const tokenResponse = await requestToken;
      const token = tokenResponse?.token;

      if (!token) {
        throw new Error("Missing token");
      }

      await fetch("http://localhost:3000/submit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          contactName: contact.name,
          riskScore: scoreResult.score,
          reasons: displayReasons
        })
      });

      await minDelay;

      const safeLog = {
        report: {
          contact: contact.name,
          riskScore: scoreResult.score
        },
        identity: null,
        ip: null,
        sessionId: null,
        timestamp: null
      };

      if (!cancelled) {
        setServerLog(safeLog);
        setStep(3);
      }
    };

    runReport().catch(async () => {
      await new Promise((resolve) => setTimeout(resolve, LOADING_MS));
      if (!cancelled) {
        const fallbackLog = {
          report: {
            contact: contact.name,
            riskScore: scoreResult.score
          },
          identity: null,
          ip: null,
          sessionId: null,
          timestamp: null
        };
        setServerLog(fallbackLog);
        setStep(3);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [step, contact, scoreResult.score, displayReasons]);

  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Report Anonymously</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              You&apos;re about to report {contact.name}. Your identity will not be shared with
              anyone — not with the platform, not with your parents.
            </p>

            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Risk reasons
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                {displayReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Send Anonymous Report
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <Spinner />
            <p className="mt-4 text-base font-medium text-gray-800">Securing your identity...</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-emerald-600">✅</span>
              <h2 className="text-2xl font-semibold text-gray-900">Report Sent</h2>
            </div>

            <p className="mt-3 text-sm text-gray-700">
              The platform has been notified. You are completely anonymous.
            </p>

            <pre className="mt-5 overflow-x-auto rounded-lg bg-[#0f172a] p-4 font-mono text-xs leading-5 text-green-400">
              {JSON.stringify(serverLog, null, 2)}
            </pre>

            <p className="mt-2 text-xs text-gray-500">
              This is what the server received. No trace of you.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onComplete}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
