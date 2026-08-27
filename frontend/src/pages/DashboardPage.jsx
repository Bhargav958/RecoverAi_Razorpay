import { useEffect, useState } from "react";

import {
  IndianRupee,
  Target,
  CircleDollarSign,
  Activity
} from "lucide-react";

import {
  getDashboardSummary
} from "../services/api.js";

const formatINR = (
  value
) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(value || 0);
};

const KPI = ({
  label,
  value,
  icon: Icon
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-400">
          {label}
        </p>

        <div className="rounded-lg bg-slate-800 p-2 text-slate-300">
          <Icon size={17} />
        </div>

      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight">
        {value}
      </p>

    </div>
  );
};

const DashboardPage = () => {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          const response =
            await getDashboardSummary();

          setData(
            response.data
          );
        } catch (err) {
          setError(
            err.message
          );
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Loading RecoverAI...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-red-300">
        {error}
      </div>
    );
  }

  const metrics =
    data.metrics;

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div>
        <p className="text-sm text-slate-500">
          Revenue Recovery Command Center
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Good morning, Acme SaaS
        </h1>

        <p className="mt-2 text-slate-400">
          Monitor revenue at risk and recoverable opportunities.
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <KPI
          label="Revenue at Risk"
          value={formatINR(
            metrics.revenueAtRisk
          )}
          icon={IndianRupee}
        />

        <KPI
          label="Recoverable Revenue"
          value={formatINR(
            metrics.recoverableRevenue
          )}
          icon={Target}
        />

        <KPI
          label="Revenue Recovered"
          value={formatINR(
            metrics.recoveredRevenue
          )}
          icon={CircleDollarSign}
        />

        <KPI
          label="Recovery Rate"
          value={`${metrics.recoveryRate}%`}
          icon={Activity}
        />

      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Active Recovery Cases
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {metrics.activeCases}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Total Cases
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {metrics.caseCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Recovered Cases
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {metrics.recoveredCaseCount}
          </p>
        </div>

      </div>

      {/* Root causes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div>
          <h2 className="text-lg font-semibold">
            Revenue Leakage by Root Cause
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Where your at-risk revenue is currently coming from.
          </p>
        </div>

        <div className="mt-6 space-y-4">

          {metrics.rootCauseDistribution.map(
            (item) => (
              <div
                key={item._id}
                className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {item._id
                      .replaceAll(
                        "_",
                        " "
                      )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.cases} cases
                  </p>
                </div>

                <p className="font-medium">
                  {formatINR(
                    item.revenueAtRisk
                  )}
                </p>
              </div>
            )
          )}

        </div>
      </div>

      {/* Recent cases */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div>
          <h2 className="text-lg font-semibold">
            Recent Recovery Cases
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Highest-priority cases flowing through RecoverAI.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-3 font-medium">
                  Customer
                </th>

                <th className="pb-3 font-medium">
                  Amount
                </th>

                <th className="pb-3 font-medium">
                  Risk
                </th>

                <th className="pb-3 font-medium">
                  Recovery
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {data.recentCases.map(
                (item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-800/70"
                  >
                    <td className="py-4">
                      {item.customerId?.name ||
                        "Unknown"}
                    </td>

                    <td>
                      {formatINR(
                        item.amountAtRisk
                      )}
                    </td>

                    <td>
                      {item.riskScore}/100
                    </td>

                    <td>
                      {item.recoveryProbability}%
                    </td>

                    <td>
                      {item.status}
                    </td>
                  </tr>
                )
              )}
            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
};

export default DashboardPage;