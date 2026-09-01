import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";

import CommandCenterPage from "./pages/CommandCenterPage.jsx";

import RecoveryCaseDetailPage from "./pages/RecoveryCaseDetailPage.jsx";

import SimulationPage from "./pages/SimulationPage.jsx";

import AgentActivityPage from "./pages/AgentActivityPage.jsx";

import AnalyticsPage from "./pages/AnalyticsPage.jsx";

import PoliciesPage from "./pages/PoliciesPage.jsx";

import AuditPage from "./pages/AuditPage.jsx";

import SettingsPage from "./pages/SettingsPage.jsx";

import CustomersPage from "./pages/CustomersPage.jsx";

import CustomerDetailPage from "./pages/CustomerDetailPage.jsx";

import PaymentsPage from "./pages/PaymentsPage.jsx";

import PaymentDetailPage from "./pages/PaymentDetailPage.jsx";

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
              <Navigate to="/analytics" replace />
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
              <CustomersPage />
            }
          />

          <Route
            path="/customers/:id"
            element={
              <CustomerDetailPage />
            }
          />

          <Route
            path="/payments"
            element={
              <PaymentsPage />
            }
          />

          <Route
            path="/payments/:id"
            element={
              <PaymentDetailPage />
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
              <AnalyticsPage />
            }
          />

          <Route
            path="/policies"
            element={
              <PoliciesPage />
            }
          />

          <Route
            path="/audit"
            element={
              <AuditPage />
            }
          />

          <Route
            path="/settings"
            element={
              <SettingsPage />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
};

export default App;
