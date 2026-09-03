import {
  useEffect,
  useState
} from "react";

import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Bot,
  Activity,
  IndianRupee,
  RefreshCw
} from "lucide-react";

import {
  getDashboardSummary,
  runSimulation,
  runSimulationScenario
} from "../services/api.js";

const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const MetricCard = ({
  label,
  value,
  icon: Icon
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <div className="rounded-lg bg-slate-800 p-2 text-slate-300">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
};

const SimulationPage = () => {
  const [
    dashboard,
    setDashboard
  ] = useState(null);

  const [
    simulation,
    setSimulation
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    running,
    setRunning
  ] = useState(false);

  const [
    runningScenario,
    setRunningScenario
  ] = useState(null);

  const [
    error,
    setError
  ] = useState("");

  const scenarios = [
    {
      id: "GOLDEN_CASE",
      title: "Golden Case",
      description: "Amit Singh, temporary bank failure, expected retry recovery.",
      expected: "Moves to pending action, then recovers after worker execution."
    },
    {
      id: "TEMPORARY_BANK_FAILURE",
      title: "Temporary Bank Failure",
      description: "A transient issuer-side failure with high recoverability.",
      expected: "AI recommends retry within merchant policy."
    },
    {
      id: "EXPIRED_PAYMENT_METHOD",
      title: "Expired Payment Method",
      description: "Card expiry requiring a different recovery intervention.",
      expected: "AI diagnoses payment method issue."
    },
    {
      id: "INSUFFICIENT_FUNDS",
      title: "Insufficient Funds",
      description: "Customer lacks balance at payment time.",
      expected: "AI selects a lower-friction follow-up."
    },
    {
      id: "AUTHENTICATION_FAILURE",
      title: "Authentication Failure",
      description: "Payment failed during authentication.",
      expected: "AI identifies authentication failure."
    },
    {
      id: "GATEWAY_TIMEOUT",
      title: "Gateway Timeout",
      description: "Infrastructure timeout during payment processing.",
      expected: "AI recommends safe retry handling."
    },
    {
      id: "HIGH_VALUE_ESCALATION",
      title: "High Value Escalation",
      description: "A ₹50,000 failed payment above the merchant threshold.",
      expected: "Policy requires human approval before execution."
    }
  ];

  /*
  |--------------------------------------------------------------------------
  | Load dashboard metrics
  |--------------------------------------------------------------------------
  */

  const loadDashboard = async () => {
    try {
      const response =
        await getDashboardSummary();

      setDashboard(
        response.data
      );
    } catch (err) {
      setError(
        err.message
      );
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadDashboard();
      setLoading(false);
    };

    initialize();
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
      setRunning(true);
      setError("");

      const response =
        await runSimulation({
          batchSize,
          mode: "SIMULATION"
        });

      setSimulation(
        response.data
      );

      await loadDashboard();

    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setRunning(false);
    }
  };

  const handleScenario = async (
    scenario
  ) => {
    try {
      setRunningScenario(scenario);
      setError("");

      const response =
        await runSimulationScenario(
          scenario
        );

      setSimulation(
        response.data
      );

      await loadDashboard();
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setRunningScenario(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await loadDashboard();
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading Simulation Lab...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-red-300">
        Unable to load simulation data.
      </div>
    );
  }

  const metrics =
    dashboard.metrics;

  /*
  |--------------------------------------------------------------------------
  | Batch summary
  |--------------------------------------------------------------------------
  */

  const batchResult =
    {
      selected: 0,
      processed: 0,
      recovered: 0,
      recoveredAmount: 0,
      failed: 0,
      failedCases: 0,
      pending: 0,
      scheduled: 0,
      immediate: 0,
      ...simulation
    };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Agent Testing Environment
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Simulation Lab
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Run controlled recovery batches and measure the money
            RecoverAI actually brings back.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RotateCcw size={15} />
          Refresh
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Global metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          label="Revenue at Risk"
          value={formatINR(
            metrics.revenueAtRisk
          )}
          icon={IndianRupee}
        />

        <MetricCard
          label="Recoverable Revenue"
          value={formatINR(
            metrics.recoverableRevenue
          )}
          icon={Activity}
        />

        <MetricCard
          label="Revenue Recovered"
          value={formatINR(
            metrics.recoveredRevenue
          )}
          icon={CheckCircle2}
        />

        <MetricCard
          label="Active Cases"
          value={metrics.activeCases}
          icon={Clock3}
        />

      </div>

      {/* Scenario controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">
            Scenario Launcher
          </p>

          <h2 className="text-xl font-semibold">
            Run a Real Pipeline Scenario
          </h2>

          <p className="text-sm leading-6 text-slate-500">
            Each scenario creates a signed Razorpay-style failure
            and sends it through the existing webhook pipeline.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

          {scenarios.map(
            (scenario) => (
              <button
                key={scenario.id}
                disabled={
                  running ||
                  runningScenario !== null
                }
                onClick={() =>
                  handleScenario(
                    scenario.id
                  )
                }
                className="group rounded-xl border border-slate-700 bg-slate-950 p-5 text-left transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <div className="flex items-center justify-between">

                  <div>
                    <p className="font-semibold">
                      {scenario.title}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {scenario.description}
                    </p>

                    <p className="mt-3 text-[11px] leading-5 text-slate-600">
                      {scenario.expected}
                    </p>
                  </div>

                  <div className="rounded-full border border-slate-800 p-3 text-slate-400 group-hover:text-white">
                    {runningScenario ===
                    scenario.id ? (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Play size={16} />
                    )}
                  </div>

                </div>

              </button>
            )
          )}

        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-600">

          <div className="h-2 w-2 rounded-full bg-emerald-400" />

          Simulation mode only — no real customer communication
          or live payment execution.

        </div>

      </div>

      {/* Batch controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div>
          <p className="text-sm text-slate-500">
            Batch Run
          </p>
          <h2 className="text-xl font-semibold">
            Process Existing Detected Cases
          </h2>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[10, 25, 50].map((size) => (
            <button
              key={size}
              disabled={running}
              onClick={() =>
                handleSimulation(size)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-left transition hover:border-slate-500 hover:bg-slate-900 disabled:opacity-50"
            >
              <p className="text-2xl font-semibold">
                {size}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                recovery cases
              </p>
            </button>
          ))}
        </div>

      </div>

      {/* Latest batch */}
      {simulation && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Latest Batch
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Simulation Result
              </h2>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Selected
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {batchResult.selected}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Processed
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {batchResult.processed}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Recovered
              </p>

              <p className="mt-2 text-2xl font-semibold text-emerald-400">
                {batchResult.recovered}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Recovered Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold text-emerald-400">
                {formatINR(
                  batchResult.recoveredAmount
                )}
              </p>
            </div>

          </div>

          {/* High-Value Escalation Callout */}
          {simulation.recoveryCaseId &&
            (simulation.status === "ESCALATED" ||
              simulation.requiresHumanReview ||
              simulation.scenario === "HIGH_VALUE_ESCALATION") && (
              <div className="mt-5 flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300">
                        Status: ESCALATED
                      </span>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                        Human Review Required
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {simulation.policyReason ||
                        `This ₹${(simulation.amount || 50000).toLocaleString(
                          "en-IN"
                        )} payment exceeds the merchant autonomous limit (₹25,000). Policy Engine paused automatic recovery until a human approves.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = `/recovery-cases/${simulation.recoveryCaseId}`)
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-amber-300"
                >
                  Review & Approve Case →
                </button>
              </div>
            )}

          {/* Standard Scenario Case Link */}
          {simulation.recoveryCaseId &&
            simulation.status !== "ESCALATED" &&
            simulation.scenario !== "HIGH_VALUE_ESCALATION" && (
              <button
                type="button"
                onClick={() =>
                  (window.location.href = `/recovery-cases/${simulation.recoveryCaseId}`)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
              >
                Open resulting recovery case
                <Play size={13} />
              </button>
            )}

          {/* Secondary */}
          <div className="mt-4 grid gap-4 md:grid-cols-4">

            <div className="rounded-xl bg-slate-950/50 p-4">
              <p className="text-xs text-slate-600">
                Scheduled
              </p>

              <p className="mt-1 font-medium">
                {batchResult.scheduled}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/50 p-4">
              <p className="text-xs text-slate-600">
                Immediate
              </p>

              <p className="mt-1 font-medium">
                {batchResult.immediate}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/50 p-4">
              <p className="text-xs text-slate-600">
                Failed
              </p>

              <p className="mt-1 font-medium">
                {batchResult.failedCases}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/50 p-4">
              <p className="text-xs text-slate-600">
                Pending
              </p>

              <p className="mt-1 font-medium">
                {batchResult.pending}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Recovery impact */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Before / after */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold">
            Recovery Impact
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            How the latest batch changed merchant-level recovery.
          </p>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">

              <span className="text-sm text-slate-500">
                Current Revenue Recovered
              </span>

              <span className="font-medium text-emerald-400">
                {formatINR(
                  metrics.recoveredRevenue
                )}
              </span>

            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">

              <span className="text-sm text-slate-500">
                Recovery Rate
              </span>

              <span className="font-medium">
                {metrics.recoveryRate}%
              </span>

            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">

              <span className="text-sm text-slate-500">
                Active Cases Remaining
              </span>

              <span className="font-medium">
                {metrics.activeCases}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Total Cases
              </span>

              <span className="font-medium">
                {metrics.caseCount}
              </span>

            </div>

          </div>

        </div>

        {/* Explanation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <Bot size={18} />
            </div>

            <h2 className="text-lg font-semibold">
              What the Agent Did
            </h2>

          </div>

          <div className="mt-6 space-y-4">

            <div className="flex gap-3">
              <div className="mt-1">
                <CheckCircle2
                  size={15}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Risk analysis
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Each selected case was scored for risk,
                  recovery probability and expected recovery.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1">
                <CheckCircle2
                  size={15}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  AI diagnosis
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Gemini analyzed the failure context and
                  selected a bounded recovery intervention.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1">
                <CheckCircle2
                  size={15}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Policy enforcement
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Merchant rules were checked before any
                  recovery action was allowed.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1">
                <CheckCircle2
                  size={15}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Verification
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Revenue is counted only after the simulated
                  payment outcome is successfully verified.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Warning */}
      <div className="flex gap-3 rounded-xl border border-amber-900/40 bg-amber-950/10 p-4">

        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p className="text-xs leading-5 text-amber-300/80">
          Simulation mode updates the demo database so that
          recovery metrics and audit trails can be demonstrated.
          It does not send real customer messages or execute
          real payments.
        </p>

      </div>

    </div>
  );
};

export default SimulationPage;
