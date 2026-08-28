import {
  useEffect,
  useState
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Webhook,
  ShieldCheck,
  RefreshCw,
  Database,
  Activity,
  Clock3,
  ExternalLink
} from "lucide-react";

import {
  getDashboardSummary,
  getWebhookStatus
} from "../services/api.js";

const SettingsPage = () => {
  const [merchant, setMerchant] =
    useState(null);

  const [webhook, setWebhook] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardResponse,
        webhookResponse
      ] = await Promise.all([
        getDashboardSummary(),
        getWebhookStatus()
      ]);

      setMerchant(
        dashboardResponse.data.merchant
      );

      setWebhook(
        webhookResponse.data
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading integration settings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={loadSettings}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw size={15} />
          Retry
        </button>

        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  const webhookHealthy =
    webhook?.configured &&
    webhook?.failed === 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Platform Configuration
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Settings & Integrations
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Manage your RecoverAI environment and monitor payment
            event connectivity.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* Merchant */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-start gap-4">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <Database size={19} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-600">
              Merchant
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {merchant?.businessName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {merchant?.name}
            </p>
          </div>

        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-600">
              Currency
            </p>

            <p className="mt-2 font-medium">
              {merchant?.currency}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-600">
              Razorpay Mode
            </p>

            <p className="mt-2 font-medium capitalize">
              {merchant?.razorpayMode}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-600">
              Connection
            </p>

            <p className="mt-2 font-medium">
              {merchant?.razorpayConnected
                ? "Connected"
                : "Demo / Not connected"}
            </p>
          </div>

        </div>

      </section>

      {/* Razorpay */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

          <div className="flex gap-4">

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <Webhook
                size={19}
                className="text-slate-300"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-600">
                Payment Integration
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Razorpay Webhooks
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                RecoverAI listens for payment state changes and
                converts failed payments into recovery opportunities.
              </p>
            </div>

          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
              webhookHealthy
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
            }`}
          >
            {webhookHealthy ? (
              <CheckCircle2 size={13} />
            ) : (
              <CircleAlert size={13} />
            )}

            {webhookHealthy
              ? "Webhook healthy"
              : "Needs attention"}
          </div>

        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck size={15} />
              <p className="text-xs">
                Secret configured
              </p>
            </div>

            <p className="mt-3 font-medium">
              {webhook?.configured
                ? "Configured"
                : "Missing"}
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2 text-slate-500">
              <Activity size={15} />
              <p className="text-xs">
                Events received
              </p>
            </div>

            <p className="mt-3 text-xl font-semibold">
              {webhook?.total || 0}
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 size={15} />
              <p className="text-xs">
                Processed
              </p>
            </div>

            <p className="mt-3 text-xl font-semibold">
              {webhook?.processed || 0}
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2 text-slate-500">
              <CircleAlert size={15} />
              <p className="text-xs">
                Processing failures
              </p>
            </div>

            <p className="mt-3 text-xl font-semibold">
              {webhook?.failed || 0}
            </p>

          </div>

        </div>

        {/* Latest webhook */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

          <div className="flex items-center gap-3">

            <Clock3
              size={16}
              className="text-slate-500"
            />

            <div>
              <p className="text-sm font-medium">
                Latest webhook
              </p>

              {webhook?.latest ? (
                <p className="mt-1 text-xs text-slate-500">
                  {webhook.latest.eventType}
                  {" · "}
                  {new Date(
                    webhook.latest.createdAt
                  ).toLocaleString()}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-600">
                  No webhook events received yet.
                </p>
              )}
            </div>

          </div>

        </div>

      </section>

      {/* Events */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
            <Webhook size={18} />
          </div>

          <div>
            <h2 className="font-semibold">
              Supported Payment Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Events currently processed by the RecoverAI ingestion layer.
            </p>
          </div>

        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <p className="font-medium">
              payment.failed
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Creates or updates a revenue-recovery opportunity.
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <p className="font-medium">
              payment.captured
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Confirms payment recovery and closes the workflow.
            </p>

          </div>

        </div>

      </section>

      {/* Environment */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">

        <div className="flex items-start gap-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <Activity size={18} />
          </div>

          <div className="flex-1">

            <h2 className="font-semibold">
              Current Environment
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              RecoverAI is currently configured for controlled
              development and simulation workflows.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                Razorpay: {merchant?.razorpayMode}
              </span>

              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                Simulation: Enabled
              </span>

              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                AI Diagnosis: Gemini
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
};

export default SettingsPage;