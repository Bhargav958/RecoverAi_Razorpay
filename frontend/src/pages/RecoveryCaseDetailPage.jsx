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
  CircleDollarSign
} from "lucide-react";

import {
  getRecoveryCase,
  getRecoveryCaseAudit
} from "../services/api.js";

import {
  useNavigate,
  useParams
} from "react-router-dom";

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

const statusClass = (status) => {
  if (status === "RECOVERED") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (
    status === "FAILED" ||
    status === "STOPPED"
  ) {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  if (
    status === "PENDING_ACTION" ||
    status === "ACTION_SELECTED"
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
};

const TimelineIcon = ({ event }) => {
  if (
    event.includes("RECOVERED") ||
    event.includes("STOPPED")
  ) {
    return (
      <CheckCircle2
        size={16}
        className="text-emerald-400"
      />
    );
  }

  if (
    event.includes("POLICY")
  ) {
    return (
      <ShieldCheck
        size={16}
        className="text-blue-400"
      />
    );
  }

  if (
    event.includes("AI")
  ) {
    return (
      <Bot
        size={16}
        className="text-violet-400"
      />
    );
  }

  if (
    event.includes("ACTION")
  ) {
    return (
      <Clock3
        size={16}
        className="text-amber-400"
      />
    );
  }

  if (
    event.includes("RISK")
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

const RecoveryCaseDetailPage =
  () => {
    const { id } =
      useParams();

    const navigate =
      useNavigate();

    const [recoveryCase, setRecoveryCase] =
      useState(null);

    const [auditLogs, setAuditLogs] =
      useState([]);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState("");

    useEffect(() => {
      const loadCase = async () => {
        try {
          setLoading(true);

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
        }
      };

      loadCase();
    }, [id]);

    if (loading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
          Loading recovery case...
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-4">
          <button
            onClick={() =>
              navigate(
                "/command-center"
              )
            }
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Command Center
          </button>

          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-red-300">
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

    return (
      <div className="space-y-8">

        {/* Back */}
        <button
          onClick={() =>
            navigate(
              "/command-center"
            )
          }
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Command Center
        </button>

        {/* Header */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {customer?.name ||
                  "Unknown Customer"}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs ${statusClass(
                  recoveryCase.status
                )}`}
              >
                {formatText(
                  recoveryCase.status
                )}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {customer?.email}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Recovery Case {recoveryCase._id}
            </p>
          </div>

          <div className="text-left xl:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Revenue Recovered
            </p>

            <p className="mt-1 text-3xl font-semibold text-emerald-400">
              {formatINR(
                recoveryCase.amountRecovered
              )}
            </p>
          </div>

        </div>

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Amount at Risk
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {formatINR(
                recoveryCase.amountAtRisk
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Risk Score
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {recoveryCase.riskScore}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Recovery Probability
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {recoveryCase.recoveryProbability}%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              AI Confidence
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {recoveryCase.diagnosisConfidence
                ? `${recoveryCase.diagnosisConfidence}%`
                : "Not analyzed"}
            </p>
          </div>

        </div>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-3">

          {/* Left — diagnosis */}
          <div className="space-y-6 xl:col-span-2">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Root Cause
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    {recoveryCase.rootCause ===
                    "UNKNOWN"
                      ? "Awaiting AI analysis"
                      : formatText(
                          recoveryCase.rootCause
                        )}
                  </h2>
                </div>

                <Bot
                  size={20}
                  className="text-violet-400"
                />

              </div>

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

                <p className="text-sm text-slate-400">
                  AI Recommendation
                </p>

                <p className="mt-2 text-lg font-medium">
                  {recoveryCase.recommendedAction
                    ? formatText(
                        recoveryCase.recommendedAction
                      )
                    : "Awaiting agent analysis"}
                </p>

                {recoveryCase.aiReason && (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {recoveryCase.aiReason}
                  </p>
                )}

              </div>

            </div>

            {/* Evidence */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-lg font-semibold">
                Evidence
              </h2>

              <div className="mt-5 space-y-3">

                {recoveryCase.evidence?.length ? (
                  recoveryCase.evidence.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-emerald-400"
                        />

                        <p className="text-sm text-slate-300">
                          {item}
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-500">
                    No AI evidence available yet.
                  </p>
                )}

              </div>

            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-lg font-semibold">
                Recovery Timeline
              </h2>

              <div className="mt-6">

                {recoveryCase.timeline?.map(
                  (event, index) => (
                    <div
                      key={`${event.event}-${index}`}
                      className="relative flex gap-4 pb-7 last:pb-0"
                    >

                      {index !==
                        recoveryCase.timeline.length -
                          1 && (
                        <div className="absolute left-2 top-5 h-full w-px bg-slate-800" />
                      )}

                      <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                        <TimelineIcon
                          event={event.event}
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {formatText(
                            event.event
                          )}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {event.description}
                        </p>

                        <p className="mt-2 text-xs text-slate-700">
                          {new Date(
                            event.timestamp
                          ).toLocaleString()}
                        </p>
                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

          {/* Right */}
          <div className="space-y-6">

            {/* Payment */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-lg font-semibold">
                Payment
              </h2>

              <div className="mt-5 space-y-4 text-sm">

                <div>
                  <p className="text-slate-500">
                    Amount
                  </p>

                  <p className="mt-1 font-medium">
                    {formatINR(
                      payment?.amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 font-medium">
                    {formatText(
                      payment?.status
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Method
                  </p>

                  <p className="mt-1 font-medium">
                    {payment?.method ||
                      "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Failure Code
                  </p>

                  <p className="mt-1 font-medium">
                    {payment?.failureCode ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Failure Reason
                  </p>

                  <p className="mt-1 leading-5">
                    {payment?.failureReason ||
                      "—"}
                  </p>
                </div>

              </div>

            </div>

            {/* Customer */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-lg font-semibold">
                Customer
              </h2>

              <div className="mt-5 space-y-4 text-sm">

                <div>
                  <p className="text-slate-500">
                    Name
                  </p>

                  <p className="mt-1 font-medium">
                    {customer?.name}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Lifetime Value
                  </p>

                  <p className="mt-1 font-medium">
                    {formatINR(
                      customer?.lifetimeValue
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Segment
                  </p>

                  <p className="mt-1">
                    {formatText(
                      customer?.segment
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Preferred Channel
                  </p>

                  <p className="mt-1">
                    {formatText(
                      customer?.preferredChannel
                    )}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Audit */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Audit Trail
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Every important decision and action recorded by RecoverAI.
              </p>
            </div>

            <p className="text-xs text-slate-600">
              {auditLogs.length} events
            </p>

          </div>

          <div className="mt-6 overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">

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
                      className="border-b border-slate-800/70"
                    >

                      <td className="py-4 font-medium">
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