import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  ArrowUpDown,
  Play,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Activity
} from "lucide-react";



import {
  getRecoveryCases,
  processRecoveryCase,
  approveEscalatedCase,
  rejectEscalatedCase
} from "../services/api.js";

import StatusBadge from "../componenets/StatusBadge.jsx";

const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatRootCause = (value) => {
  if (!value || value === "UNKNOWN") {
    return "Awaiting analysis";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const formatAction = (value) => {
  if (!value) {
    return "Awaiting agent";
  }

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

const isLiveWebhookCase = (item) => {
  return (
    item.paymentId &&
    item.paymentId.isSimulation === false
  );
};

const CommandCenterPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [sortBy, setSortBy] =
    useState("priority");

  const [processingId, setProcessingId] =
    useState(null);

  const [newLiveCases, setNewLiveCases] =
    useState([]);

  const [reviewingId, setReviewingId] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0
    });

  const loadCases = async (
    requestedPage = page,
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response =
        await getRecoveryCases({
          page: requestedPage,
          limit: 25,
          search,
          status: statusFilter,
          sort: sortBy
        });

      const loadedCases =
        response.data?.cases || [];

      setCases(
        loadedCases
      );

      setPagination(
        response.data?.pagination || {
          page: requestedPage,
          limit: 25,
          total: loadedCases.length,
          totalPages: 1
        }
      );

      setPage(
        requestedPage
      );

      /*
      * Detect recent real webhook-created cases.
      *
      * We consider a case "new" when:
      * - it came from a non-simulation payment
      * - it was created recently
      * - it is still active
      */

      const now = Date.now();

      const recentLiveCases =
        loadedCases.filter((item) => {
          const createdAt =
            new Date(
              item.createdAt
            ).getTime();

          const age =
            now - createdAt;

          const recent =
            age >= 0 &&
            age <= 5 * 60 * 1000;

          return (
            recent &&
            isLiveWebhookCase(item) &&
            ![
              "RECOVERED",
              "FAILED",
              "STOPPED"
            ].includes(item.status)
          );
        });

      setNewLiveCases(
        recentLiveCases
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
    loadCases(
      1,
      true
    );
  }, []);

  useEffect(() => {
    setPage(1);

    loadCases(
      1,
      true
    );
  }, [
    search,
    statusFilter,
    sortBy
  ]);

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadCases(
          page,
          false
        );
      }, 5000);

    return () => {
      clearInterval(
        interval
      );
    };
  }, [
    page,
    search,
    statusFilter,
    sortBy
  ]);



  const handleProcess = async (id) => {
    try {
      setProcessingId(id);

      await processRecoveryCase(
        id,
        "SIMULATION"
      );

      await loadCases(page, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };


  const handleApprove = async (id) => {
    try {
      setReviewingId(id);
      setError("");

      await approveEscalatedCase(id);

      await loadCases(page, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setReviewingId(id);
      setError("");

      await rejectEscalatedCase(id);

      await loadCases(page, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Revenue Recovery
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Recovery Command Center
          </h1>

          <p className="mt-2 text-slate-400">
            Prioritize and manage revenue recovery opportunities.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadCases(page, true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* New Live Cases Alert */}
      {newLiveCases.length > 0 && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Activity size={17} />
              </div>

              <div>

                <p className="text-sm font-medium text-blue-300">
                  New revenue risk detected
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {newLiveCases.length} payment
                  {newLiveCases.length > 1
                    ? "s"
                    : ""}{" "}
                  received through the live webhook.
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              {newLiveCases.slice(0, 3).map(
                (item) => (
                  <button
                    key={item._id}
                    onClick={() =>
                      (window.location.href =
                        `/recovery-cases/${item._id}`)
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    {item.customerId?.name ||
                      "New case"}
                  </button>
                )
              )}

            </div>

          </div>

        </div>
      )}

      {/* Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

        <div className="flex flex-col gap-4 xl:flex-row">

          {/* Search */}
          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search customer, email, or root cause..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
            />

          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="DETECTED">
              Detected
            </option>

            <option value="ANALYZING">
              Analyzing
            </option>

            <option value="ACTION_SELECTED">
              Action Selected
            </option>

            <option value="PENDING_ACTION">
              Pending Action
            </option>

            <option value="RECOVERED">
              Recovered
            </option>

            <option value="FAILED">
              Failed
            </option>

            <option value="ESCALATED">
              Escalated
            </option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">

            <ArrowUpDown
              size={15}
              className="text-slate-500"
            />

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none"
            >
              <option value="priority">
                Priority
              </option>

              <option value="risk">
                Risk
              </option>

              <option value="amount">
                Amount
              </option>

              <option value="recovery">
                Recovery Probability
              </option>

              <option value="newest">
                Newest
              </option>
            </select>

          </div>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold">
                Recovery Opportunities
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing{" "}
                {((pagination.page - 1) *
                  pagination.limit) + 1}
                –
                {Math.min(
                  pagination.page *
                    pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} recovery cases
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500">
                Ordered by
              </p>

              <p className="text-sm font-medium">
                {sortBy === "priority"
                  ? "Recovery Priority"
                  : sortBy === "risk"
                    ? "Risk Score"
                    : "Amount at Risk"}
              </p>
            </div>

          </div>
        </div>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            Loading recovery cases...
          </div>
        ) : cases.length === 0 ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            No recovery cases found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-337.5 text-left">

              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4 font-medium">
                    Customer
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Payment
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Amount at Risk
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Risk
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Recovery
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Source
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Root Cause
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Action
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {cases.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                  >

                    {/* Customer */}
                    <td className="px-6 py-5">

                      <div>
                        <div className="flex items-center gap-2">

                          <p className="font-medium text-white">
                            {item.customerId?.name ||
                              "Unknown Customer"}
                          </p>

                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.customerId?.email ||
                            "No email"}
                        </p>

                      </div>

                    </td>

                    {/* Payment */}
                    <td className="px-4 py-5">

                      <div className="space-y-1.5">

                        <p
                          className="font-mono text-xs text-slate-300"
                          title={
                            item.paymentId?.razorpayPaymentId || ""
                          }
                        >
                          {item.paymentId?.razorpayPaymentId
                            ? `${
                                item.paymentId.razorpayPaymentId.slice(
                                  0,
                                  14
                                )
                              }...`
                            : "No payment ID"}
                        </p>

                        {item.paymentId?.isSimulation === false ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

                            <span className="text-[11px] text-blue-400">
                              Razorpay
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />

                            <span className="text-[11px] text-slate-600">
                              Simulation
                            </span>
                          </div>
                        )}

                      </div>

                    </td>

                    {/* Amount */}
                    <td className="px-4 py-5">

                      <p className="font-medium">
                        {formatINR(
                          item.amountAtRisk
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Expected{" "}
                        {formatINR(
                          item.expectedRecovery
                        )}
                      </p>

                    </td>

                    {/* Risk */}
                    <td className="px-4 py-5">

                      <p className="font-medium">
                        {item.riskScore}/100
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {getRiskLabel(
                          item.riskScore
                        )}
                      </p>

                    </td>

                    {/* Recovery */}
                    <td className="px-4 py-5">

                      <p className="font-medium">
                        {item.recoveryProbability}%
                      </p>

                    </td>

                    {/* Source */}
                    <td className="px-4 py-5">

                      {isLiveWebhookCase(item) ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          Razorpay
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          Simulation
                        </span>
                      )}

                    </td>

                    {/* Root cause */}
                    <td className="px-4 py-5">

                      <p className="text-sm text-slate-300">
                        {formatRootCause(
                          item.rootCause
                        )}
                      </p>

                    </td>

                    {/* Action */}
                    <td className="px-4 py-5">

                      <p className="text-sm text-slate-300">
                        {formatAction(
                          item.recommendedAction
                        )}
                      </p>

                    </td>

                    {/* Status */}
                    <td className="px-4 py-5">
                      <StatusBadge
                        status={item.status}
                      />
                    </td>

                    {/* Controls */}
                    <td className="px-6 py-5">

                      <div className="flex justify-end gap-2">

                        {item.status === "ESCALATED" ? (
                          <>
                            <button
                              onClick={() =>
                                handleApprove(item._id)
                              }
                              disabled={
                                reviewingId === item._id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 size={12} />

                              {reviewingId === item._id
                                ? "Updating..."
                                : "Approve"}
                            </button>

                            <button
                              onClick={() =>
                                handleReject(item._id)
                              }
                              disabled={
                                reviewingId === item._id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
                            >
                              <AlertTriangle size={12} />
                              Stop
                            </button>
                          </>
                        ) : (
                          <>
                            {(item.status === "DETECTED" ||
                              item.status ===
                                "ACTION_SELECTED") && (
                              <button
                                onClick={() =>
                                  handleProcess(item._id)
                                }
                                disabled={
                                  processingId ===
                                  item._id
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Play size={12} />

                                {processingId ===
                                item._id
                                  ? "Running..."
                                  : "Run Agent"}
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() =>
                            (window.location.href =
                              `/recovery-cases/${item._id}`)
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        >
                          <ChevronRight size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-slate-500">
            Showing page {pagination.page} of{" "}
            {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">

            <button
              type="button"
              disabled={
                page <= 1 ||
                loading
              }
              onClick={() =>
                loadCases(
                  page - 1,
                  true
                )
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-white">
              {pagination.page}
            </span>

            <button
              type="button"
              disabled={
                page >=
                  pagination.totalPages ||
                loading
              }
              onClick={() =>
                loadCases(
                  page + 1,
                  true
                )
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default CommandCenterPage;