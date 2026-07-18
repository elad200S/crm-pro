import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building2, MessageCircle, Edit, Trash2, FileText, UserCheck, CheckCircle, Clock, Plus, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const STATUS_GRADIENT = {
  "התקבל":                "from-blue-500 to-blue-700",
  "שיחה חוזרת":           "from-yellow-500 to-amber-600",
  "בוצע איפיון":          "from-purple-500 to-purple-700",
  "נשלחה הצעת מחיר":     "from-indigo-500 to-indigo-700",
  "לא רלוונטי":           "from-gray-400 to-gray-600",
  "נסגר בהצלחה (שולם)":  "from-green-500 to-emerald-700",
};

const priorityColors = {
  "נמוכה": "bg-blue-100 text-blue-800",
  "בינונית": "bg-yellow-100 text-yellow-800",
  "גבוהה": "bg-orange-100 text-orange-800",
  "קריטית": "bg-red-100 text-red-800"
};

function DocDropdown({ lead, onQuote, onClose: closeModal }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const ref = useRef();

  useEffect(() => {
    base44.entities.Quote.list('-created_date', 50)
      .then(all => setTemplates(all.filter(q => !q.lead_id && !q.customer_id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (template) => {
    onQuote(lead, template || null);
    closeModal();
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className="text-purple-600 border-purple-200 hover:bg-purple-50 h-8 gap-1"
      >
        <FileText className="w-3.5 h-3.5" />
        מסמך
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      {open && (
        <div className="absolute bottom-full mb-1 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[180px]">
          {templates.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">אין תבניות</p>
          ) : templates.map(t => (
            <button key={t.id} onClick={() => pick(t)}
              className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
              {t.title || "מסמך ללא כותרת"}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={() => pick(null)}
              className="w-full text-right px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              + מסמך חדש (ריק)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadDetailModal({ lead, users, onClose, onEdit, onDelete, onWhatsApp, onQuote, onConvert, onAddTask }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (lead?.id) loadTasks();
  }, [lead?.id]);

  const loadTasks = async () => {
    try {
      const all = await base44.entities.Task.list("-created_date", 100);
      setTasks(all.filter(t => t.lead_id === lead.id));
    } catch (e) {
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const markDone = async (taskId) => {
    await base44.entities.Task.update(taskId, { status: "הושלם" });
    loadTasks();
  };

  if (!lead) return null;

  const agentName = users?.find(u => u.id === lead.agent_id)?.full_name;
  const gradient = STATUS_GRADIENT[lead.status] || "from-gray-500 to-gray-700";
  const initials = (lead.full_name || lead.phone || "?")[0]?.toUpperCase() || "?";

  const detailItems = [
    agentName           && { label: "סוכן מטפל",    value: agentName },
    lead.service_requested && { label: "שירות מבוקש", value: lead.service_requested },
    lead.last_contact_at && { label: "קשר אחרון",    value: format(new Date(lead.last_contact_at), "dd/MM/yy HH:mm", { locale: he }), red: false },
    lead.next_followup_at && { label: "מעקב הבא",    value: format(new Date(lead.next_followup_at), "dd/MM/yy HH:mm", { locale: he }), red: new Date(lead.next_followup_at) < new Date() },
  ].filter(Boolean);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">

        {/* ── Gradient Header ── */}
        <div className={`bg-gradient-to-br ${gradient} p-5 text-white flex-shrink-0`}>
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 w-[52px] h-[52px] bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight">
                {lead.full_name || lead.phone || "ליד ללא שם"}
                {lead.lead_number && <span className="text-sm text-white/70 font-mono font-normal mr-2">L-{lead.lead_number}</span>}
              </h2>
              {lead.company_name && (
                <p className="text-white/70 text-sm mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />{lead.company_name}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {lead.status}
                </span>
                {lead.lead_source && (
                  <span className="bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full text-xs">
                    {lead.lead_source}
                  </span>
                )}
                {lead.is_converted && (
                  <span className="bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full text-xs">
                    הומר ✓
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Contact */}
          {(lead.phone || lead.email) && (
            <div className="grid grid-cols-2 gap-2">
              {lead.phone && (
                <a href={`tel:${lead.phone}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400">טלפון</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{lead.phone}</p>
                  </div>
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400">אימייל</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{lead.email}</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Details grid */}
          {detailItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {detailItems.map((item, i) => (
                <div key={i} className={`p-3 rounded-xl border ${item.red ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                  <p className="text-[10px] text-gray-400 mb-0.5">{item.label}</p>
                  <p className={`text-sm font-medium ${item.red ? "text-red-600" : "text-gray-800"}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] text-amber-700 font-semibold mb-1">הערות</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
            </div>
          )}

          {/* Tasks */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-500" />
                משימות
                <span className="text-xs font-normal text-gray-400">({tasks.length})</span>
              </h4>
              {onAddTask && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => { onAddTask(lead); onClose(); }}>
                  <Plus className="w-3 h-3" /> הוסף
                </Button>
              )}
            </div>

            {loadingTasks ? (
              <div className="h-8 animate-pulse bg-gray-100 rounded-lg" />
            ) : tasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">אין משימות לליד זה</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {tasks.map(task => {
                  const isOverdue = task.status !== "הושלם" && task.due_date && new Date(task.due_date) < new Date();
                  return (
                    <div key={task.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs border ${isOverdue ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === "הושלם" ? "bg-green-400" : isOverdue ? "bg-red-400" : "bg-amber-400"}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium block truncate ${task.status === "הושלם" ? "line-through text-gray-400" : ""}`}>{task.title}</span>
                        {task.due_date && (
                          <span className={`text-[10px] ${isOverdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                            {format(new Date(task.due_date), "dd/MM/yyyy", { locale: he })}{isOverdue && " · באיחור"}
                          </span>
                        )}
                      </div>
                      {task.status !== "הושלם" && (
                        <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0 text-green-600" onClick={() => markDone(task.id)}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: Actions ── */}
        <div className="border-t bg-gray-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 h-8">
            סגור
          </Button>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {lead.phone && (
              <Button variant="outline" size="sm" onClick={() => { onWhatsApp(lead); onClose(); }}
                className="text-green-600 border-green-200 hover:bg-green-50 h-8 gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> וואטסאפ
              </Button>
            )}
            <DocDropdown lead={lead} onQuote={onQuote} onClose={onClose} />
            {!lead.is_converted && (
              <Button variant="outline" size="sm" onClick={() => { onConvert(lead); onClose(); }}
                className="text-teal-600 border-teal-200 hover:bg-teal-50 h-8 gap-1">
                <UserCheck className="w-3.5 h-3.5" /> המרה
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { onEdit(lead); onClose(); }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 gap-1">
              <Edit className="w-3.5 h-3.5" /> עריכה
            </Button>
            <Button variant="outline" size="sm" onClick={() => { onDelete(lead); onClose(); }}
              className="text-red-600 border-red-200 hover:bg-red-50 h-8 gap-1">
              <Trash2 className="w-3.5 h-3.5" /> מחיקה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
