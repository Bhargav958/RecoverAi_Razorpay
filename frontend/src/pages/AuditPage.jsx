import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FileClock,
  Search,
  RefreshCw,
  Bot,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Database,
  ChevronRight
} from "lucide-react";

import {
  getAuditLogs
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

const getEventIcon = (eventType) => {
  if (
    eventType?.includes("AI")
  ) {
    return Bot;
  }

  if (
    eventType?.includes("POLICY")
  ) {
    return ShieldCheck;
  }

  if (
    eventType?.includes("RECOVERED") ||
    eventType?.includes("STOPPED")
  ) {
    return CheckCircle2;
  }

  if (
    eventType?.includes("FAILED") ||
    eventType?.includes("REJECTED")
  ) {
    return AlertTriangle;
  }

  if (
    eventType?.includes("ACTION")
  ) {
    return Play;
  }

  return Database;
};

const getEventClass = (eventType) => {
  if (
    eventType?.includes("RECOVERED")
  ) {
    return "text-emerald-400";
  }

  if (
    eventType?.includes("FAILED") ||
    eventType?.includes("REJECTED")
  ) {
    return "text-red-400";
  }

  if (
    eventType?.includes("POLICY")
  ) {
    return "text-blue-400";
  }

  if (
    eventType?.includes("AI")
  ) {
    return "text-violet-400";
  }

  return "text-slate-400";
};

const AuditPage = () => {
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [actorFilter, setActorFilter] =
    useState("ALL");

  const [eventFilter, setEventFilter] =
    useState("ALL");

  const [availableActors, setAvailableActors] =
    useState([]);

  const [availableEvents, setAvailableEvents] =
    useState([]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAuditLogs({
          limit: 100,
          search,
          actor: actorFilter,
          eventType: eventFilter
        });

      setLogs(
        response.data?.logs || []
      );

      setAvailableActors(
        response.data?.filters?.actors || []
      );

      setAvailableEvents(
        response.data?.filters?.eventTypes || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [
    search,
    actorFilter,
    eventFilter
  ]);

  const actors = useMemo(() => {
    return [
      "ALL",
      ...availableActors
    ];
  }, [availableActors]);

  const eventTypes = useMemo(() => {
    return [
      "ALL",
      ...availableEvents
    ];
  }, [availableEvents]);

  const filteredLogs = useMemo(() => {
    const query =
      search
        .toLowerCase()
        .trim();

    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.description
          ?.toLowerCase()
          .includes(query) ||
        log.eventType
          ?.toLowerCase()
          .includes(query) ||
        log.recoveryCaseId
          ?.toLowerCase()
          .includes(query);

      const matchesActor =
        actorFilter === "ALL" ||
        log.actor === actorFilter;

      const matchesEvent =
        eventFilter === "ALL" ||
        log.eventType === eventFilter;

      return (
        matchesSearch &&
        matchesActor &&
        matchesEvent
      );
    });
  }, [
    logs,
    search,
    actorFilter,
    eventFilter
  ]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Compliance & Traceability
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Audit Trail
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            A chronological record of recovery decisions,
            policy checks, actions and verified outcomes.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* Integrity banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

        <div className="flex items-start gap-4">

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-300">
            <FileClock size={18} />
          </div>

          <div>
            <h2 className="font-semibold">
              Recovery decisions are traceable
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              RecoverAI records the major stages of every recovery
              workflow so merchants can reconstruct what happened
              and why.
            </p>
          </div>

        </div>

      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">

          {/* Search */}
          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search event, description, or case ID..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
            />

          </div>

          {/* Actor */}
          <select
            value={actorFilter}
            onChange={(e) =>
              setActorFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            {actors.map(
              (actor) => (
                <option
                  key={actor}
                  value={actor}
                >
                  {actor === "ALL"
                    ? "All actors"
                    : formatText(actor)}
                </option>
              )
            )}
          </select>

          {/* Event */}
          <select
            value={eventFilter}
            onChange={(e) =>
              setEventFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            {eventTypes.map(
              (event) => (
                <option
                  key={event}
                  value={event}
                >
                  {event === "ALL"
                    ? "All events"
                    : formatText(event)}
                </option>
              )
            )}
          </select>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Total Events
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {logs.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Events Shown
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {filteredLogs.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Recovery Events
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              logs.filter(
                (item) =>
                  item.eventType?.includes(
                    "RECOVERED"
                  )
              ).length
            }
          </p>
        </div>

      </div>

      {/* Audit table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 px-6 py-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold">
                Event History
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Newest events appear first.
              </p>
            </div>

            <FileClock
              size={18}
              className="text-slate-500"
            />

          </div>

        </div>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            Loading audit history...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            No audit events match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] text-left">

              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4 font-medium">
                    Event
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Actor
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Description
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Case
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Timestamp
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredLogs.map(
                  (log) => {
                    const Icon =
                      getEventIcon(
                        log.eventType
                      );

                    const iconClass =
                      getEventClass(
                        log.eventType
                      );

                    return (
                      <tr
                        key={log._id}
                        className="border-b border-slate-800/70 transition hover:bg-slate-800/20"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950">
                              <Icon
                                size={15}
                                className={iconClass}
                              />
                            </div>

                            <span className="text-sm font-medium">
                              {formatText(
                                log.eventType
                              )}
                            </span>

                          </div>

                        </td>

                        <td className="px-4 py-5">

                          <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-400">
                            {formatText(
                              log.actor
                            )}
                          </span>

                        </td>

                        <td className="max-w-md px-4 py-5">

                          <p className="text-sm leading-6 text-slate-400">
                            {log.description}
                          </p>

                        </td>

                        <td className="px-4 py-5">

                          {log.recoveryCaseId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              {String(
                                log.recoveryCaseId
                              ).slice(-10)}

                              <ChevronRight
                                size={12}
                              />
                            </span>
                          ) : (
                            "—"
                          )}

                        </td>

                        <td className="px-6 py-5 text-right">

                          <p className="text-xs text-slate-500">
                            {log.timestamp
                              ? new Date(
                                  log.timestamp
                                ).toLocaleDateString()
                              : "—"}
                          </p>

                          <p className="mt-1 text-xs text-slate-700">
                            {log.timestamp
                              ? new Date(
                                  log.timestamp
                                ).toLocaleTimeString()
                              : "—"}
                          </p>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default AuditPage;
