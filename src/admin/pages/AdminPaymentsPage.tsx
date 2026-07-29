/**
 * AdminPaymentsPage — live payments dashboard.
 *
 * Queries the `payments` table and displays every charge with status,
 * amount, client info, and a link to the related appointment.
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "@/admin/components/PageHeader";
import { getPayments, type PaymentRow } from "@/admin/repositories/payments.repository";
import {
  CreditCard, RefreshCw, CheckCircle2, XCircle, Clock,
  DollarSign, TrendingUp, AlertCircle,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style:    "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

type StatusKey = PaymentRow["status"];

const STATUS_CONFIG: Record<StatusKey, { label: string; labelAr: string; cls: string; dot: string; Icon: React.ElementType }> = {
  succeeded: { label: "Paid",     labelAr: "مدفوع",    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",  dot: "bg-emerald-500", Icon: CheckCircle2 },
  pending:   { label: "Pending",  labelAr: "قيد الانتظار", cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",   dot: "bg-amber-400",   Icon: Clock        },
  failed:    { label: "Failed",   labelAr: "فشل",      cls: "bg-red-50    text-red-600    ring-1 ring-red-200",        dot: "bg-red-500",     Icon: XCircle      },
  refunded:  { label: "Refunded", labelAr: "مُسترجع",  cls: "bg-gray-50   text-gray-600   ring-1 ring-gray-200",       dot: "bg-gray-400",    Icon: RefreshCw    },
};

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-admin-muted font-medium mb-0.5">{label}</p>
        <p className="font-heading font-bold text-admin-heading text-lg leading-tight">{value}</p>
        {sub && <p className="text-xs text-admin-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<"all" | StatusKey>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const rows = await getPayments();
    if (!Array.isArray(rows)) {
      setError(isAr ? "تعذّر تحميل بيانات المدفوعات." : "Failed to load payment data.");
    } else {
      setPayments(rows);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived stats ───────────────────────────────────────────────────────────
  const succeeded = payments.filter((p) => p.status === "succeeded");
  const totalRevenue = succeeded.reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const failedCount  = payments.filter((p) => p.status === "failed").length;

  const displayed = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const breadcrumbs = [
    { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
    { label: isAr ? "المدفوعات" : "Payments" },
  ];

  return (
    <div>
      <PageHeader
        title={isAr ? "المدفوعات" : "Payments"}
        description={
          isAr
            ? "تتبع الإيرادات وسجل المدفوعات عبر جميع الخدمات."
            : "Track revenue and payment history across all your services."
        }
        breadcrumbs={breadcrumbs}
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-admin-border text-sm font-medium text-admin-body hover:bg-admin-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={TrendingUp}
          label={isAr ? "إجمالي الإيرادات" : "Total Revenue"}
          value={succeeded.length ? formatCurrency(totalRevenue, succeeded[0]?.currency ?? "usd") : "$0.00"}
          sub={`${succeeded.length} ${isAr ? "معاملة" : "transactions"}`}
          accent="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <SummaryCard
          icon={DollarSign}
          label={isAr ? "الإجمالي" : "All Payments"}
          value={String(payments.length)}
          accent="bg-gradient-to-br from-primary-pink to-lavender-purple"
        />
        <SummaryCard
          icon={Clock}
          label={isAr ? "معلّقة" : "Pending"}
          value={String(pendingCount)}
          accent="bg-gradient-to-br from-amber-400 to-amber-500"
        />
        <SummaryCard
          icon={XCircle}
          label={isAr ? "فشلت" : "Failed"}
          value={String(failedCount)}
          accent="bg-gradient-to-br from-red-400 to-red-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "succeeded", "pending", "failed", "refunded"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary-pink text-white shadow-sm"
                : "bg-admin-card border border-admin-border text-admin-body hover:bg-admin-hover"
            }`}
          >
            {f === "all"
              ? (isAr ? "الكل" : "All")
              : (STATUS_CONFIG[f]?.label ?? f)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-admin-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-8 text-red-600">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-admin-muted">
            <CreditCard size={36} className="opacity-30" />
            <p className="text-sm font-medium">
              {isAr ? "لا توجد مدفوعات حتى الآن." : "No payments yet."}
            </p>
            <p className="text-xs opacity-70">
              {isAr
                ? "ستظهر المدفوعات هنا بعد إتمام عمليات الدفع عبر Stripe."
                : "Payments will appear here once clients complete checkout via Stripe."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-admin-card/40">
                  {[
                    isAr ? "التاريخ"      : "Date",
                    isAr ? "العميل"       : "Client",
                    isAr ? "الخدمة"       : "Service",
                    isAr ? "المبلغ"       : "Amount",
                    isAr ? "الحالة"       : "Status",
                    isAr ? "المعرّف"      : "Payment ID",
                  ].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold text-admin-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {displayed.map((p) => (
                  <tr key={p.id} className="hover:bg-admin-hover/40 transition-colors">
                    <td className="px-5 py-4 text-admin-muted whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-admin-heading">{p.client_name ?? "—"}</p>
                      {p.client_email && (
                        <p className="text-xs text-admin-muted">{p.client_email}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-admin-body">
                      {p.service_name ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-admin-heading tabular-nums whitespace-nowrap">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-xs font-mono text-admin-muted bg-admin-card px-2 py-0.5 rounded-lg">
                        {p.stripe_payment_intent_id.slice(0, 24)}…
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
