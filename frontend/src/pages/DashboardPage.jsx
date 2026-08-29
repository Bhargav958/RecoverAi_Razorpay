import {
  useEffect,
  useState
} from "react";

import {
  IndianRupee,
  Target,
  CircleDollarSign,
  Activity,
  Play,
  RefreshCw,
  Bot,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

import {
  getDashboardSummary,
  runSimulation,
  getAgentActivity
} from "../services/api.js";

const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatText = (value) => {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getRiskLabel = (score) => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
};

const KPI = ({
  label,
  value,
  icon: Icon,
  accent = false
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-500">
          {label}
        </p>

        <div
          className={`rounded-lg p-2 ${
            accent
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          <Icon size={17} />
        </div>

      </div>

      <p
        className={`mt-4 text-2xl font-semibold ${
          accent
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  );
};

const StatusBadge = ({
  status
}) => {
  let classes =
    "border-slate-700 bg-slate-800 text-slate-300";

  if (status === "RECOVERED") {
    classes =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (
    status === "PENDING_ACTION" ||
    status === "ACTION_SELECTED"
  ) {
    classes =
      "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  if (
    status === "FAILED" ||
    status === "STOPPED"
  ) {
    classes =
      "border-red-500/20 bg-red-500/10 text-red-400";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${classes}`}
    >
      {formatText(status)}
    </span>
  );
};

const DashboardPage = () => {
  const [data, setData] =
    useState(null);

  const [activity, setActivity] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [runningBatch, setRunningBatch] =
    useState(null);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load dashboard + agent activity
  |--------------------------------------------------------------------------
  */

  const loadData = async (
    showLoader = false
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const [
        dashboardResponse,
        activityResponse
      ] = await Promise.all([
        getDashboardSummary(),
        getAgentActivity(8)
      ]);

      setData(
        dashboardResponse.data
      );

      setActivity(
        activityResponse.data?.activity || []
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);

    /*
     * Lightweight polling.
     */

    const interval =
      setInterval(
        () => loadData(false),
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Run simulation
  |--------------------------------------------------------------------------
  */

  const handleSimulation = async (
    batchSize
  ) => {
    try {
      setRunningBatch(
        batchSize
      );

      setError("");

      await runSimulation({
        batchSize,
        mode: "SIMULATION"
      });

      /*
       * Immediately refresh after batch completion.
       */

      await loadData(false);

    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setRunningBatch(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading RecoverAI...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-red-300">
        Unable to load dashboard.
      </div>
    );
  }

  const metrics =
    data.metrics;

  /*
  |--------------------------------------------------------------------------
  | Recovery penetration
  |--------------------------------------------------------------------------
  */

  const recoveryPenetration =
    metrics.revenueAtRisk > 0
      ? (
          (metrics.recoveredRevenue /
            (
              metrics.revenueAtRisk +
              metrics.recoveredRevenue
            )) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <p className="text-sm text-slate-500">
            Revenue Recovery Command Center
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {data.merchant?.businessName ||
              "Acme SaaS"}
          </h1>

          <p className="mt-2 text-slate-400">
            Recover revenue before it slips away.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">

            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            Agent Active

          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-500">
            Simulation Mode
          </div>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPIs */}
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
          accent
        />

        <KPI
          label="Recovery Rate"
          value={`${metrics.recoveryRate}%`}
          icon={Activity}
        />

      </div>

      {/* Recovery impact + controls */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Impact */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Overall Recovery
              </p>

              <p className="mt-1 text-xl font-semibold">
                {recoveryPenetration}%
              </p>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CircleDollarSign size={18} />
            </div>

          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">

            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{
                width: `${Math.min(
                  Number(recoveryPenetration),
                  100
                )}%`
              }}
            />

          </div>

          <div className="mt-4 flex justify-between text-xs">

            <span className="text-slate-600">
              Revenue remaining at risk
            </span>

            <span className="text-slate-400">
              {formatINR(
                metrics.revenueAtRisk
              )}
            </span>

          </div>

        </div>

        {/* Case counts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <p className="text-sm text-slate-500">
            Recovery Workload
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">

            <div className="rounded-xl bg-slate-950 p-4 text-center">

              <p className="text-2xl font-semibold">
                {metrics.activeCases}
              </p>

              <p className="mt-1 text-[11px] text-slate-600">
                Active
              </p>

            </div>

            <div className="rounded-xl bg-slate-950 p-4 text-center">

              <p className="text-2xl font-semibold">
                {metrics.recoveredCaseCount}
              </p>

              <p className="mt-1 text-[11px] text-slate-600">
                Recovered
              </p>

            </div>

            <div className="rounded-xl bg-slate-950 p-4 text-center">

              <p className="text-2xl font-semibold">
                {metrics.caseCount}
              </p>

              <p className="mt-1 text-[11px] text-slate-600">
                Total
              </p>

            </div>

          </div>

        </div>

        {/* Simulation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <Bot size={18} />
            </div>

            <div>

              <p className="font-medium">
                Run Agent Simulation
              </p>

              <p className="text-xs text-slate-600">
                Process fresh recovery cases
              </p>

            </div>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">

            {[10, 25, 50].map(
              (size) => (
                <button
                  key={size}
                  disabled={
                    runningBatch !== null
                  }
                  onClick={() =>
                    handleSimulation(
                      size
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                >
                  {runningBatch === size
                    ? "Running..."
                    : `Run ${size}`}
                </button>
              )
            )}

          </div>

          <p className="mt-4 text-[11px] leading-5 text-slate-600">
            Simulation processes actual recovery cases through
            the RecoverAI decision pipeline.
          </p>

        </div>

      </div>

      {/* Pipeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div>
          <h2 className="text-lg font-semibold">
            Recovery Pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            How RecoverAI turns a failed payment into a verified recovery.
          </p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-6">

          {[
            ["01", "Detect", "Payment failure identified"],
            ["02", "Risk", "Revenue opportunity scored"],
            ["03", "AI", "Root cause diagnosed"],
            ["04", "Policy", "Action bounded by rules"],
            ["05", "Act", "Recovery action executed"],
            ["06", "Verify", "Money recovered or stopped"]
          ].map(
            ([number, title, description]) => (
              <div
                key={number}
                className="relative rounded-xl border border-slate-800 bg-slate-950 p-4"
              >

                <p className="text-[10px] tracking-widest text-slate-700">
                  {number}
                </p>

                <p className="mt-2 text-sm font-medium">
                  {title}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {description}
                </p>

              </div>
            )
          )}

        </div>

      </div>

      {/* Main lower section */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Cases */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 xl:col-span-3">

          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

            <div>
              <h2 className="font-semibold">
                Priority Recovery Cases
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Highest-value opportunities first.
              </p>
            </div>

            <a
              href="/command-center"
              className="text-xs text-slate-500 hover:text-white"
            >
              View all
            </a>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-175">

              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-600">

                  <th className="px-6 py-4 font-medium">
                    Customer
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Amount
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Risk
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Recovery
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4" />

                </tr>
              </thead>

              <tbody>

                {data.recentCases.map(
                  (item) => (
                    <tr
                      key={item._id}
                      className="border-b border-slate-800/70 transition hover:bg-slate-800/20"
                    >

                      <td className="px-6 py-4">

                        <p className="text-sm font-medium">
                          {item.customerId?.name ||
                            "Unknown"}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {formatText(
                            item.rootCause
                          )}
                        </p>

                      </td>

                      <td className="px-4 py-4 text-sm">
                        {formatINR(
                          item.amountAtRisk
                        )}
                      </td>

                      <td className="px-4 py-4">

                        <p className="text-sm">
                          {item.riskScore}/100
                        </p>

                        <p className="mt-1 text-[11px] text-slate-600">
                          {getRiskLabel(
                            item.riskScore
                          )}
                        </p>

                      </td>

                      <td className="px-4 py-4 text-sm">
                        {item.recoveryProbability}%
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td className="px-6 py-4 text-right">

                        <a
                          href={`/recovery-cases/${item._id}`}
                          className="inline-flex rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"
                        >
                          <ChevronRight
                            size={14}
                          />
                        </a>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* Agent */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

            <div>
              <h2 className="font-semibold">
                Live Agent Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Most recent recovery decisions.
              </p>
            </div>

            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <Bot size={17} />
            </div>

          </div>

          <div className="divide-y divide-slate-800">

            {activity.length === 0 ? (
              <div className="p-6 text-sm text-slate-600">
                No agent activity yet.
              </div>
            ) : (
              activity.slice(0, 8).map(
                (item, index) => (
                  <div
                    key={
                      item._id ||
                      index
                    }
                    className="flex gap-3 px-6 py-4"
                  >

                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950">
                      {item.eventType?.includes(
                        "RECOVERED"
                      ) ? (
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400"
                        />
                      ) : item.eventType?.includes(
                          "AI"
                        ) ? (
                        <Bot
                          size={14}
                          className="text-violet-400"
                        />
                      ) : item.eventType?.includes(
                          "FAILED"
                        ) ? (
                        <AlertTriangle
                          size={14}
                          className="text-red-400"
                        />
                      ) : (
                        <Clock3
                          size={14}
                          className="text-slate-400"
                        />
                      )}
                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-medium">
                        {formatText(
                          item.eventType
                        )}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-700">
                        {item.timestamp
                          ? new Date(
                              item.timestamp
                            ).toLocaleTimeString()
                          : "—"}
                      </p>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardPage;