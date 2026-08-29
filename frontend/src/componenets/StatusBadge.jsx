const STATUS_STYLES = {
  RECOVERED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  PENDING_ACTION:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  ANALYZING:
    "border-violet-500/20 bg-violet-500/10 text-violet-400",

  DETECTED:
    "border-blue-500/20 bg-blue-500/10 text-blue-400",

  ACTION_SCHEDULED:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  ACTION_SELECTED:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  ACTION_EXECUTED:
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",

  VERIFYING:
    "border-violet-500/20 bg-violet-500/10 text-violet-400",

  ESCALATED:
    "border-orange-500/20 bg-orange-500/10 text-orange-400",

  FAILED:
    "border-red-500/20 bg-red-500/10 text-red-400",

  CAPTURED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  SUCCEEDED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  AUTHORIZED:
    "border-blue-500/20 bg-blue-500/10 text-blue-400",

  CREATED:
    "border-slate-700 bg-slate-800 text-slate-300",

  SCHEDULED:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  PENDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  EXECUTED:
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",

  REJECTED:
    "border-red-500/20 bg-red-500/10 text-red-400",

  REFUNDED:
    "border-slate-700 bg-slate-800 text-slate-400",

  STOPPED:
    "border-slate-700 bg-slate-800 text-slate-400"
};

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const StatusBadge = ({
  status
}) => {
  const style =
    STATUS_STYLES[status] ||
    STATUS_STYLES.STOPPED;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
