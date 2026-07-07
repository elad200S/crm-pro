import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  ArrowRight, Phone, Mail, Edit,
  MessageCircle, FileText, Clock,
  CreditCard, CheckCircle, Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";

const STATUS_COLORS = {
  "פעיל":      "bg-green-100 text-green-700",
  "חדש":       "bg-gray-100  text-gray-600",
  "פוטנציאלי": "bg-yellow-100 text-yellow-700",
  "לא פעיל":  "bg-red-100   text-red-600",
  "סגור":      "bg-gray-100  text-gray-500",
};

const GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
  "from-cyan-500 to-cyan-700",
  "from-indigo-500 to-indigo-700",
];

const getGradient = (name = "") =>
  GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];

export default function CustomerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) { navigate(createPageUrl("Customers")); return; }
    loadData();
  }, [customer?.id]);

  const loadData = async () => {
    try {
      const [pData, tData, qData] = await Promise.all([
        base44.entities.Payment.filter({ customer_id: customer.id }, '-created_date', 50).catch(() => []),
        base44.entities.Task.list('-due_date', 200).then(all => all.filter(t => t.customer_id === customer.id)).catch(() => []),
        base44.entities.Quote.list('-created_date', 200).then(all => all.filter(q => q.customer_id === customer.id)).catch(() => []),
      ]);
      setPayments(pData);
      setTasks(tData);
      setQuotes(qData);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "לקוח ללא שם";
  const initials = (customer.first_name?.[0] || "") + (customer.last_name?.[0] || "") || "?";
  const gradient = getGradient(fullName);

  const totalPaid    = payments.filter(p => p.status === "שולם").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status !== "שולם" && p.status !== "מבוטל").reduce((s, p) => s + (p.amount || 0), 0);
  const openTasks    = tasks.filter(t => t.status !== "הושלם").length;

  const whatsapp = () => {
    const phone = (customer.phone || "").replace(/\D/g, "");
    const intl = phone.startsWith("0") ? "972" + phone.slice(1) : phone;
    window.open(`https://wa.me/${intl}`, "_blank");
  };

  const Skeleton = () => <div className="h-14 animate-pulse bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6 pb-10">
      {/* Back */}
      <button
        onClick={() => navigate(createPageUrl("Customers"))}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לכל הלקוחות
      </button>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Left: Docs / Tasks / Payments ── */}
        <div className="space-y-5">

          {/* Documents */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-gray-800 text-sm">מסמכים</h3>
              <span className="mr-auto text-xs text-gray-400">{quotes.length} סה"כ</span>
            </div>
            <div className="p-4 space-y-2">
              {loading ? <Skeleton /> : quotes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">אין מסמכים</p>
              ) : quotes.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{q.title || "מסמך ללא כותרת"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {q.created_date ? format(new Date(q.created_date), "dd MMM yyyy", { locale: he }) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.amount > 0 && <span className="text-sm font-bold text-gray-700">₪{q.amount.toLocaleString()}</span>}
                    <Badge className={
                      q.status === "אושר" ? "bg-green-100 text-green-700" :
                      q.status === "בוטל" ? "bg-red-100 text-red-600" :
                      q.status === "נשלח" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }>{q.status || "טיוטה"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-gray-800 text-sm">משימות</h3>
              <span className="mr-auto text-xs text-gray-400">{tasks.length} סה"כ · {openTasks} פתוחות</span>
            </div>
            <div className="p-4 space-y-2">
              {loading ? <Skeleton /> : tasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">אין משימות</p>
              ) : tasks.slice(0, 10).map(task => {
                const overdue = task.status !== "הושלם" && task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${overdue ? "border-red-200 bg-red-50" : "border-gray-100 hover:bg-gray-50"}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${task.status === "הושלם" ? "bg-green-400" : overdue ? "bg-red-400" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "הושלם" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
                      {task.due_date && (
                        <p className={`text-xs mt-0.5 ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                          {format(new Date(task.due_date), "dd/MM/yyyy", { locale: he })}{overdue && " · באיחור"}
                        </p>
                      )}
                    </div>
                    <Badge className={task.status === "הושלם" ? "bg-green-100 text-green-700 text-xs" : "bg-yellow-100 text-yellow-700 text-xs"}>
                      {task.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
              <CreditCard className="w-4 h-4 text-green-600" />
              <h3 className="font-bold text-gray-800 text-sm">תשלומים</h3>
              <span className="mr-auto text-xs text-gray-400">{payments.length} סה"כ</span>
            </div>
            <div className="p-4 space-y-2">
              {loading ? <Skeleton /> : payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">אין תשלומים</p>
              ) : payments.slice(0, 8).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.invoice_number || "חשבונית"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.created_date ? format(new Date(p.created_date), "dd MMM yyyy", { locale: he }) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">₪{(p.amount || 0).toLocaleString()}</span>
                    <Badge className={
                      p.status === "שולם" ? "bg-green-100 text-green-700" :
                      p.status === "מבוטל" ? "bg-gray-100 text-gray-500" :
                      "bg-amber-100 text-amber-700"
                    }>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Customer card ── */}
        <div className="space-y-4">
          {/* Gradient identity card */}
          <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black tracking-tight border border-white/30">
                {initials}
              </div>
              <h2 className="font-bold text-xl leading-snug">{fullName}</h2>
              {customer.company && (
                <p className="text-white/70 text-sm mt-1 flex items-center justify-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />{customer.company}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {customer.customer_number && (
                  <span className="bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider">
                    #{customer.customer_number}
                  </span>
                )}
                {customer.status && (
                  <span className="bg-white/20 border border-white/30 px-2.5 py-1 rounded-full text-xs font-medium">
                    {customer.status}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-2 mt-5">
              {customer.email && (
                <a href={`mailto:${customer.email}`} title="אימייל"
                  className="w-10 h-10 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {customer.phone && (
                <a href={`tel:${customer.phone}`} title="שיחה"
                  className="w-10 h-10 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {customer.phone && (
                <button onClick={whatsapp} title="WhatsApp"
                  className="w-10 h-10 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => navigate(createPageUrl("Customers"), { state: { editCustomer: customer } })}
                title="עריכה"
                className="w-10 h-10 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
            {[
              customer.phone   && { icon: <Phone className="w-4 h-4 text-blue-500" />,    bg: "bg-blue-50",   label: "טלפון",       value: customer.phone },
              customer.email   && { icon: <Mail className="w-4 h-4 text-purple-500" />,   bg: "bg-purple-50", label: "אימייל",      value: customer.email },
              customer.id_number && { icon: <span className="text-[10px] font-black text-gray-500">ח"פ</span>, bg: "bg-gray-50", label: 'ח"פ / ת"ז', value: customer.id_number },
              customer.registration_date && {
                icon: <CheckCircle className="w-4 h-4 text-green-500" />,
                bg: "bg-green-50",
                label: "תאריך רישום",
                value: format(new Date(customer.registration_date), "dd MMMM yyyy", { locale: he })
              },
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${row.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">{row.label}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Financial summary */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">סיכום פיננסי</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-sm font-black text-green-700">₪{totalPaid.toLocaleString()}</p>
                <p className="text-[10px] text-green-600 mt-0.5">שולם</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-sm font-black text-amber-700">₪{totalPending.toLocaleString()}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">ממתין</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-sm font-black text-blue-700">{openTasks}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">משימות</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1.5">הערות</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
