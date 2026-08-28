import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  BarChart3,
  IndianRupee,
  Target,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

import {
  getDashboardSummary
} from "../services/api.js";

const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatRootCause = (value) => {
  if (!value) return "Unknown";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const AnalyticsPage = () => {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDashboardSummary();

      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rootCauseData = useMemo(() => {
    if (!data?.metrics?.rootCauseDistribution) {
      return [];
    }

    return data.metrics.rootCauseDistribution.map(
      (item) => ({
        name: formatRootCause(
          item._id
        ),
        cases: item.cases,
        revenue: item.revenueAtRisk
      })
    );
  }, [data]);

  const funnelData = useMemo(() => {
    if (!data?.metrics) {
      return [];
    }

    return [
      {
        name: "At Risk",
        value: data.metrics.revenueAtRisk
      },
      {
        name: "Recoverable",
        value: data.metrics.recoverableRevenue
      },
      {
        name: "Targeted",
        value: data.metrics.targetedRevenue
      },
      {
        name: "Recovered",
        value: data.metrics.recoveredRevenue
      }
    ];
  }, [data]);

  const outcomeData = useMemo(() => {
    if (!data?.metrics) {
      return [];
    }

    const recovered =
      data.metrics.recoveredCaseCount || 0;

    const total =
      data.metrics.caseCount || 0;

    const active =
      data.metrics.activeCases || 0;

    const inactive =
      Math.max(
        total - active - recovered,
        0
      );

    return [
      {
        name: "Recovered",
        value: recovered
      },
      {
        name: "Active",
        value: active
      },
      {
        name: "Closed",
        value: inactive
      }
    ].filter(
      (item) => item.value > 0
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-red-300">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics =
    data.metrics;

  const overallRecoveryShare =
    metrics.caseCount > 0
      ? (
          (metrics.recoveredCaseCount /
            metrics.caseCount) *
          100
        ).toFixed(1)
      : 0;

  const recoveredVsRisk =
    metrics.revenueAtRisk > 0
      ? (
          (metrics.recoveredRevenue /
            metrics.revenueAtRisk) *
          100
        ).toFixed(2)
      : 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Revenue Intelligence
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Recovery Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Understand where revenue is leaking and how effectively
            RecoverAI is bringing it back.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Revenue at Risk
            </p>

            <IndianRupee
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {formatINR(
              metrics.revenueAtRisk
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Expected Recovery
            </p>

            <Target
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {formatINR(
              metrics.recoverableRevenue
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Recovered Revenue
            </p>

            <TrendingUp
              size={18}
              className="text-emerald-400"
            />
          </div>

          <p className="mt-4 text-2xl font-semibold text-emerald-400">
            {formatINR(
              metrics.recoveredRevenue
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Recovery Rate
            </p>

            <BarChart3
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {metrics.recoveryRate}%
          </p>

          <p className="mt-2 text-xs text-slate-600">
            Based on targeted revenue
          </p>
        </div>

      </div>

      {/* Funnel + outcomes */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Funnel */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div>
            <h2 className="text-lg font-semibold">
              Revenue Recovery Funnel
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              How at-risk revenue moves through the RecoverAI pipeline.
            </p>
          </div>

          <div className="mt-6 h-80">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={funnelData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 10
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  strokeOpacity={0.1}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "currentColor",
                    fontSize: 12
                  }}
                />

                <YAxis
                  tick={{
                    fill: "currentColor",
                    fontSize: 11
                  }}

                  tickFormatter={( value ) =>
                    `₹${Math.round(
                      value / 1000
                    )}k`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatINR(value)
                  }
                />

                <Bar
                  dataKey="value"
                  fill="currentColor"
                  radius={[ 6, 6, 0, 0 ]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* Outcome */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold">
            Case Outcomes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current recovery case distribution.
          </p>

          <div className="mt-6 h-60">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {outcomeData.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill="currentColor"
                        opacity={
                          1 -
                          index *
                            0.22
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

          <div className="space-y-3">

            {outcomeData.map(
              (item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-500">
                    {item.name}
                  </span>

                  <span className="font-medium">
                    {item.value}
                  </span>
                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* Root causes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div>
          <h2 className="text-lg font-semibold">
            Revenue Leakage by Root Cause
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Failure categories contributing to merchant revenue risk.
          </p>
        </div>

        <div className="mt-6 h-85">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={rootCauseData}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 40,
                bottom: 10
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                strokeOpacity={0.1}
              />

              <XAxis
                type="number"
                tick={{
                  fill: "currentColor",
                  fontSize: 11
                }}
                tickFormatter={(value) =>
                  `₹${Math.round(
                    value / 1000
                  )}k`
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{
                  fill: "currentColor",
                  fontSize: 11
                }}
              />

              <Tooltip
                formatter={(value) =>
                  formatINR(value)
                }
              />

              <Bar
                dataKey="revenue"
                fill="currentColor"
                radius={[  0, 6,  6, 0  ]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* Insights */}
      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>

            <p className="font-medium">
              Revenue recovered
            </p>

          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            RecoverAI has recovered{" "}
            <span className="text-slate-300">
              {formatINR(
                metrics.recoveredRevenue
              )}
            </span>{" "}
            from the current recovery workload.
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <AlertTriangle size={18} />
            </div>

            <p className="font-medium">
              Remaining opportunity
            </p>

          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Estimated recoverable revenue remaining is{" "}
            <span className="text-slate-300">
              {formatINR(
                metrics.recoverableRevenue
              )}
            </span>
            .
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <TrendingUp size={18} />
            </div>

            <p className="font-medium">
              Overall penetration
            </p>

          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Recovered revenue currently represents{" "}
            <span className="text-slate-300">
              {recoveredVsRisk}%
            </span>{" "}
            of total revenue currently at risk.
          </p>

        </div>

      </div>

    </div>
  );
};

export default AnalyticsPage;