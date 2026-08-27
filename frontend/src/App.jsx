import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";

import CommandCenterPage from "./pages/CommandCenterPage.jsx";

import RecoveryCaseDetailPage from "./pages/RecoveryCaseDetailPage.jsx";

import SimulationPage from "./pages/SimulationPage.jsx";

import AgentActivityPage from "./pages/AgentActivityPage.jsx";


const Placeholder = ({title}) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-slate-500">
          RecoverAI
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          {title}
        </h1>

        <p className="mt-2 text-slate-500">
          This module is coming next.
        </p>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          element={<AppLayout />}
        >
          <Route
            path="/recovery-cases/:id"
            element={
              <RecoveryCaseDetailPage />
            }
          />

          <Route
            path="/simulation"
            element={
              <SimulationPage />
            }
          />

          <Route
            path="/"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/revenue-risk"
            element={
              <Placeholder title="Revenue Risk" />
            }
          />

          <Route
            path="/command-center"
            element={
              <CommandCenterPage />
            }
          />

          <Route
            path="/customers"
            element={
              <Placeholder title="Customers" />
            }
          />

          <Route
            path="/payments"
            element={
              <Placeholder title="Payments" />
            }
          />

          <Route
            path="/agent-activity"
            element={
              <AgentActivityPage />
            }
          />

          <Route
            path="/analytics"
            element={
              <Placeholder title="Analytics" />
            }
          />

          <Route
            path="/policies"
            element={
              <Placeholder title="Policies" />
            }
          />

          <Route
            path="/audit"
            element={
              <Placeholder title="Audit Trail" />
            }
          />

          <Route
            path="/settings"
            element={
              <Placeholder title="Settings" />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
};

export default App;