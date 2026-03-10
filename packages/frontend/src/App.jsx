import ChatApp from "./ChatApp";
import ParentDashboard from "./ParentDashboard";

function App() {
  const path = window.location.pathname;

  if (path === "/parent") {
    return <ParentDashboard />;
  }

  return <ChatApp />;
}

export default App;