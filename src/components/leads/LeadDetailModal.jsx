import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building2, MessageCircle, Edit, Trash2, FileText, UserCheck, CheckCircle, Clock, Plus, ChevronDown, PenLine, Briefcase, StickyNote, Copy, Check, ArrowLeft } from "lucide-react";
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

// כפתור פעולה בראש הכרטיס — פיל שקוף על גבי הגרדיאנט, כדי שכל הפעולות
// יהיו נגישות במבט ראשון בלי לגלול למטה.
function HeaderAction({ icon: Icon, children, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 border backdrop-blur-sm transition-colors ${
        danger
          ? "bg-red-500/20 border-red-200/40 hover:bg-red-500/30 text-white"
          : "bg-white/15 border-white/25 hover:bg-white/25 text-white"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  );
}

// טלפון/מייל למעלה בכרטיס — גם קליק ישיר (חיוג/מייל) וגם העתקה, שני הדברים
// ביחד ולא אחד במקום השני.
function ContactChip({ icon: Icon, value, href }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("העתקה ללוח נכשלה:", err);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-white/15 border border-white/25 rounded-full py-1 pl-1 pr-2.5 text-xs">
      <a href={href} className="flex items-center gap-1.5 text-white hover:underline min-w-0">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate max-w-[170px]">{value}</span>
      </a>
      <button
        onClick={copy}
        title="העתק"
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-200" /> : <Copy className="w-3 h-3 text-white/80" />}
      </button>
    </div>
  );
}

