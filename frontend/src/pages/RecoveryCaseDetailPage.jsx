import {
  useEffect,
  useState
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Bot,
  ShieldCheck,
  CircleDollarSign,
  CreditCard,
  User,
  CalendarClock,
  Zap,
  RefreshCw,
  ExternalLink
} from "lucide-react";

import {
  getRecoveryCase,
  getRecoveryCaseAudit,
  approveEscalatedCase,
  rejectEscalatedCase
} from "../services/api.js";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import StatusBadge
  from "../components/StatusBadge.jsx";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatINR = (value) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(value || 0);
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

const truncateId = (
  value,
  length = 18
) => {
  if (!value) return "—";

  const text =
    value.toString();

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(
    0,
    length
  )}...`;
};

/*
|--------------------------------------------------------------------------
| Timeline Icon
|--------------------------------------------------------------------------
*/

const TimelineIcon = ({
  event
}) => {
  if (
    event?.includes("RECOVERED") ||
    event?.includes("STOPPED")
  ) {
    return (
      <CheckCircle2
        size={16}
        className="text-emerald-400"
      />
    );
  }

  if (
    event?.includes("POLICY")
  ) {
    return (
      <ShieldCheck
        size={16}
        className="text-blue-400"
      />
    );
  }

  if (
    event?.includes("AI")
  ) {
    return (
      <Bot
        size={16}
        className="text-violet-400"
      />
    );
  }

  if (
    event?.includes("ACTION")
  ) {
    return (
      <Clock3
        size={16}
        className="text-amber-400"
      />
    );
  }

  if (
    event?.includes("RISK")
  ) {
    return (
      <AlertTriangle
        size={16}
        className="text-orange-400"
      />
    );
  }

  return (
    <CircleDollarSign
      size={16}
      className="text-slate-400"
    />
  );
};

/*
|--------------------------------------------------------------------------
| Small information row
|--------------------------------------------------------------------------
*/

const InfoRow = ({
  label,
  value,
  mono = false
}) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 py-3 last:border-0">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span
        className={`max-w-[65%] text-right text-sm text-slate-300 ${
          mono
            ? "font-mono text-xs"
            : "font-medium"
        }`}
      >
        {value || "—"}
      </span>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Metric Card
|--------------------------------------------------------------------------
*/

const MetricCard = ({
  label,
  value,
  description,
  icon: Icon,
  accent = false
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <p className="text-xs uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <div
          className={`rounded-lg p-2 ${
            accent
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          <Icon size={16} />
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

      {description && (
        <p className="mt-1 text-xs text-slate-600">
          {description}
        </p>
      )}

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Page
|--------------------------------------------------------------------------
*/

const RecoveryCaseDetailPage =
  () => {
    const { id } =
      useParams();

    const navigate =
      useNavigate();

    const [
      recoveryCase,
      setRecoveryCase
    ] = useState(null);

    const [
      auditLogs,
      setAuditLogs
    ] = useState([]);

    const [
      loading,
      setLoading
    ] = useState(true);

    const [
      error,
      setError
    ] = useState("");

    const [
      reviewLoading,
      setReviewLoading
    ] = useState(false);

    const [
      refreshing,
      setRefreshing
    ] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Load case
    |--------------------------------------------------------------------------
    */

    const loadCase = async (
      showRefreshing = false
    ) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          caseResponse,
          auditResponse
        ] = await Promise.all([
          getRecoveryCase(id),
          getRecoveryCaseAudit(id)
        ]);

        setRecoveryCase(
          caseResponse.data
        );

        setAuditLogs(
          auditResponse.data || []
        );
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Initial load + live refresh
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
      loadCase();

      const interval =
        setInterval(
          () => loadCase(true),
          5000
        );

      return () =>
        clearInterval(interval);
    }, [id]);

    /*
    |--------------------------------------------------------------------------
    | Escalation actions
    |--------------------------------------------------------------------------
    */

    const handleApprove = async () => {
      try {
        setReviewLoading(true);
        setError("");

        await approveEscalatedCase(
          id
        );

        await loadCase(true);
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setReviewLoading(false);
      }
    };

    const handleReject = async () => {
      try {
        setReviewLoading(true);
        setError("");

        await rejectEscalatedCase(
          id
        );

        await loadCase(true);
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setReviewLoading(false);
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <RefreshCw
              size={16}
              className="animate-spin"
            />
            Loading recovery case...
          </div>
        </div>
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    if (error && !recoveryCase) {
      return (
        <div className="space-y-5">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/command-center"
              )
            }
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft
              size={16}
            />
            Back to Command Center
          </button>

          <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-sm text-red-300">
            {error}
          </div>

        </div>
      );
    }

    if (!recoveryCase) {
      return null;
    }

    const customer =
      recoveryCase.customerId;

    const payment =
      recoveryCase.paymentId;

    const isRecovered =
      recoveryCase.status ===
      "RECOVERED";

    const isLivePayment =
      payment?.isSimulation ===
      false;

    const riskLabel =
      recoveryCase.riskScore >= 80
        ? "Critical"
        : recoveryCase.riskScore >= 60
          ? "High"
          : recoveryCase.riskScore >= 40
            ? "Medium"
            : "Low";

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
      <div className="space-y-7">

        {/* Back + refresh */}
        <div className="flex items-center justify-between">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/command-center"
              )
            }
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft
              size={16}
            />
            Back to Command Center
          </button>

          <button
            type="button"
            onClick={() =>
              loadCase(true)
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400 transition hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Hero */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">

          <div className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-3xl font-semibold tracking-tight">
                  {customer?.name ||
                    "Unknown Customer"}
                </h1>

                <StatusBadge
                  status={
                    recoveryCase.status
                  }
                />

                {isLivePayment && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Razorpay
                  </span>
                )}

              </div>

              <p className="mt-2 text-sm text-slate-500">
                {customer?.email}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">

                <span>
                  Case{" "}
                  <span className="font-mono text-slate-500">
                    {truncateId(
                      recoveryCase._id
                    )}
                  </span>
                </span>

                <span>
                  Payment{" "}
                  <span className="font-mono text-slate-500">
                    {truncateId(
                      payment?.razorpayPaymentId
                    )}
                  </span>
                </span>

              </div>

            </div>

            <div className="xl:text-right">

              <p className="text-xs uppercase tracking-wider text-slate-500">
                Revenue Recovered
              </p>

              <p
                className={`mt-2 text-4xl font-semibold ${
                  isRecovered
                    ? "text-emerald-400"
                    : "text-white"
                }`}
              >
                {formatINR(
                  recoveryCase.amountRecovered
                )}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                of{" "}
                {formatINR(
                  recoveryCase.amountAtRisk
                )}{" "}
                at risk
              </p>

            </div>

          </div>

        </div>

        {/* Human review */}
        {recoveryCase.status ===
          "ESCALATED" && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                  <AlertTriangle
                    size={18}
                  />
                </div>

                <div>

                  <h2 className="font-semibold text-orange-300">
                    Human Review Required
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    RecoverAI paused autonomous execution
                    because this case requires merchant approval.
                  </p>

                  {recoveryCase.stoppedReason && (
                    <p className="mt-2 text-xs text-slate-600">
                      {recoveryCase.stoppedReason}
                    </p>
                  )}

                </div>

              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    handleApprove
                  }
                  disabled={
                    reviewLoading
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:opacity-50"
                >
                  <CheckCircle2
                    size={15}
                  />
                  Approve Recovery
                </button>

                <button
                  type="button"
                  onClick={
                    handleReject
                  }
                  disabled={
                    reviewLoading
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2.5 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                >
                  <AlertTriangle
                    size={15}
                  />
                  Stop
                </button>

              </div>

            </div>

          </div>
        )}

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            label="Amount at Risk"
            value={formatINR(
              recoveryCase.amountAtRisk
            )}
            description={`Expected recovery ${formatINR(
              recoveryCase.expectedRecovery
            )}`}
            icon={CircleDollarSign}
          />

          <MetricCard
            label="Risk Score"
            value={`${recoveryCase.riskScore}/100`}
            description={riskLabel}
            icon={AlertTriangle}
          />

          <MetricCard
            label="Recovery Probability"
            value={`${recoveryCase.recoveryProbability}%`}
            description={
              recoveryCase.recoveryProbability >=
              70
                ? "Strong recovery opportunity"
                : "Moderate opportunity"
            }
            icon={Zap}
          />

          <MetricCard
            label="AI Confidence"
            value={
              recoveryCase.diagnosisConfidence
                ? `${recoveryCase.diagnosisConfidence}%`
                : "—"
            }
            description={
              recoveryCase.rootCause ===
              "UNKNOWN"
                ? "Analysis pending"
                : "Diagnosis confidence"
            }
            icon={Bot}
          />

        </div>

        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-3">

          {/* LEFT */}
          <div className="space-y-6 xl:col-span-2">

            {/* AI Diagnosis */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-start justify-between gap-5">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
                      <Bot size={17} />
                    </div>

                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      AI Diagnosis
                    </p>

                  </div>

                  <h2 className="mt-4 text-2xl font-semibold">
                    {recoveryCase.rootCause ===
                    "UNKNOWN"
                      ? "Awaiting AI analysis"
                      : formatText(
                          recoveryCase.rootCause
                        )}
                  </h2>

                </div>

                {recoveryCase.diagnosisConfidence >
                  0 && (
                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
                    {
                      recoveryCase.diagnosisConfidence
                    }
                    % confidence
                  </span>
                )}

              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Recommended Action
                  </p>

                  <p className="mt-3 text-lg font-medium text-white">
                    {recoveryCase.recommendedAction
                      ? formatText(
                          recoveryCase.recommendedAction
                        )
                      : "Awaiting agent analysis"}
                  </p>

                  {recoveryCase.nextActionAt && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarClock
                        size={14}
                      />
                      Scheduled for{" "}
                      {new Date(
                        recoveryCase.nextActionAt
                      ).toLocaleString()}
                    </div>
                  )}

                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    AI Reasoning
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {recoveryCase.aiReason ||
                      "AI reasoning will appear after diagnosis."}
                  </p>

                </div>

              </div>

            </div>

            {/* Evidence */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-semibold">
                    Evidence
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Signals used by the recovery agent.
                  </p>

                </div>

                <ShieldCheck
                  size={18}
                  className="text-slate-500"
                />

              </div>

              <div className="mt-5 space-y-3">

                {recoveryCase.evidence?.length ? (
                  recoveryCase.evidence.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >

                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-emerald-400"
                        />

                        <p className="text-sm leading-6 text-slate-300">
                          {item}
                        </p>

                      </div>
                    )
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600">
                    No AI evidence available yet.
                  </div>
                )}

              </div>

            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-semibold">
                    Recovery Timeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Every stage of this recovery case.
                  </p>

                </div>

                <span className="text-xs text-slate-600">
                  {recoveryCase.timeline?.length ||
                    0}{" "}
                  events
                </span>

              </div>

              <div className="mt-7">

                {recoveryCase.timeline?.map(
                  (
                    event,
                    index
                  ) => {

                    const isLast =
                      index ===
                      recoveryCase.timeline.length -
                        1;

                    const isSuccess =
                      event.event?.includes(
                        "RECOVERED"
                      ) ||
                      event.event?.includes(
                        "STOPPED"
                      );

                    return (
                      <div
                        key={`${event.event}-${index}`}
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >

                        {!isLast && (
                          <div className="absolute left-2 top-6 h-full w-px bg-slate-800" />
                        )}

                        <div
                          className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 ${
                            isSuccess
                              ? "ring-1 ring-emerald-500/20"
                              : ""
                          }`}
                        >
                          <TimelineIcon
                            event={
                              event.event
                            }
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                            <p className="text-sm font-medium">
                              {formatText(
                                event.event
                              )}
                            </p>

                            <p className="text-[11px] text-slate-700">
                              {new Date(
                                event.timestamp
                              ).toLocaleString()}
                            </p>

                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {
                              event.description
                            }
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* Recovery outcome */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <CircleDollarSign
                    size={17}
                  />
                </div>

                <div>

                  <h2 className="font-semibold">
                    Recovery Outcome
                  </h2>

                  <p className="text-xs text-slate-600">
                    Verified financial result
                  </p>

                </div>

              </div>

              <div className="mt-6">

                <p className="text-3xl font-semibold text-emerald-400">
                  {formatINR(
                    recoveryCase.amountRecovered
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  recovered
                </p>

              </div>

              <div className="mt-6 space-y-1">

                <InfoRow
                  label="Case status"
                  value={
                    formatText(
                      recoveryCase.status
                    )
                  }
                />

                <InfoRow
                  label="Attempts"
                  value={
                    recoveryCase.attempts
                  }
                />

                <InfoRow
                  label="Current action"
                  value={
                    recoveryCase.currentAction
                      ? formatText(
                          recoveryCase.currentAction
                        )
                      : "None"
                  }
                />

                <InfoRow
                  label="Stopped reason"
                  value={
                    recoveryCase.stoppedReason
                  }
                />

              </div>

            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
                  <CreditCard
                    size={17}
                  />
                </div>

                <div>

                  <h2 className="font-semibold">
                    Payment
                  </h2>

                  <p className="text-xs text-slate-600">
                    Transaction details
                  </p>

                </div>

              </div>

              <div className="mt-5">

                <InfoRow
                  label="Amount"
                  value={formatINR(
                    payment?.amount
                  )}
                />

                <InfoRow
                  label="Status"
                  value={formatText(
                    payment?.status
                  )}
                />

                <InfoRow
                  label="Method"
                  value={
                    payment?.method
                  }
                />

                <InfoRow
                  label="Failure code"
                  value={
                    payment?.failureCode
                  }
                />

                <InfoRow
                  label="Failure reason"
                  value={
                    payment?.failureReason
                  }
                />

                <InfoRow
                  label="Payment ID"
                  value={
                    payment?.razorpayPaymentId
                  }
                  mono
                />

              </div>

            </div>

            {/* Customer */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
                  <User
                    size={17}
                  />
                </div>

                <div>

                  <h2 className="font-semibold">
                    Customer
                  </h2>

                  <p className="text-xs text-slate-600">
                    Recovery context
                  </p>

                </div>

              </div>

              <div className="mt-5">

                <InfoRow
                  label="Name"
                  value={
                    customer?.name
                  }
                />

                <InfoRow
                  label="Lifetime value"
                  value={formatINR(
                    customer?.lifetimeValue
                  )}
                />

                <InfoRow
                  label="Segment"
                  value={formatText(
                    customer?.segment
                  )}
                />

                <InfoRow
                  label="Preferred channel"
                  value={formatText(
                    customer?.preferredChannel
                  )}
                />

                <InfoRow
                  label="Successful payments"
                  value={
                    customer?.successfulPayments
                  }
                />

              </div>

            </div>

          </div>

        </div>

        {/* Audit */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-semibold">
                Audit Trail
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Every important decision and action recorded by RecoverAI.
              </p>

            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-600">
              {auditLogs.length} events
            </div>

          </div>

          <div className="mt-6 overflow-x-auto">

            <table className="w-full min-w-212.5 text-left text-sm">

              <thead>

                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-600">

                  <th className="pb-3 font-medium">
                    Event
                  </th>

                  <th className="pb-3 font-medium">
                    Actor
                  </th>

                  <th className="pb-3 font-medium">
                    Description
                  </th>

                  <th className="pb-3 text-right font-medium">
                    Time
                  </th>

                </tr>

              </thead>

              <tbody>

                {auditLogs.map(
                  (log) => (
                    <tr
                      key={log._id}
                      className="border-b border-slate-800/70 last:border-0"
                    >

                      <td className="py-4 font-medium text-slate-300">
                        {formatText(
                          log.eventType
                        )}
                      </td>

                      <td className="py-4 text-slate-400">
                        {formatText(
                          log.actor
                        )}
                      </td>

                      <td className="py-4 text-slate-400">
                        {log.description}
                      </td>

                      <td className="py-4 text-right text-xs text-slate-600">
                        {new Date(
                          log.timestamp
                        ).toLocaleString()}
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

export default RecoveryCaseDetailPage;