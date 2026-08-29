import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  RefreshCw,
  User
} from "lucide-react";

import {
  getPayment
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

const InfoRow = ({
  label,
  value
}) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 py-3 last:border-0">
      <span className="text-xs text-slate-500">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-sm font-medium text-slate-300">
        {value || "-"}
      </span>
    </div>
  );
};

const PaymentDetailPage = () => {
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

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getPayment(id);

      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading payment...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/payments")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
          {error || "Payment not found."}
        </div>
      </div>
    );
  }

  const {
    payment,
    recoveryCase,
    actions
  } = data;

  const customer =
    payment.customerId;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/payments")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>
        <button
          type="button"
          onClick={loadPayment}
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
              <CreditCard size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">
                {formatINR(payment.amount)}
              </h1>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {payment.razorpayPaymentId}
              </p>
              <div className="mt-4">
                <StatusBadge status={payment.status} />
              </div>
            </div>
          </div>
          <div className="lg:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-600">
              Source
            </p>
            <p className="mt-2 text-sm font-medium">
              {payment.isSimulation ? "Simulation" : "Razorpay"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
          <h2 className="font-semibold">
            Payment Context
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <InfoRow label="Currency" value={payment.currency} />
              <InfoRow label="Method" value={payment.method} />
              <InfoRow label="Razorpay order ID" value={payment.razorpayOrderId} />
              <InfoRow label="Failure code" value={payment.failureCode} />
              <InfoRow label="Failure reason" value={payment.failureReason} />
            </div>
            <div>
              <InfoRow
                label="Created"
                value={
                  payment.createdAt
                    ? new Date(payment.createdAt).toLocaleString()
                    : "-"
                }
              />
              <InfoRow
                label="Updated"
                value={
                  payment.updatedAt
                    ? new Date(payment.updatedAt).toLocaleString()
                    : "-"
                }
              />
              <InfoRow
                label="Paid at"
                value={
                  payment.paidAt
                    ? new Date(payment.paidAt).toLocaleString()
                    : "-"
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <User
              size={17}
              className="text-slate-500"
            />
            <h2 className="font-semibold">
              Customer
            </h2>
          </div>
          <div className="mt-5">
            <InfoRow label="Name" value={customer?.name} />
            <InfoRow label="Email" value={customer?.email} />
            <InfoRow label="Segment" value={formatText(customer?.segment)} />
          </div>
          {customer?._id && (
            <button
              type="button"
              onClick={() =>
                (window.location.href =
                  `/customers/${customer._id}`)
              }
              className="mt-4 inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white"
            >
              Open customer
              <ChevronRight size={13} />
            </button>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Linked Recovery Case
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recovery workflow attached to this payment.
            </p>
          </div>
          {recoveryCase && (
            <StatusBadge status={recoveryCase.status} />
          )}
        </div>

        {!recoveryCase ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-500">
            No recovery case is linked to this payment.
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {formatINR(recoveryCase.amountAtRisk)} at risk
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatINR(recoveryCase.amountRecovered)} recovered
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                (window.location.href =
                  `/recovery-cases/${recoveryCase._id}`)
              }
              className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white"
            >
              Open recovery case
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold">
          Recovery Action History
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {actions.length === 0 ? (
            <div className="text-sm text-slate-500">
              No recovery actions for this payment.
            </div>
          ) : actions.map((action) => (
            <div
              key={action._id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {formatText(action.actionType)}
                </p>
                <StatusBadge status={action.status} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {action.reason || "No reason recorded"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PaymentDetailPage;
