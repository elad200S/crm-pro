import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building2, MessageCircle, Edit, Trash2, FileText, UserCheck, CheckCircle, Clock, Plus, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "התקבל": "bg-blue-100 text-blue-800",
  "שיחה חוזרת": "bg-yellow-100 text-yellow-800",
  "בוצע איפיון": "bg-purple-100 text-purple-800",
  "נשלחה הצעת מחיר": "bg-orange-100 text-orange-800",
  "לא רלוונטי": "bg-gray-100 text-gray-600",
  "נסגר בהצלחה (שולם)": "bg-green-100 text-green-800",
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
        className="text-purple-600 border-purple-200 hover:bg-purple-50 flex items-center gap-1"
      >
        <FileText className="w-4 h-4" />
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

  const Field = ({ label, value }) => value ? (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  ) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {lead.full_name || lead.phone || "ליד ללא שם"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
            {lead.lead_source && <Badge variant="outline">{lead.lead_source}</Badge>}
            {lead.is_converted && <Badge className="bg-green-100 text-green-700">הומר ללקוח</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.company_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{lead.company_name}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-3">
            <Field label="סוכן מטפל" value={agentName} />
            <Field label="שירות מבוקש" value={lead.service_requested} />
            <Field label="קשר אחרון" value={lead.last_contact_at ? format(new Date(lead.last_contact_at), "dd/MM/yyyy HH:mm", { locale: he }) : null} />
            <Field label="מעקב הבא" value={lead.next_followup_at ? format(new Date(lead.next_followup_at), "dd/MM/yyyy HH:mm", { locale: he }) : null} />
            <Field label="תאריך יצירה" value={lead.created_date ? format(new Date(lead.created_date), "dd/MM/yyyy", { locale: he }) : null} />
            <Field label="פרטי מקור" value={lead.source_details} />
          </div>

          {lead.notes && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 mb-1">הערות</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Tasks Section */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4" /> משימות ({tasks.length})
              </h4>
              {onAddTask && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { onAddTask(lead); onClose(); }}>
                  <Plus className="w-3 h-3 ml-1" /> הוסף
                </Button>
              )}
            </div>

            {loadingTasks ? (
              <p className="text-xs text-gray-400">טוען...</p>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">אין משימות לליד זה</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks.map(task => {
                  const isOverdue = task.status !== "הושלם" && new Date(task.due_date) < new Date();
                  return (
                    <div key={task.id} className={`flex items-center justify-between p-2 rounded-lg text-xs border ${isOverdue ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium truncate block ${task.status === "הושלם" ? "line-through text-gray-400" : ""}`}>{task.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}>
                            {format(new Date(task.due_date), "dd/MM/yyyy", { locale: he })}
                            {isOverdue && " ⚠"}
                          </span>
                          <Badge className={`text-[10px] py-0 px-1 ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                        </div>
                      </div>
                      {task.status !== "הושלם" && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-green-600" onClick={() => markDone(task.id)}>
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

        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>סגור</Button>
          <div className="flex gap-2 flex-wrap">
            {lead.phone && (
              <Button variant="outline" size="sm" onClick={() => { onWhatsApp(lead); onClose(); }}
                className="text-green-600 border-green-200 hover:bg-green-50">
                <MessageCircle className="w-4 h-4 ml-1" /> וואטסאפ
              </Button>
            )}
            <DocDropdown lead={lead} onQuote={onQuote} onClose={onClose} />
            {!lead.is_converted && (
              <Button variant="outline" size="sm" onClick={() => { onConvert(lead); onClose(); }}
                className="text-teal-600 border-teal-200 hover:bg-teal-50">
                <UserCheck className="w-4 h-4 ml-1" /> המרה
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { onEdit(lead); onClose(); }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Edit className="w-4 h-4 ml-1" /> עריכה
            </Button>
            <Button variant="outline" size="sm" onClick={() => { onDelete(lead); onClose(); }}
              className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 ml-1" /> מחיקה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}