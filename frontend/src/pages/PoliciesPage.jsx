import {
  useEffect,
  useState
} from "react";

import {
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Clock3,
  CalendarDays,
  UserRoundCheck,
  BrainCircuit,
  LockKeyhole,
  Info,
  RefreshCw,
  Save
} from "lucide-react";

import {
  getMerchantPolicy,
  updateMerchantPolicy
} from "../services/api.js";

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

const RuleCard = ({
  icon: Icon,
  label,
  value,
  description
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-slate-300">
            <Icon size={17} />
          </div>

          <div>
            <p className="text-sm font-medium">
              {label}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

        </div>

        <p className="whitespace-nowrap text-xl font-semibold">
          {value}
        </p>

      </div>

    </div>
  );
};

const PoliciesPage = () => {
  const [
    policy,
    setPolicy
  ] = useState(null);

  const [
    merchant,
    setMerchant
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    form,
    setForm
  ] = useState({});

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    saved,
    setSaved
  ] = useState("");

  const loadPolicy = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMerchantPolicy();

      setPolicy(
        response.data.policy
      );

      setForm({
        maxRetries:
          response.data.policy.maxRetries,
        minRetryIntervalHours:
          response.data.policy.minRetryIntervalHours,
        maxMessages:
          response.data.policy.maxMessages,
        minMessageIntervalHours:
          response.data.policy.minMessageIntervalHours,
        recoveryWindowDays:
          response.data.policy.recoveryWindowDays,
        humanEscalationThreshold:
          response.data.policy.humanEscalationThreshold,
        minimumAIConfidence:
          response.data.policy.minimumAIConfidence
      });

      setMerchant(
        response.data.merchant
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleFieldChange = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    setSaved("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved("");

      const response =
        await updateMerchantPolicy(
          form
        );

      setPolicy(
        response.data.policy
      );

      setSaved(
        "Policy saved successfully."
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading recovery policy...
      </div>
    );
  }



  if (error) {
    return (
      <div className="space-y-4">

        <button
          onClick={loadPolicy}
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

  if (!policy) {
    return null;
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-sm text-slate-500">
            Merchant Controls
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Recovery Policies
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Deterministic guardrails that constrain every AI-generated
            recovery recommendation.
          </p>

        </div>

        <button
          onClick={loadPolicy}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>

      </div>

      {/* Safety banner */}
      <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-6">

        <div className="flex gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-900/50 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={19} />
          </div>

          <div>

            <h2 className="font-semibold">
              AI actions are policy-bound
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Gemini can recommend a recovery action, but it cannot
              bypass merchant policy. Every recommendation is checked
              against retry limits, communication limits, confidence
              thresholds, recovery windows and human escalation rules.
            </p>

          </div>

        </div>

      </div>

      {/* Merchant */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5">

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-600">
            Active merchant policy
          </p>

          <p className="mt-1 font-medium">
            {merchant?.businessName ||
              "IIITT SaaS"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </div>

      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
          {saved}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Edit Recovery Guardrails
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              These values are enforced by the policy engine before
              any AI-recommended action can be executed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Policy"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["maxRetries", "Maximum retries", 0],
            ["minRetryIntervalHours", "Minimum retry interval hours", 0],
            ["maxMessages", "Maximum messages", 0],
            ["minMessageIntervalHours", "Minimum message interval hours", 0],
            ["recoveryWindowDays", "Recovery window days", 1],
            ["humanEscalationThreshold", "Human escalation threshold", 0],
            ["minimumAIConfidence", "Minimum AI confidence", 0]
          ].map(([field, label, min]) => (
            <label
              key={field}
              className="block rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <span className="text-xs text-slate-500">
                {label}
              </span>
              <input
                type="number"
                min={min}
                max={
                  field ===
                  "minimumAIConfidence"
                    ? 100
                    : undefined
                }
                value={form[field] ?? ""}
                onChange={(event) =>
                  handleFieldChange(
                    field,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-600"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Retry */}
      <section>

        <div className="mb-4">

          <p className="text-xs uppercase tracking-wider text-slate-600">
            Payment recovery
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Retry Guardrails
          </h2>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <RuleCard
            icon={RotateCcw}
            label="Maximum retries"
            value={policy.maxRetries}
            description="Maximum payment retry attempts allowed for one recovery case."
          />

          <RuleCard
            icon={Clock3}
            label="Minimum retry interval"
            value={`${policy.minRetryIntervalHours}h`}
            description="Minimum time that must pass between payment retry attempts."
          />

          <RuleCard
            icon={CalendarDays}
            label="Recovery window"
            value={`${policy.recoveryWindowDays}d`}
            description="Maximum period during which automated recovery can continue."
          />

          <RuleCard
            icon={UserRoundCheck}
            label="Human escalation threshold"
            value={formatINR(
              policy.humanEscalationThreshold
            )}
            description="Cases at or above this amount require human approval."
          />

        </div>

      </section>

      {/* Communication */}
      <section>

        <div className="mb-4">

          <p className="text-xs uppercase tracking-wider text-slate-600">
            Customer communication
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Outreach Guardrails
          </h2>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <RuleCard
            icon={MessageSquare}
            label="Maximum messages"
            value={policy.maxMessages}
            description="Maximum automated recovery messages allowed per case."
          />

          <RuleCard
            icon={Clock3}
            label="Message interval"
            value={`${policy.minMessageIntervalHours}h`}
            description="Minimum waiting period between automated customer messages."
          />

        </div>

      </section>

      {/* AI */}
      <section>

        <div className="mb-4">

          <p className="text-xs uppercase tracking-wider text-slate-600">
            AI controls
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Intelligence Guardrails
          </h2>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <RuleCard
            icon={BrainCircuit}
            label="Minimum AI confidence"
            value={`${policy.minimumAIConfidence}%`}
            description="AI recommendations below this confidence level are escalated for human review."
          />

          <RuleCard
            icon={LockKeyhole}
            label="Execution boundary"
            value="Policy"
            description="AI recommendations must pass policy evaluation before execution."
          />

        </div>

      </section>

      {/* Decision flow */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-start gap-3">

          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
            <Info size={18} />
          </div>

          <div>

            <h2 className="font-semibold">
              How a recovery decision is constrained
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The AI never directly controls the recovery workflow.
            </p>

          </div>

        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

            <p className="text-xs text-slate-600">
              01
            </p>

            <p className="mt-2 font-medium">
              AI Recommendation
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Gemini analyzes the payment and customer context.
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

            <p className="text-xs text-slate-600">
              02
            </p>

            <p className="mt-2 font-medium">
              Policy Evaluation
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Deterministic merchant rules validate the recommendation.
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

            <p className="text-xs text-slate-600">
              03
            </p>

            <p className="mt-2 font-medium">
              Bounded Action
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              The approved action is scheduled or executed within limits.
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

            <p className="text-xs text-slate-600">
              04
            </p>

            <p className="mt-2 font-medium">
              Verification
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Money is counted as recovered only after payment verification.
            </p>

          </div>

        </div>

      </section>

      {/* Safety notice */}
      <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">

        <LockKeyhole
          size={15}
          className="mt-0.5 shrink-0 text-slate-500"
        />

        <p className="text-xs leading-5 text-slate-600">
          Policy edits update merchant configuration only. The AI still
          cannot bypass these deterministic limits or access secrets.
        </p>

      </div>

    </div>
  );
};

export default PoliciesPage;
