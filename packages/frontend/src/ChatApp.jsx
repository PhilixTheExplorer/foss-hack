import { useEffect, useMemo, useState } from "react";
import scoreContact from "./anomalyScorer";
import { scoreAll } from "./anomalyScorer";
import AnomalyBanner from "./components/AnomalyBanner";
import ReportFlow from "./components/ReportFlow";
import simulationData from "./simulationData";

const avatarColors = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500"
];

function getLastMessage(contact) {
  if (!contact?.messages?.length) {
    return null;
  }

  return contact.messages[contact.messages.length - 1];
}

function getAvatarColor(id) {
  const hash = id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return avatarColors[hash % avatarColors.length];
}

function getDefaultContactId(contacts) {
  const sarah = contacts.find((contact) => contact.name === "Sarah Chen");
  return sarah?.id ?? contacts[0]?.id ?? "";
}

function getLevelDotClass(level) {
  if (level === "high") return "bg-red-500";
  if (level === "medium") return "bg-yellow-400";
  return "bg-green-400";
}

function ContactRow({ contact, active, onClick, level = "safe" }) {
  const lastMessage = getLastMessage(contact);
  const avatarLetter = contact.name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-b border-emerald-800/40 px-4 py-3 text-left transition-colors ${
        active ? "bg-emerald-800/60" : "hover:bg-emerald-700/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(
            contact.id
          )}`}
        >
          {avatarLetter}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${getLevelDotClass(level)}`}
                aria-hidden="true"
              />
              <p className="truncate text-sm font-medium text-white">{contact.name}</p>
            </div>
            <span className="shrink-0 text-xs text-emerald-100">{lastMessage?.time ?? ""}</span>
          </div>

          <p className="truncate text-xs text-emerald-100/90">
            {lastMessage?.text ?? "No messages yet"}
          </p>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }) {
  const isOutgoing = message.direction === "out";

  return (
    <div className={`mb-2 flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[72%] rounded-lg px-3 py-2 shadow-sm ${
          isOutgoing ? "bg-[#DCF8C6]" : "bg-white"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{message.text}</p>
        <p className="mt-1 text-right text-[11px] text-gray-500">{message.time}</p>
      </div>
    </div>
  );
}

export default function ChatApp({ onContactReported, onParentAlert }) {
  const contacts = simulationData;
  const [activeContactId, setActiveContactId] = useState(() =>
    getDefaultContactId(contacts)
  );
  const [scoreResults, setScoreResults] = useState({});
  const [dismissedContacts, setDismissedContacts] = useState(() => new Set());
  const [reportedContacts, setReportedContacts] = useState(() => new Set());
  const [reportingContact, setReportingContact] = useState(null);
  const [showParentCheckIn, setShowParentCheckIn] = useState(false);

  useEffect(() => {
    setScoreResults(scoreAll(contacts));
  }, [contacts]);

  useEffect(() => {
    contacts.forEach((contact) => {
      console.log(contact.name, scoreContact(contact));
    });
  }, [contacts]);

  useEffect(() => {
    const teenChannel = new BroadcastChannel("safenest-teen");

    teenChannel.onmessage = (event) => {
      if (event?.data?.type === "parent-check-in") {
        setShowParentCheckIn(true);
      }
    };

    return () => {
      teenChannel.close();
    };
  }, []);

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId) ?? contacts[0],
    [activeContactId, contacts]
  );

  const activeScoreResult = scoreResults[activeContact?.id] ?? {
    score: 0,
    level: "safe",
    reasons: []
  };

  const shouldShowBanner =
    activeScoreResult.level !== "safe" && !dismissedContacts.has(activeContact?.id);

  const handleDismiss = () => {
    if (!activeContact?.id) return;

    if (activeScoreResult.level === "high") {
      const alertPayload = {
        type: "alert",
        contactName: activeContact.name,
        riskScore: activeScoreResult.score,
        reasons: activeScoreResult.reasons
      };

      const parentChannel = new BroadcastChannel("safenest-parent");
      parentChannel.postMessage(alertPayload);
      parentChannel.close();

      if (typeof onParentAlert === "function") {
        onParentAlert(alertPayload);
      }
    }

    setDismissedContacts((previous) => {
      const next = new Set(previous);
      next.add(activeContact.id);
      return next;
    });
  };

  const handleReport = () => {
    setReportingContact(activeContact ?? null);
  };

  const handleParentCheckInHelp = () => {
    setShowParentCheckIn(false);
    setReportingContact(activeContact ?? null);
  };

  const handleReportComplete = () => {
    if (!reportingContact?.id) {
      setReportingContact(null);
      return;
    }

    setReportedContacts((previous) => {
      const next = new Set(previous);
      next.add(reportingContact.id);
      return next;
    });

    if (typeof onContactReported === "function") {
      onContactReported(reportingContact.id);
    }

    const reportedScore = scoreResults[reportingContact.id] ?? {
      score: 0,
      reasons: []
    };

    const reportPayload = {
      type: "report-submitted",
      contactName: reportingContact.name,
      riskScore: reportedScore.score,
      reasons: reportedScore.reasons
    };

    const parentChannel = new BroadcastChannel("safenest-parent");
    parentChannel.postMessage(reportPayload);
    parentChannel.close();

    if (typeof onParentAlert === "function") {
      onParentAlert(reportPayload);
    }

    setReportingContact(null);
  };

  return (
    <div className="min-h-screen bg-[#e5ddd5] p-6">
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-sm border border-gray-200 bg-white shadow-lg">
        <aside className="flex h-full w-[30%] flex-col bg-[#075E54]">
          <div className="border-b border-emerald-800/50 px-5 py-4">
            <h1 className="text-xl font-semibold text-white">WhatsApp Demo UI</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                active={contact.id === activeContact?.id}
                level={scoreResults[contact.id]?.level ?? "safe"}
                onClick={() => setActiveContactId(contact.id)}
              />
            ))}
          </div>
        </aside>

        <section className="flex h-full w-[70%] flex-col bg-[#efeae2]">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{activeContact?.name}</h2>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </header>

          {shouldShowBanner && (
            <AnomalyBanner
              level={activeScoreResult.level}
              reasons={activeScoreResult.reasons}
              onDismiss={handleDismiss}
              onReport={handleReport}
            />
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeContact?.messages?.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          <div className="border-t border-gray-200 bg-[#f0f2f5] px-4 py-3">
            <input
              type="text"
              disabled
              placeholder="Type a message"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 outline-none"
            />
          </div>
        </section>
      </div>

      {showParentCheckIn && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Your parent noticed something. Are you okay?
            </h3>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowParentCheckIn(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                I&apos;m fine
              </button>
              <button
                type="button"
                onClick={handleParentCheckInHelp}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                I need help
              </button>
            </div>
          </div>
        </div>
      )}

      {reportingContact && (
        <ReportFlow
          contact={reportingContact}
          onCancel={() => setReportingContact(null)}
          onComplete={handleReportComplete}
        />
      )}
    </div>
  );
}
