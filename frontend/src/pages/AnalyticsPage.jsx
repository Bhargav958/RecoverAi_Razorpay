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
  CheckCircle2,
  PieChart as PieIcon,
  Activity,
  Layers
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
  AreaChart,
  Area
} from "recharts";

import {
  getAnalytics
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

const FUNNEL_COLORS = [
  "#ef4444", // At Risk (Rose/Red)
  "#f59e0b", // Recoverable (Amber)
  "#3b82f6", // Targeted (Blue)
  "#10b981"  // Recovered (Emerald)
];

const OUTCOME_COLORS = {
  Recovered: "#10b981",
  Active: "#6366f1",
  Closed: "#64748b"
};

const ROOT_CAUSE_PALETTE = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#14b8a6"  // Teal
];

const customTooltipStyle = {
  backgroundColor: "#0f172a",
  borderColor: "#334155",
  borderRadius: "12px",
  color: "#f8fafc",
  fontSize: "12px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
};

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAnalytics();
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
    if (!data?.rootCauses) {
      return [];
    }

    return data.rootCauses.map((item, index) => ({
      name: formatRootCause(item._id),
      cases: item.cases,
      revenue: item.revenueAtRisk,
      recovered: item.recoveredAmount,
      color: ROOT_CAUSE_PALETTE[index % ROOT_CAUSE_PALETTE.length]
    }));
  }, [data]);

  const funnelData = useMemo(() => {
    if (!data?.metrics) {
      return [];
    }

    return [
      {
        name: "At Risk",
        value: data.metrics.revenueAtRisk,
        fill: FUNNEL_COLORS[0]
      },
      {
        name: "Recoverable",
        value: data.metrics.recoverableRevenue,
        fill: FUNNEL_COLORS[1]
      },
      {
        name: "Targeted",
        value: data.metrics.targetedRevenue,
        fill: FUNNEL_COLORS[2]
      },
      {
        name: "Recovered",
        value: data.metrics.recoveredRevenue,
        fill: FUNNEL_COLORS[3]
      }
    ];
  }, [data]);

  const outcomeData = useMemo(() => {
    if (!data?.metrics) {
      return [];
    }

    const recovered = data.metrics.recoveredCaseCount || 0;
    const total = data.metrics.caseCount || 0;
    const active = data.metrics.activeCases || 0;
    const inactive = Math.max(total - active - recovered, 0);

    return [
      {
        name: "Recovered",
        value: recovered,
        color: OUTCOME_COLORS.Recovered
      },
      {
        name: "Active",
        value: active,
        color: OUTCOME_COLORS.Active
      },
      {
        name: "Closed",
        value: inactive,
        color: OUTCOME_COLORS.Closed
      }
    ].filter((item) => item.value > 0);
  }, [data]);

  const trendData = useMemo(() => {
    if (!data?.trend || data.trend.length === 0) {
      return [];
    }

    return data.trend.map((item) => ({
      date: item._id,
      recovered: item.recoveredAmount,
      recoveredCases: item.recoveredCases,
      totalCases: item.cases
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin text-emerald-400" />
          Loading analytics...
        </div>
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

  const metrics = data.metrics;

  const recoveredVsRisk =
    metrics.revenueAtRisk > 0
      ? ((metrics.recoveredRevenue / metrics.revenueAtRisk) * 100).toFixed(2)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-400">
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Revenue at Risk</p>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
              <IndianRupee size={17} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">
            {formatINR(metrics.revenueAtRisk)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Unrecovered pipeline volume</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Expected Recovery</p>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Target size={17} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-amber-400">
            {formatINR(metrics.recoverableRevenue)}
          </p>
          <p className="mt-2 text-xs text-slate-500">AI probability-weighted sum</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Recovered Revenue</p>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <TrendingUp size={17} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-emerald-400">
            {formatINR(metrics.recoveredRevenue)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Verified settled funds</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Recovery Rate</p>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <BarChart3 size={17} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-blue-400">
            {metrics.recoveryRate}%
          </p>
          <p className="mt-2 text-xs text-slate-500">Recovered / targeted revenue</p>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Case Recovery Rate</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {metrics.caseRecoveryRate || 0}%
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {metrics.recoveredCaseCount || 0} of {metrics.caseCount || 0} cases recovered
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Most Common Cause</p>
          <p className="mt-3 text-lg font-semibold text-slate-200">
            {formatRootCause(data.insights?.mostCommonRootCause?._id)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {data.insights?.mostCommonRootCause?.cases || 0} cases identified
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Best Performing Action</p>
          <p className="mt-3 text-lg font-semibold text-slate-200">
            {formatRootCause(data.insights?.bestAction?._id)}
          </p>
          <p className="mt-2 text-xs font-medium text-emerald-400">
            {formatINR(data.insights?.bestAction?.recoveredAmount)} recovered
          </p>
        </div>
      </div>

      {/* Funnel + Outcomes */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Funnel */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Revenue Recovery Funnel</h2>
              <p className="mt-1 text-sm text-slate-500">
                How at-risk revenue moves through the RecoverAI pipeline.
              </p>
            </div>
            <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
              <Layers size={18} />
            </div>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 20,
                  bottom: 10
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [formatINR(value), "Amount"]}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Donut */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Case Outcomes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current recovery case distribution.
              </p>
            </div>
            <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
              <PieIcon size={18} />
            </div>
          </div>

          <div className="mt-6 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`outcome-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [`${value} cases`, "Count"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 pt-2">
            {outcomeData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Root Causes Horizontal Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-lg font-semibold">Revenue Leakage by Root Cause</h2>
          <p className="mt-1 text-sm text-slate-500">
            Failure categories contributing to merchant revenue risk.
          </p>
        </div>

        <div className="mt-6 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rootCauseData}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 30,
                bottom: 10
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={190}
                tick={{ fill: "#cbd5e1", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(value) => [formatINR(value), "Revenue at Risk"]}
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {rootCauseData.map((entry, index) => (
                  <Cell key={`root-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Area Chart (if trend exists) */}
      {trendData.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recovery Timeline & Velocity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Daily recovered revenue trend.
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Activity size={18} />
            </div>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 10
                }}
              >
                <defs>
                  <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [formatINR(value), "Recovered"]}
                />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#recoveredGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Intervention Performance Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-lg font-semibold">Intervention Performance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recovery action outcomes based on actual worker results.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-175 text-left">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 font-medium">Action</th>
                <th className="py-3 font-medium">Attempts</th>
                <th className="py-3 font-medium">Succeeded</th>
                <th className="py-3 text-right font-medium">Recovered</th>
              </tr>
            </thead>
            <tbody>
              {(data.actionPerformance || []).length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 text-center text-sm text-slate-500"
                  >
                    No recovery actions have completed yet.
                  </td>
                </tr>
              ) : (
                data.actionPerformance.map((item) => (
                  <tr key={item._id} className="border-b border-slate-800/70">
                    <td className="py-4 text-sm font-medium text-slate-200">
                      {formatRootCause(item._id)}
                    </td>
                    <td className="py-4 text-sm text-slate-400">
                      {item.attempts}
                    </td>
                    <td className="py-4 text-sm text-slate-400">
                      {item.succeeded}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-emerald-400">
                      {formatINR(item.recoveredAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <p className="font-medium">Revenue Recovered</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            RecoverAI has recovered{" "}
            <span className="font-semibold text-emerald-400">
              {formatINR(metrics.recoveredRevenue)}
            </span>{" "}
            from the current recovery workload.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <p className="font-medium">Remaining Opportunity</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Estimated recoverable revenue remaining is{" "}
            <span className="font-semibold text-amber-400">
              {formatINR(metrics.recoverableRevenue)}
            </span>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <TrendingUp size={18} />
            </div>
            <p className="font-medium">Overall Penetration</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Recovered revenue currently represents{" "}
            <span className="font-semibold text-blue-400">
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
