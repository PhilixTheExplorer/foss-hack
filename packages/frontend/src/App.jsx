import ChatApp from "./ChatApp";
import VPNComparison from "./components/VPNComparison";
import ParentDashboard from "./ParentDashboard";

function App() {
  const path = window.location.pathname;

  if (path === "/parent") {
    return <ParentDashboard />;
  }

  if (path === "/privacy") {
    return <VPNComparison />;
  }

  return <ChatApp />;
}

export default App;