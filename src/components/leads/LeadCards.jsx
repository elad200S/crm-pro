import React, { useState, useEffect, useRef } from "react";
import { Phone, MessageCircle, FileText, Plus, Edit, Trash2, UserCheck, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const STATUS_CONFIG = {
  "התקבל":                  { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500" },
  "שיחה חוזרת":             { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500" },
  "בוצע איפיון":            { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  "נשלחה הצעת מחיר":       { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  "לא רלוונטי":             { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400" },
  "נסגר בהצלחה (שולם)":    { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500" },
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500",
];

const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const isUrgent = (lead) => {
  const now = new Date();
  if (lead.next_followup_at && new Date(lead.next_followup_at) < now) return true;
  if (lead.status === "התקבל" && lead.created_date) {
    const hoursSince = (now - new Date(lead.created_date)) / 36e5;
    if (hoursSince > 24) return true;
  }
  return false;
};

function QuoteDropdown({ lead, onQuote }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const ref = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const all = await base44.entities.Quote.list('-created_date', 50);
        // תבניות = מסמכים ללא ליד או לקוח מחובר
        setTemplates(all.filter(q => !q.lead_id && !q.customer_id));
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors font-medium"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>מסמך</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 min-w-[160px]">
          {templates.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">אין תבניות — צור מסמך בדף "מסמכים"</p>
          ) : templates.map(t => (
            <button
              key={t.id}
              onClick={() => { onQuote(lead, t); setOpen(false); }}
              className="w-full text-right px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {t.title || "מסמך ללא כותרת"}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { onQuote(lead, null); setOpen(false); }}
              className="w-full text-right px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              + מסמך חדש (ריק)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadCards({ leads, users, onEdit, onDelete, onWhatsApp, onQuote, onTask, onConvert, loading, onRowClick }) {
  const getUserName = (id) => users.find(u => u.id === id)?.full_name || null;

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      <span>טוען לידים...</span>
    </div>
  );

  if (!leads.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-3">
      <UserCheck className="w-12 h-12 opacity-30" />
      <p className="text-gray-400 text-sm">לא נמצאו לידים</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {leads.map(lead => {
        const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG["התקבל"];
        const urgent = isUrgent(lead);
        const initials = (lead.full_name || lead.phone || "?").slice(0, 2).toUpperCase();
        const agentName = getUserName(lead.agent_id);

        return (
          <div
            key={lead.id}
            onClick={() => onRowClick(lead)}
            className={`bg-white rounded-2xl border cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col
              ${urgent ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}`}
          >
            {/* Top strip — urgent indicator */}
            {urgent && (
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-red-500">דורש טיפול</span>
              </div>
            )}

            {/* Main content */}
            <div className="p-4 flex items-start gap-3 flex-1">
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(lead.full_name)}`}>
                <span className="text-white text-sm font-bold">{initials}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                    {lead.full_name || lead.phone}
                  </h3>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {lead.status || "חדש"}
                  </span>
                </div>

                {lead.company_name && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{lead.company_name}</p>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {lead.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </span>
                  )}
                  {lead.lead_source && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{lead.lead_source}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  {agentName && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> {agentName}
                    </span>
                  )}
                  {lead.next_followup_at && (
                    <span className={`text-xs flex items-center gap-1 ${
                      new Date(lead.next_followup_at) < new Date() ? "text-red-500 font-medium" : "text-gray-400"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {format(new Date(lead.next_followup_at), "dd/MM", { locale: he })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onWhatsApp(lead)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-green-600 hover:bg-green-50 transition-colors font-medium"
                title="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <QuoteDropdown lead={lead} onQuote={onQuote} />
              <button
                onClick={() => onTask(lead)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-violet-600 hover:bg-violet-50 transition-colors font-medium"
                title="הוסף משימה"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">משימה</span>
              </button>
              <button
                onClick={() => onConvert(lead)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                title="המר ללקוח"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1" />
              <button
                onClick={() => onEdit(lead)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="עריכה"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(lead)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="מחיקה"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
