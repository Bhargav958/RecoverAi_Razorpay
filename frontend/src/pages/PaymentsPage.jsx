import { useEffect, useState } from "react";

import {
  ChevronRight,
  CreditCard,
  RefreshCw,
  Search
} from "lucide-react";

import {
  getPayments
} from "../services/api.js";

import StatusBadge from "../components/StatusBadge.jsx";

const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const PaymentsPage = () => {
  const [payments, setPayments] =
    useState([]);
  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1
    });
  const [search, setSearch] =
    useState("");
  const [status, setStatus] =
    useState("ALL");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadPayments = async (
    page = pagination.page
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getPayments({
          page,
          search,
          status
        });

      setPayments(
        response.data?.payments || []
      );
      setPagination(
        response.data?.pagination ||
          pagination
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(1);
  }, [
    search,
    status
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Payment Operations
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Payments
          </h1>
          <p className="mt-2 text-slate-400">
            Payment outcomes, failure reasons, and linked recovery cases.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadPayments(pagination.page)
          }
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search payment ID, customer, or failure reason..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="FAILED">Failed</option>
            <option value="CAPTURED">Captured</option>
            <option value="CREATED">Created</option>
            <option value="AUTHORIZED">Authorized</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="font-semibold">
              Payment Ledger
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} payments
            </p>
          </div>
          <CreditCard
            size={18}
            className="text-slate-500"
          />
        </div>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            No payments match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-300 text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-4 py-4 font-medium">Customer</th>
                  <th className="px-4 py-4 font-medium">Amount</th>
                  <th className="px-4 py-4 font-medium">Method</th>
                  <th className="px-4 py-4 font-medium">Failure</th>
                  <th className="px-4 py-4 font-medium">Source</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Recovery</th>
                  <th className="px-6 py-4 text-right font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-slate-800/70 hover:bg-slate-800/20"
                  >
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs text-slate-300">
                        {payment.razorpayPaymentId}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-600">
                        {payment.razorpayOrderId}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-medium">
                        {payment.customerId?.name || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.customerId?.email || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-5 font-medium">
                      {formatINR(payment.amount)}
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-300">
                      {payment.method || "-"}
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm text-slate-300">
                        {payment.failureCode || "-"}
                      </p>
                      <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                        {payment.failureReason || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-5 text-xs text-slate-500">
                      {payment.isSimulation ? "Simulation" : "Razorpay"}
                    </td>
                    <td className="px-4 py-5">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-5">
                      {payment.recoveryCase ? (
                        <button
                          type="button"
                          onClick={() =>
                            (window.location.href =
                              `/recovery-cases/${payment.recoveryCase._id}`)
                          }
                          className="text-xs text-slate-300 hover:text-white"
                        >
                          Open case
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          (window.location.href =
                            `/payments/${payment._id}`)
                        }
                        className="inline-flex rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
          <p className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || pagination.page <= 1}
              onClick={() =>
                loadPayments(pagination.page - 1)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={
                loading ||
                pagination.page >=
                  pagination.totalPages
              }
              onClick={() =>
                loadPayments(pagination.page + 1)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
