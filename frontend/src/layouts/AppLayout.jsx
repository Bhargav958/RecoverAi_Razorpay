import {
  LayoutDashboard,
  ShieldAlert,
  ListChecks,
  Users,
  CreditCard,
  Bot,
  BarChart3,
  SlidersHorizontal,
  FileClock,
  Settings,
  Zap,
  FlaskConical
} from "lucide-react";

import {
  NavLink,
  Outlet
} from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    label: "Revenue Risk",
    path: "/revenue-risk",
    icon: ShieldAlert
  },
  {
    label: "Command Center",
    path: "/command-center",
    icon: ListChecks
  },
  {
    label: "Simulation Lab",
    path: "/simulation",
    icon: FlaskConical
  },
  {
    label: "Customers",
    path: "/customers",
    icon: Users
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CreditCard
  },
  {
    label: "Agent Activity",
    path: "/agent-activity",
    icon: Bot
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3
  },
  {
    label: "Policies",
    path: "/policies",
    icon: SlidersHorizontal
  },
  {
    label: "Audit Trail",
    path: "/audit",
    icon: FileClock
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings
  }
];

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950">

          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950">
              <Zap size={18} />
            </div>

            <div>
              <h1 className="text-lg font-semibold">
                RecoverAI
              </h1>

              <p className="text-xs text-slate-500">
                Revenue Recovery
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 p-4">
            {navigation.map(
              ({
                label,
                path,
                icon: Icon
              }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              )
            )}
          </nav>

          {/* Mode */}
          <div className="mx-4 mt-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500">
              Environment
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-sm">
                Simulation Mode
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden">

          {/* Header */}
          <header className="flex h-20 items-center justify-between border-b border-slate-800 px-8">

            <div>
              <p className="text-sm text-slate-500">
                Merchant
              </p>

              <p className="font-medium">
                Acme SaaS
              </p>
            </div>

            <div className="flex items-center gap-4">

              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                SIMULATION
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm">
                A
              </div>
            </div>
          </header>

          {/* Page */}
          <div className="p-8">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
};

export default AppLayout;