import {
  useEffect,
  useState
} from "react";

import {
  Bot,
  CheckCircle2,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  CircleDollarSign,
  RefreshCw
} from "lucide-react";

import {
  getAgentActivity
} from "../services/api.js";

const formatText = (value) => {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getActivityIcon = (eventType) => {
  if (
    eventType.includes("AI")
  ) {
    return Bot;
  }

  if (
    eventType.includes("POLICY")
  ) {
    return ShieldCheck;
  }

  if (
    eventType.includes("RECOVERED")
  ) {
    return CircleDollarSign;
  }

  if (
    eventType.includes("ACTION")
  ) {
    return Clock3;
  }

  if (
    eventType.includes("FAILED") ||
    eventType.includes("REJECTED")
  ) {
    return AlertTriangle;
  }

  return CheckCircle2;
};

const AgentActivityPage = () => {
  const [activity, setActivity] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAgentActivity(50);

      setActivity(
        response.data?.activity || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();

    /*
     * Refresh periodically so the page behaves
     * like a live agent console.
     */

    const interval =
      setInterval(
        loadActivity,
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Autonomous Recovery
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Agent Activity
          </h1>

          <p className="mt-2 text-slate-400">
            Follow every decision and action made by the RecoverAI agent.
          </p>
        </div>

        <button
          onClick={loadActivity}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">

        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

        <div>
          <p className="text-sm font-medium">
            Agent monitoring active
          </p>

          <p className="text-xs text-slate-500">
            Activity refreshes automatically every 5 seconds.
          </p>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Activity */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 px-6 py-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold">
                Recovery Agent Stream
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {activity.length} recent events
              </p>
            </div>

            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <Bot size={18} />
            </div>

          </div>

        </div>

        {loading && activity.length === 0 ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            Loading agent activity...
          </div>
        ) : activity.length === 0 ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            No agent activity yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">

            {activity.map(
              (item, index) => {
                const Icon =
                  getActivityIcon(
                    item.eventType || ""
                  );

                return (
                  <div
                    key={item._id || index}
                    className="flex gap-4 px-6 py-5 transition hover:bg-slate-800/20"
                  >

                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-950">
                      <Icon
                        size={16}
                        className="text-slate-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-sm font-medium">
                          {formatText(
                            item.eventType
                          )}
                        </p>

                        <p className="text-xs text-slate-600">
                          {item.timestamp
                            ? new Date(
                                item.timestamp
                              ).toLocaleString()
                            : "—"}
                        </p>

                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-500">
                          {formatText(
                            item.actor
                          )}
                        </span>

                        {item.recoveryCaseId && (
                          <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-600">
                            Case{" "}
                            {String(
                              item.recoveryCaseId
                            ).slice(-8)}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default AgentActivityPage;