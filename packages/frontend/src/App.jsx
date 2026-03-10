import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ChatApp from "./ChatApp";
import { scoreAll } from "./anomalyScorer";
import ContactGraph from "./components/ContactGraph";
import VPNComparison from "./components/VPNComparison";
import ParentDashboard from "./ParentDashboard";
import simulationData from "./simulationData";

function GraphPage({ contacts, scores, reportedContacts }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-gray-900">Risk Graph</h1>
        <p className="mt-1 text-sm text-gray-600">Contact relationships and anomaly levels</p>
        <div className="mt-5">
          <ContactGraph contacts={contacts} scores={scores} reportedContacts={reportedContacts} />
        </div>
      </div>
    </div>
  );
}

function TopNav() {
  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
      isActive ? "bg-white/20 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a2e] px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-lg font-semibold text-white">SafeNest</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={linkClass}>
            Teen View
          </NavLink>
          <NavLink to="/parent" className={linkClass}>
            Parent View
          </NavLink>
          <NavLink to="/graph" className={linkClass}>
            Risk Graph
          </NavLink>
          <NavLink to="/privacy" className={linkClass}>
            Privacy Layer
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const contacts = simulationData;
  const [scores, setScores] = useState({});
  const [reportedContacts, setReportedContacts] = useState(() => new Set());
  const [latestParentAlert, setLatestParentAlert] = useState(null);

  useEffect(() => {
    setScores(scoreAll(contacts));
  }, [contacts]);

  const graphScores = useMemo(() => {
    if (Object.keys(scores).length > 0) {
      return scores;
    }

    return scoreAll(contacts);
  }, [scores, contacts]);

  const handleContactReported = (contactId) => {
    if (!contactId) return;
    setReportedContacts((previous) => {
      const next = new Set(previous);
      next.add(contactId);
      return next;
    });
  };

  const handleParentAlert = (alertPayload) => {
    if (!alertPayload?.contactName) return;
    setLatestParentAlert(alertPayload);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <Routes>
        <Route
          path="/"
          element={
            <ChatApp
              onContactReported={handleContactReported}
              onParentAlert={handleParentAlert}
            />
          }
        />
        <Route path="/parent" element={<ParentDashboard initialAlert={latestParentAlert} />} />
        <Route
          path="/graph"
          element={
            <GraphPage
              contacts={contacts}
              scores={graphScores}
              reportedContacts={reportedContacts}
            />
          }
        />
        <Route path="/privacy" element={<VPNComparison />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;