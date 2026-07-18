/**
 * Portal — My Appointments
 * Lists the client's upcoming and past appointments.
 */

import { useState, useEffect } from "react";
import { Calendar, Clock, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import { getOwnAppointments, type PortalAppointment } from "@/portal/repositories/appointments.repository";

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string }> = {
  scheduled:  { label: "Scheduled",  labelAr: "مجدول",    color: "bg-blue-500/15 text-blue-300 border-blue-500/20" },
  confirmed:  { label: "Confirmed",  labelAr: "مؤكد",     color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  completed:  { label: "Completed",  labelAr: "مكتمل",    color: "bg-ivory/10 text-ivory/50 border-white/10" },
  cancelled:  { label: "Cancelled",  labelAr: "ملغى",     color: "bg-red-500/15 text-red-300 border-red-500/20" },
};

function StatusBadge({ status, isAr }: { status: string | null; isAr: boolean }) {
  const cfg = STATUS_CONFIG[status ?? ""] ?? { label: status ?? "Unknown", labelAr: status ?? "غير معروف", color: "bg-white/10 text-ivory/50 border-white/10" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {isAr ? cfg.labelAr : cfg.label}
    </span>
  );
}

function AppointmentCard({ appt, isAr }: { appt: PortalAppointment; isAr: boolean }) {
  const date = new Date(appt.date).toLocaleDateString(isAr ? "ar-KW" : "en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-pink/10 flex items-center justify-center">
        <Calendar className="text-primary-pink" size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-semibold text-ivory truncate">{appt.type ?? (isAr ? "موعد" : "Appointment")}</h3>
          <StatusBadge status={appt.status} isAr={isAr} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ivory/50 mt-1">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {date}
          </span>
          {appt.time && (
            <span className="flex items-center gap-1">
              <Clock size={13} /> {appt.time}
            </span>
          )}
        </div>
        {appt.notes && (
          <p className="text-sm text-ivory/40 mt-2 flex items-start gap-1.5">
            <FileText size={13} className="mt-0.5 shrink-0" />
            {appt.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { profile, loading: profileLoading } = useClientProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!profile) {
      if (!profileLoading) setLoading(false);
      return;
    }
    getOwnAppointments(profile.id).then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  const upcoming = appointments.filter((a) => !a.isPast);
  const past     = appointments.filter((a) => a.isPast);

  const EmptyState = ({ label }: { label: string }) => (
    <div className="py-10 text-center bg-white/3 border border-white/8 rounded-2xl">
      <AlertCircle className="mx-auto text-ivory/20 mb-3" size={28} />
      <p className="text-ivory/40 text-sm">{label}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-ivory">
        {isAr ? "مواعيدي" : "My Appointments"}
      </h1>

      {/* Upcoming */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <h2 className="font-heading text-base font-semibold text-ivory">
            {isAr ? "القادمة" : "Upcoming"}
          </h2>
          {upcoming.length > 0 && (
            <span className="text-xs font-medium text-ivory/40 bg-white/5 px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </div>
        {upcoming.length === 0
          ? <EmptyState label={isAr ? "لا توجد مواعيد قادمة." : "No upcoming appointments."} />
          : <div className="space-y-3">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} isAr={isAr} />)}</div>
        }
      </section>

      {/* Past */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={16} className="text-ivory/30" />
          <h2 className="font-heading text-base font-semibold text-ivory">
            {isAr ? "السابقة" : "Past"}
          </h2>
          {past.length > 0 && (
            <span className="text-xs font-medium text-ivory/40 bg-white/5 px-2 py-0.5 rounded-full">
              {past.length}
            </span>
          )}
        </div>
        {past.length === 0
          ? <EmptyState label={isAr ? "لا توجد مواعيد سابقة." : "No past appointments."} />
          : <div className="space-y-3">{past.map((a) => <AppointmentCard key={a.id} appt={a} isAr={isAr} />)}</div>
        }
      </section>
    </div>
  );
}
