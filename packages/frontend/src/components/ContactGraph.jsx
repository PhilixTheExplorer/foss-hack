import { useMemo, useState } from "react";

const WIDTH = 900;
const HEIGHT = 600;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = 215;

function getRiskColor(level) {
  if (level === "high") return "#ef4444";
  if (level === "medium") return "#f59e0b";
  return "#22c55e";
}

function getLineStyle(level) {
  if (level === "high") {
    return { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "7 6" };
  }

  if (level === "medium") {
    return { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "7 6" };
  }

  return { stroke: "#22c55e", strokeWidth: 5, strokeDasharray: undefined };
}

function getTopReasons(scoreResult) {
  if (!scoreResult?.reasons?.length) return ["No notable anomalies"];
  return scoreResult.reasons.slice(0, 2);
}

export default function ContactGraph({ contacts = [], scores = {}, reportedContacts = new Set() }) {
  const [selectedContactId, setSelectedContactId] = useState(null);

  const handleOutsideClick = (event) => {
    if (!selectedContactId) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-modal-interactive="true"]')) return;
    setSelectedContactId(null);
  };

  const positionedContacts = useMemo(() => {
    const count = contacts.length;
    if (!count) return [];

    return contacts.map((contact, index) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      const x = CENTER_X + RADIUS * Math.cos(angle);
      const y = CENTER_Y + RADIUS * Math.sin(angle);
      const scoreResult = scores[contact.id] ?? { score: 0, level: "safe", reasons: [] };
      const isReported = reportedContacts instanceof Set && reportedContacts.has(contact.id);

      return {
        contact,
        scoreResult,
        isReported,
        angle,
        x,
        y
      };
    });
  }, [contacts, scores, reportedContacts]);

  const selectedNode = positionedContacts.find((node) => node.contact.id === selectedContactId) ?? null;
  const infoNode = selectedNode;

  return (
    <div className="w-full" onClick={handleOutsideClick}>
      <div className="min-h-[400px] min-w-[500px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height="100%"
          role="img"
          aria-label="Contact relationship graph"
          preserveAspectRatio="xMidYMid meet"
        >
          {positionedContacts.map(({ contact, scoreResult, isReported, x, y }) => {
            const lineStyle = getLineStyle(scoreResult.level);
            const mutualDots = Math.min(Number(contact.mutualFriends ?? 0), 5);
            const dx = x - CENTER_X;
            const dy = y - CENTER_Y;

            return (
              <g key={contact.id}>
                <line
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={x}
                  y2={y}
                  stroke={lineStyle.stroke}
                  strokeWidth={lineStyle.strokeWidth}
                  strokeDasharray={lineStyle.strokeDasharray}
                  strokeLinecap="round"
                  opacity="0.95"
                />

                {scoreResult.level === "safe" && mutualDots > 0 &&
                  Array.from({ length: mutualDots }).map((_, index) => {
                    const t = (index + 1) / (mutualDots + 1);
                    return (
                      <circle
                        key={`${contact.id}-mf-${index}`}
                        cx={CENTER_X + dx * t}
                        cy={CENTER_Y + dy * t}
                        r="4"
                        fill="#9ca3af"
                      />
                    );
                  })}

                <g
                  data-modal-interactive="true"
                  onClick={() => setSelectedContactId((current) => (current === contact.id ? null : contact.id))}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={x} cy={y} r="31" fill={isReported ? "#9ca3af" : getRiskColor(scoreResult.level)} />
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize="13"
                    fill="#ffffff"
                    fontWeight="700"
                  >
                    {isReported ? "✓" : contact.name[0]}
                  </text>
                </g>
              </g>
            );
          })}

          <g>
            <circle cx={CENTER_X} cy={CENTER_Y} r="52" fill="#3b82f6" />
            <text
              x={CENTER_X}
              y={CENTER_Y + 7}
              textAnchor="middle"
              fontSize="24"
              fill="#ffffff"
              fontWeight="700"
            >
              You
            </text>
          </g>

          {infoNode && (
            <g data-modal-interactive="true">
              <rect
                x={Math.min(Math.max(infoNode.x + 16, 18), WIDTH - 320)}
                y={Math.min(Math.max(infoNode.y - 95, 18), HEIGHT - 170)}
                width="300"
                height="150"
                rx="10"
                fill="#111827"
                opacity="0.95"
              />
              <text
                x={Math.min(Math.max(infoNode.x + 30, 32), WIDTH - 305)}
                y={Math.min(Math.max(infoNode.y - 70, 40), HEIGHT - 130)}
                fill="#f9fafb"
                fontSize="14"
                fontWeight="700"
              >
                {infoNode.contact.name}
              </text>
              <text
                x={Math.min(Math.max(infoNode.x + 30, 32), WIDTH - 305)}
                y={Math.min(Math.max(infoNode.y - 49, 62), HEIGHT - 108)}
                fill="#d1d5db"
                fontSize="12"
              >
                Score: {infoNode.scoreResult.score ?? 0}
              </text>
              <text
                x={Math.min(Math.max(infoNode.x + 30, 32), WIDTH - 305)}
                y={Math.min(Math.max(infoNode.y - 31, 80), HEIGHT - 90)}
                fill="#d1d5db"
                fontSize="12"
              >
                Mutual friends: {Number(infoNode.contact.mutualFriends ?? 0)}
              </text>
              <text
                x={Math.min(Math.max(infoNode.x + 30, 32), WIDTH - 305)}
                y={Math.min(Math.max(infoNode.y - 13, 98), HEIGHT - 72)}
                fill="#d1d5db"
                fontSize="12"
              >
                Account age: {Number(infoNode.contact.accountAge ?? 0)} days
              </text>
              {getTopReasons(infoNode.scoreResult).map((reason, index) => (
                <text
                  key={`${infoNode.contact.id}-reason-${index}`}
                  x={Math.min(Math.max(infoNode.x + 30, 32), WIDTH - 305)}
                  y={Math.min(
                    Math.max(infoNode.y + 8 + index * 18, 118),
                    HEIGHT - 44 + index * 18
                  )}
                  fill="#d1d5db"
                  fontSize="12"
                >
                  • {reason}
                </text>
              ))}
              {selectedNode && (
                <text
                  x={Math.min(Math.max(infoNode.x + 270, 36), WIDTH - 48)}
                  y={Math.min(Math.max(infoNode.y - 72, 42), HEIGHT - 134)}
                  fill="#f9fafb"
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="end"
                >
                  Click node to close
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
        <span>🟢 Safe contact</span>
        <span>🟡 Unusual pattern</span>
        <span>🔴 High risk — report recommended</span>
        <span>✓ Reported anonymously</span>
      </div>
    </div>
  );
}
