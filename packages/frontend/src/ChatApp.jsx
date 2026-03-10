import { useEffect, useMemo, useState } from "react";
import scoreAll from "./anomalyScorer";
import AnomalyBanner from "./components/AnomalyBanner";
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

export default function ChatApp() {
  const contacts = simulationData;
  const [activeContactId, setActiveContactId] = useState(() =>
    getDefaultContactId(contacts)
  );
  const [scoreResults, setScoreResults] = useState({});
  const [dismissedContacts, setDismissedContacts] = useState(() => new Set());
  const [reportingContact, setReportingContact] = useState(null);

  useEffect(() => {
    setScoreResults(scoreAll(contacts));
  }, [contacts]);

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
    setDismissedContacts((previous) => {
      const next = new Set(previous);
      next.add(activeContact.id);
      return next;
    });
  };

  const handleReport = () => {
    setReportingContact(activeContact ?? null);
  };

  return (
    <div className="min-h-screen bg-[#e5ddd5] p-6">
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-sm border border-gray-200 bg-white shadow-lg">
        <aside className="flex h-full w-[30%] flex-col bg-[#075E54]">
          <div className="border-b border-emerald-800/50 px-5 py-4">
            <h1 className="text-xl font-semibold text-white">SafeNest Demo</h1>
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

          {reportingContact && <div className="hidden" aria-hidden="true" />}

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
    </div>
  );
}
