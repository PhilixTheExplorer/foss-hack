const LATE_NIGHT_START = 22;
const LATE_NIGHT_END = 4;

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diffToMonday = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().slice(0, 10);
}

function isLateNight(time) {
  if (typeof time !== "string") return false;
  const [hourValue] = time.split(":");
  const hour = Number.parseInt(hourValue, 10);
  if (Number.isNaN(hour)) return false;
  return hour >= LATE_NIGHT_START || hour < LATE_NIGHT_END;
}

function getLevel(score) {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "safe";
}

export default function scoreContact(contact) {
  const reasons = [];
  let score = 0;

  const mutualFriends = Number(contact?.mutualFriends ?? 0);
  const accountAge = Number(contact?.accountAge ?? 0);
  const messages = Array.isArray(contact?.messages) ? contact.messages : [];
  const messageCount = messages.length;

  if (mutualFriends === 0) {
    score += 30;
    reasons.push("No mutual friends");
  } else if (mutualFriends >= 1 && mutualFriends <= 3) {
    score += 10;
    reasons.push("Very few mutual friends (1-3)");
  } else if (mutualFriends >= 5) {
    score -= 30;
    reasons.push("Has 5+ mutual friends");
  }

  if (accountAge < 30) {
    score += 25;
    reasons.push("Account is newer than 30 days");
  } else if (accountAge <= 90) {
    score += 10;
    reasons.push("Account age is between 30 and 90 days");
  }

  if (accountAge > 365) {
    score -= 25;
    reasons.push("Account is older than 1 year");
  }

  if (messageCount > 0) {
    const lateNightCount = messages.reduce((count, message) => {
      return count + (isLateNight(message?.time) ? 1 : 0);
    }, 0);
    const lateNightRatio = lateNightCount / messageCount;

    if (lateNightRatio >= 0.6) {
      score += 20;
      reasons.push("Mostly active late at night (>=60% between 22:00-04:00)");
    } else if (lateNightRatio >= 0.4) {
      score += 15;
      reasons.push("Active mostly late at night (22:00-04:00)");
    } else if (lateNightRatio >= 0.25) {
      score += 8;
      reasons.push("Notable late-night activity (>=25% between 22:00-04:00)");
    }

    const weekBuckets = new Map();
    for (const message of messages) {
      const date = toDate(message?.date);
      if (!date) continue;
      const weekKey = getWeekStart(date);
      weekBuckets.set(weekKey, (weekBuckets.get(weekKey) ?? 0) + 1);
    }

    const weekCounts = [...weekBuckets.entries()]
      .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
      .map(([, count]) => count);

    let maxEscalationRate = 0;
    for (let i = 1; i < weekCounts.length; i += 1) {
      if (weekCounts[i - 1] > 0) {
        const escalationRate = (weekCounts[i] - weekCounts[i - 1]) / weekCounts[i - 1];
        if (escalationRate > maxEscalationRate) {
          maxEscalationRate = escalationRate;
        }
      }
    }

    if (maxEscalationRate >= 1) {
      score += 20;
      reasons.push("Message frequency doubled week over week");
    } else if (maxEscalationRate >= 0.5) {
      score += 12;
      reasons.push("Message frequency increased significantly week over week");
    } else if (maxEscalationRate >= 0.25) {
      score += 6;
      reasons.push("Message frequency is trending upward week over week");
    }
  }

  const normalizedScore = Math.max(0, score);

  return {
    score: normalizedScore,
    level: getLevel(normalizedScore),
    reasons
  };
}

export function scoreAll(contacts) {
  const list = Array.isArray(contacts) ? contacts : [];
  return list.reduce((result, contact) => {
    if (!contact?.id) return result;
    result[contact.id] = scoreContact(contact);
    return result;
  }, {});
}
