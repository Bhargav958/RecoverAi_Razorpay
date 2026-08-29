import { useEffect, useState } from "react";

import {
  ChevronRight,
  RefreshCw,
  Search,
  Users
} from "lucide-react";

import {
  getCustomers
} from "../services/api.js";

const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatText = (value) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const CustomersPage = () => {
  const [customers, setCustomers] =
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
  const [sort, setSort] =
    useState("ltv");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadCustomers = async (
    page = pagination.page
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getCustomers({
          page,
          search,
          sort
        });

      setCustomers(
        response.data?.customers || []
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
    loadCustomers(1);
  }, [
    search,
    sort
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Merchant Customers
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Customers
          </h1>
          <p className="mt-2 text-slate-400">
            Recovery context across customer payment history.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadCustomers(pagination.page)
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
              placeholder="Search name, email, or segment..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
            />
          </div>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
            className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="ltv">
              Lifetime value
            </option>
            <option value="failed">
              Failed payments
            </option>
            <option value="recoveries">
              Previous recoveries
            </option>
            <option value="newest">
              Newest
            </option>
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
              Customer Portfolio
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} customers
            </p>
          </div>
          <Users
            size={18}
            className="text-slate-500"
          />
        </div>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-96 items-center justify-center text-slate-500">
            No customers match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-4 py-4 font-medium">LTV</th>
                  <th className="px-4 py-4 font-medium">Payments</th>
                  <th className="px-4 py-4 font-medium">Recoveries</th>
                  <th className="px-4 py-4 font-medium">Segment</th>
                  <th className="px-4 py-4 font-medium">Channel</th>
                  <th className="px-6 py-4 text-right font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-slate-800/70 hover:bg-slate-800/20"
                  >
                    <td className="px-6 py-5">
                      <p className="font-medium">
                        {customer.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {customer.email}
                      </p>
                    </td>
                    <td className="px-4 py-5 font-medium">
                      {formatINR(customer.lifetimeValue)}
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-400">
                      {customer.successfulPayments || 0} successful ·{" "}
                      {customer.failedPayments || 0} failed
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-400">
                      {customer.previousRecoveries || 0} previous ·{" "}
                      {customer.activeRecoveryCases || 0} active
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-300">
                      {formatText(customer.segment)}
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-300">
                      {formatText(customer.preferredChannel)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          (window.location.href =
                            `/customers/${customer._id}`)
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
                loadCustomers(pagination.page - 1)
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
                loadCustomers(pagination.page + 1)
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

export default CustomersPage;
