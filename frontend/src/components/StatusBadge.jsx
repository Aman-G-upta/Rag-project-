import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const STYLES = {
  uploaded: { label: "Uploaded", className: "bg-slate-100 text-slate-600", Icon: Clock },
  processing: { label: "Processing", className: "bg-amber-50 text-amber-700", Icon: Loader2 },
  ready: { label: "Ready", className: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700", Icon: AlertCircle },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.uploaded;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>
      <Icon size={13} className={status === "processing" ? "animate-spin" : ""} />
      {s.label}
    </span>
  );
}