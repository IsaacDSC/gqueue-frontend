import React from "react";
import Router, { Route } from "./components/Router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ServerConfig from "./pages/ServerConfig";
import PublisherDashboard from "./pages/PublisherDashboard";
import RegisteredEvents from "./pages/RegisteredEvents";

const routes: Route[] = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/config",
    component: ServerConfig,
  },
  {
    path: "/dashboard",
    component: Dashboard,
  },
  {
    path: "/metrics",
    component: PublisherDashboard,
  },
  {
    path: "/events",
    component: RegisteredEvents,
  },
];

function App(): React.JSX.Element {
  return (
    <div className="min-h-screen">
      <Router routes={routes} />
    </div>
  );
}

export default App;
