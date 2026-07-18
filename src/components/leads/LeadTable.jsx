import { MessageCircle, FileText, Plus, Edit, Trash2, UserCheck, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

const STATUS_OPTIONS = ["התקבל", "שיחה חוזרת", "בוצע איפיון", "נשלחה הצעת מחיר", "נסגר בהצלחה (שולם)", "לא רלוונטי"];

const STATUS_COLORS = {
  "התקבל":                "bg-blue-100 text-blue-700",
  "שיחה חוזרת":           "bg-amber-100 text-amber-700",
  "בוצע איפיון":          "bg-purple-100 text-purple-700",
  "נשלחה הצעת מחיר":      "bg-orange-100 text-orange-700",
  "נסגר בהצלחה (שולם)":   "bg-green-100 text-green-700",
  "לא רלוונטי":           "bg-gray-100 text-gray-500",
};

const AVATAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function LeadTable({ leads, users, onEdit, onDelete, onWhatsApp, onQuote, onTask, onConvert, onRowClick, onStatusChange, loading }) {
  const getUserName = (id) => users.find(u => u.id === id)?.full_name || "—";

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      <span>טוען לידים...</span>
    </div>
  );

  if (!leads.length) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">לא נמצאו לידים</div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">ליד</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">טלפון</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">סטטוס</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">מקור</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">סוכן</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">זמן</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.map(lead => {
            const createdDate = lead.created_date ? new Date(lead.created_date) : null;
            const followupDate = lead.next_followup_at ? new Date(lead.next_followup_at) : null;
            const followupOverdue = followupDate && followupDate < new Date();
            const initials = (lead.full_name || lead.phone || "?").slice(0, 2).toUpperCase();

            return (
              <tr
                key={lead.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick(lead)}
              >
                {/* ליד */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(lead.full_name)}`}>
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900">{lead.full_name || "—"}</p>
                        {lead.lead_number && <span className="text-xs text-gray-400 font-mono">L-{lead.lead_number}</span>}
                      </div>
                      {lead.company_name && <p className="text-xs text-gray-400 truncate max-w-[140px]">{lead.company_name}</p>}
                    </div>
                  </div>
                </td>

                {/* טלפון */}
                <td className="px-4 py-3 text-gray-600 font-mono">{lead.phone || "—"}</td>

                {/* סטטוס */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <select
                    value={lead.status || "התקבל"}
                    onChange={e => onStatusChange(lead.id, e.target.value)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border-0 cursor-pointer outline-none focus:ring-2 focus:ring-blue-300 ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>

                {/* מקור */}
                <td className="px-4 py-3">
                  {lead.lead_source
                    ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md whitespace-nowrap">{lead.lead_source}</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* סוכן */}
                <td className="px-4 py-3 text-sm text-gray-600">{getUserName(lead.agent_id)}</td>

                {/* זמן */}
                <td className="px-4 py-3">
                  {createdDate && (
                    <div className="space-y-0.5">
                      <p className={`text-xs font-medium ${followupOverdue ? "text-red-500" : "text-gray-500"}`}>
                        {format(createdDate, "dd.MM.yyyy, HH:mm")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(createdDate, { addSuffix: true, locale: he })}
                      </p>
                      {followupDate && (
                        <p className={`text-xs flex items-center gap-0.5 ${followupOverdue ? "text-red-400 font-medium" : "text-gray-400"}`}>
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {format(followupDate, "dd.MM, HH:mm")}
                        </p>
                      )}
                    </div>
                  )}
                </td>

                {/* פעולות */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => onWhatsApp(lead)} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => onQuote(lead)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="הצעת מחיר">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => onTask(lead)} className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors" title="משימה">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => onConvert(lead)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors" title="המר ללקוח">
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(lead)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="עריכה">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(lead)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="מחיקה">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
