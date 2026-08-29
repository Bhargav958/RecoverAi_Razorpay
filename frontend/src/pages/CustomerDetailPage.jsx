import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  RefreshCw,
  User
} from "lucide-react";

import {
  getCustomer
} from "../services/api.js";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import StatusBadge from "../components/StatusBadge.jsx";

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

const CustomerDetailPage = () => {
  const { id } =
    useParams();
  const navigate =
    useNavigate();

  const [data, setData] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getCustomer(id);

      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading customer...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </button>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
          {error || "Customer not found."}
        </div>
      </div>
    );
  }

  const {
    customer,
    payments,
    recoveryCases,
    actions
  } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </button>
        <button
          type="button"
          onClick={loadCustomer}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:text-white"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-slate-300">
              <User size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">
                {customer.name}
              </h1>
              <p className="mt-1 text-slate-500">
                {customer.email}
              </p>
              <p className="mt-3 text-xs text-slate-600">
                {formatText(customer.segment)} · {formatText(customer.preferredChannel)}
              </p>
            </div>
          </div>
          <div className="lg:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-600">
              Lifetime Value
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-400">
              {formatINR(customer.lifetimeValue)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Successful Payments", customer.successfulPayments || 0],
          ["Failed Payments", customer.failedPayments || 0],
          ["Previous Recoveries", customer.previousRecoveries || 0],
          ["Recovery Probability", `${customer.recoveryProbability || 0}%`]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-semibold">
              Recovery History
            </h2>
          </div>
          <div className="divide-y divide-slate-800">
            {recoveryCases.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No recovery cases for this customer.
              </div>
            ) : recoveryCases.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() =>
                  (window.location.href =
                    `/recovery-cases/${item._id}`)
                }
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-800/20"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatINR(item.amountAtRisk)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatText(item.rootCause)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-semibold">
              Payment History
            </h2>
          </div>
          <div className="divide-y divide-slate-800">
            {payments.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No payments found.
              </div>
            ) : payments.map((payment) => (
              <button
                key={payment._id}
                type="button"
                onClick={() =>
                  (window.location.href =
                    `/payments/${payment._id}`)
                }
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-800/20"
              >
                <div className="flex items-center gap-3">
                  <CreditCard
                    size={16}
                    className="text-slate-500"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {formatINR(payment.amount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {payment.razorpayPaymentId}
                    </p>
                  </div>
                </div>
                <StatusBadge status={payment.status} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold">
          Recent Recovery Actions
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {actions.length === 0 ? (
            <div className="text-sm text-slate-500">
              No recovery actions yet.
            </div>
          ) : actions.slice(0, 6).map((action) => (
            <div
              key={action._id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <p className="text-sm font-medium">
                {formatText(action.actionType)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatText(action.status)} · {action.reason || "No reason recorded"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CustomerDetailPage;