function DocDropdown({ lead, onQuote, onClose: closeModal }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const ref = useRef();

  useEffect(() => {
    base44.entities.Quote.list('-created_date', 50)
      .then(all => setTemplates(all.filter(q => !q.lead_id && !q.customer_id)))
      .catch(e => console.error("טעינת תבניות מסמך נכשלה:", e));
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
      <HeaderAction icon={FileText} onClick={() => setOpen(o => !o)}>
        מסמך
        <ChevronDown className="w-3 h-3" />
      </HeaderAction>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[180px] text-right">
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

function SectionTitle({ icon: Icon, children, count }) {
  return (
    <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5 text-teal-600" />
      {children}
      {count != null && <span className="font-normal text-gray-400">({count})</span>}
    </p>
  );
}

export default function LeadDetailModal({ lead, users, onClose, onEdit, onDelete, onWhatsApp, onQuote, onConvert, onAddTask }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [signedQuotes, setSignedQuotes] = useState([]);

  useEffect(() => {
    if (lead?.id) {
      loadTasks();
      loadSignedQuotes();
    }
  }, [lead?.id]);

  const loadTasks = async () => {
    try {
      const all = await base44.entities.Task.list("-created_date", 100);
      setTasks(all.filter(t => t.lead_id === lead.id));
    } catch (e) {
      console.error("טעינת משימות הליד נכשלה:", e);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  // הסכמים חתומים ללקוח הזה — נתוני החתימה (client_signature, signed_date)
  // כבר נשמרים על ה-Quote בזמן החתימה; כאן רק שולפים ומציגים על כרטיס הליד.
  const loadSignedQuotes = async () => {
    try {
      const all = await base44.entities.Quote.list("-signed_date", 100);
      setSignedQuotes(all.filter(q => q.lead_id === lead.id && q.client_signature));
    } catch (e) {
      console.error("טעינת הסכמים חתומים לליד נכשלה:", e);
      setSignedQuotes([]);
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
    lead.id_number      && { label: 'ח"פ / ת"ז',    value: lead.id_number },
    lead.business_address && { label: "כתובת העסק", value: lead.business_address },
    lead.service_requested && { label: "שירות מבוקש", value: lead.service_requested },
    lead.last_contact_at && { label: "קשר אחרון",    value: format(new Date(lead.last_contact_at), "dd/MM/yy HH:mm", { locale: he }), red: false },
    lead.next_followup_at && { label: "מעקב הבא",    value: format(new Date(lead.next_followup_at), "dd/MM/yy HH:mm", { locale: he }), red: new Date(lead.next_followup_at) < new Date() },
  ].filter(Boolean);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">

        {/* ── Gradient Header — זהות + כל הפעולות, נגיש בלי לגלול ── */}
        <div className={`bg-gradient-to-br ${gradient} p-5 pb-4 text-white flex-shrink-0`}>
          <div className="flex items-start gap-4">
            <div className="w-[52px] h-[52px] bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight">
                {lead.full_name || lead.phone || "ליד ללא שם"}
                {lead.lead_number && <span className="text-sm text-white/70 font-mono font-normal mr-2">L-{lead.lead_number}</span>}
              </h2>
              {(lead.phone || lead.email) && (
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {lead.phone && <ContactChip icon={Phone} value={lead.phone} href={`tel:${lead.phone}`} />}
                  {lead.email && <ContactChip icon={Mail} value={lead.email} href={`mailto:${lead.email}`} />}
                </div>
              )}
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

          {/* פעולות — עברו לכאן מהפוטר כדי שיהיו נוחות ונגישות מיד */}
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/15">
            {lead.phone && (
              <HeaderAction icon={MessageCircle} onClick={() => { onWhatsApp(lead); onClose(); }}>
                וואטסאפ
              </HeaderAction>
            )}
            <DocDropdown lead={lead} onQuote={onQuote} onClose={onClose} />
            {lead.is_converted && lead.converted_customer_id ? (
              <HeaderAction
                icon={ArrowLeft}
                onClick={() => { navigate(`${createPageUrl("CustomerProfile")}?customer=${lead.converted_customer_id}`); onClose(); }}
              >
                לכרטיס הלקוח
              </HeaderAction>
            ) : !lead.is_converted && (
              <HeaderAction icon={UserCheck} onClick={() => { onConvert(lead); onClose(); }}>
                המרה
              </HeaderAction>
            )}
            {onAddTask && (
              <HeaderAction icon={Plus} onClick={() => { onAddTask(lead); onClose(); }}>
                משימה
              </HeaderAction>
            )}
            <HeaderAction icon={Edit} onClick={() => { onEdit(lead); onClose(); }}>
              עריכה
            </HeaderAction>
            <HeaderAction icon={Trash2} danger onClick={() => { onDelete(lead); onClose(); }}>
              מחיקה
            </HeaderAction>
          </div>
        </div>

        {/* ── גוף גלול, שתי עמודות — הכל גלוי בלי טאבים ── */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid md:grid-cols-2 gap-5">

            {/* עמודה ימנית: פרטים, הערות (טלפון/מייל כבר למעלה בכותרת) */}
            <div className="space-y-4">
              {detailItems.length > 0 && (
                <div>
                  <SectionTitle icon={Briefcase}>פרטים</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {detailItems.map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${item.red ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                        <p className="text-[10px] text-gray-400 mb-0.5">{item.label}</p>
                        <p className={`text-sm font-medium ${item.red ? "text-red-600" : "text-gray-800"}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lead.notes && (
                <div>
                  <SectionTitle icon={StickyNote}>הערות</SectionTitle>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* עמודה שמאלית: מסמכים חתומים, משימות */}
            <div className="space-y-4">
              <div>
                <SectionTitle icon={PenLine}>מסמכים</SectionTitle>
                {signedQuotes.length > 0 ? (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                    <p className="text-[10px] text-green-700 font-semibold mb-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> הסכם חתום
                    </p>
                    <div className="space-y-1">
                      {signedQuotes.map(q => (
                        <p key={q.id} className="text-sm text-gray-700">
                          {q.title || "הסכם"}
                          {q.signed_date && ` — נחתם ב-${format(new Date(q.signed_date), "dd/MM/yyyy", { locale: he })}`}
                          {q.amount ? ` · ₪${q.amount.toLocaleString()}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-2">אין הסכמים חתומים לליד זה</p>
                )}
              </div>

              <div>
                <SectionTitle icon={Clock} count={tasks.length}>משימות</SectionTitle>
                {loadingTasks ? (
                  <div className="h-8 animate-pulse bg-gray-100 rounded-lg" />
                ) : tasks.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">אין משימות לליד זה</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
