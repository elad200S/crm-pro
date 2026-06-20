import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const { Task, Payment, Interaction } = base44.entities;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X, Phone, Mail, MapPin, Building2, Edit, Trash2,
  Calendar, CreditCard, MessageSquare, User, ExternalLink,
  CheckCircle2, Clock, AlertCircle, Plus, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusConfig = {
  "חדש":       { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500" },
  "פוטנציאלי": { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  "פעיל":      { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500" },
  "לא פעיל":   { bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500" },
  "סגור":      { bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400" },
};

const taskStatusIcon = { "פתוח": Clock, "בטיפול": AlertCircle, "הושלם": CheckCircle2, "דחוי": X };
const taskStatusColor = { "פתוח": "text-blue-500", "בטיפול": "text-yellow-500", "הושלם": "text-green-500", "דחוי": "text-gray-400" };
const paymentStatusColor = { "שולם": "bg-green-100 text-green-800", "נוצר": "bg-gray-100 text-gray-700", "נשלח": "bg-blue-100 text-blue-800", "מחכה לתשלום": "bg-yellow-100 text-yellow-800", "פג תוקף": "bg-red-100 text-red-800", "מבוטל": "bg-gray-100 text-gray-500" };
const interactionTypeLabel = { call: "שיחה", meeting: "פגישה", email: "אימייל", whatsapp: "WhatsApp", sms: "SMS", other: "אחר" };
const interactionTypeColor = { call: "bg-blue-100 text-blue-700", meeting: "bg-purple-100 text-purple-700", email: "bg-gray-100 text-gray-700", whatsapp: "bg-green-100 text-green-700", sms: "bg-orange-100 text-orange-700", other: "bg-gray-100 text-gray-600" };

function Avatar({ name, size = "lg" }) {
  const initials = [name?.split(" ")[0]?.[0], name?.split(" ")[1]?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const colors = ["from-blue-500 to-blue-600", "from-purple-500 to-purple-600", "from-green-500 to-green-600", "from-orange-500 to-orange-600", "from-pink-500 to-pink-600"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-blue-600 hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function CustomerCard({ customer, onClose, onEdit, onDelete, currentUser, onUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  const statusStyle = statusConfig[customer.status] || statusConfig["חדש"];

  useEffect(() => {
    loadRelatedData();
  }, [customer.id]);

  const loadRelatedData = async () => {
    setLoading(true);
    try {
      const [t, p, i] = await Promise.all([
        Task.filter({ customer_id: customer.id }, '-created_date', 20),
        Payment.filter({ customer_id: customer.id }, '-created_date', 20),
        Interaction.filter({ customer_id: customer.id }, '-interaction_date', 20),
      ]);
      setTasks(t);
      setPayments(p);
      setInteractions(i);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments
    .filter(p => p.status === "שולם")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingAmount = payments
    .filter(p => ["נוצר", "נשלח", "מחכה לתשלום"].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(customer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                עריכה
              </button>
              <button
                onClick={() => onDelete(customer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/70 hover:bg-red-500/90 text-white text-sm rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                מחיקה
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Avatar name={fullName} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-1">{fullName || "לקוח ללא שם"}</h2>
              {customer.company && (
                <p className="text-blue-100 text-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {customer.company}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {customer.status}
                </span>
                {customer.source && (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-white/20 text-white">
                    {customer.source}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{tasks.length}</p>
              <p className="text-xs text-blue-100">משימות</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">₪{totalPaid.toLocaleString()}</p>
              <p className="text-xs text-blue-100">שולם</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{interactions.length}</p>
              <p className="text-xs text-blue-100">אינטראקציות</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 px-6 py-3 border-b bg-gray-50 flex-shrink-0">
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Phone className="w-4 h-4" />
              התקשר
            </a>
          )}
          {customer.phone && (
            <a
              href={`https://wa.me/972${customer.phone?.replace(/^0/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              אימייל
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden" dir="rtl">
            <TabsList className="flex-shrink-0 w-full rounded-none border-b bg-white px-4 justify-start gap-1 h-12">
              <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4">
                <User className="w-4 h-4 ml-1.5" /> פרטים
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4">
                <Calendar className="w-4 h-4 ml-1.5" /> משימות {tasks.length > 0 && <span className="mr-1 w-4 h-4 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center justify-center">{tasks.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4">
                <CreditCard className="w-4 h-4 ml-1.5" /> תשלומים {payments.length > 0 && <span className="mr-1 w-4 h-4 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center justify-center">{payments.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="interactions" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4">
                <MessageSquare className="w-4 h-4 ml-1.5" /> היסטוריה
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Details Tab */}
              <TabsContent value="details" className="m-0 p-6 space-y-1">
                <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">פרטי קשר</h3>
                  <InfoRow icon={Phone} label="טלפון" value={customer.phone} href={`tel:${customer.phone}`} />
                  <InfoRow icon={Mail} label="אימייל" value={customer.email} href={`mailto:${customer.email}`} />
                  <InfoRow icon={Building2} label="חברה" value={customer.company} />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-1 mt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">כתובת</h3>
                  <InfoRow icon={MapPin} label="רחוב" value={customer.street} />
                  <InfoRow icon={MapPin} label="עיר" value={customer.city} />
                  <InfoRow icon={MapPin} label="מיקוד" value={customer.postal_code} />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">מידע נוסף</h3>
                  <InfoRow icon={Calendar} label="תאריך רישום" value={
                    customer.registration_date || customer.created_date
                      ? format(new Date(customer.registration_date || customer.created_date), "dd MMMM yyyy", { locale: he })
                      : null
                  } />
                </div>

                {customer.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
                    <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">הערות</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                  </div>
                )}

                {pendingAmount > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mt-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-700">יתרה לתשלום</p>
                      <p className="text-lg font-bold text-orange-600">₪{pendingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="m-0 p-6">
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>אין משימות עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map(task => {
                      const Icon = taskStatusIcon[task.status] || Clock;
                      const color = taskStatusColor[task.status] || "text-gray-400";
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "הושלם";
                      return (
                        <div key={task.id} className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${isOverdue ? "border-red-200 bg-red-50" : ""}`}>
                          <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                task.status === "הושלם" ? "bg-green-100 text-green-700" :
                                task.status === "בטיפול" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>{task.status}</span>
                              {task.due_date && (
                                <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                                  {format(new Date(task.due_date), "dd/MM/yyyy", { locale: he })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="m-0 p-6">
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : (
                  <>
                    {/* Payment summary */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                        <p className="text-xl font-bold text-green-700">₪{totalPaid.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-0.5">סה"כ שולם</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                        <p className="text-xl font-bold text-orange-700">₪{pendingAmount.toLocaleString()}</p>
                        <p className="text-xs text-orange-600 mt-0.5">ממתין לתשלום</p>
                      </div>
                    </div>

                    {/* Payment link infrastructure */}
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/50 text-center mb-4">
                      <CreditCard className="w-7 h-7 mx-auto text-blue-400 mb-1.5" />
                      <p className="text-sm font-medium text-blue-700 mb-0.5">קישור לסליקה עצמאית</p>
                      <p className="text-xs text-blue-400 mb-3">שלח ללקוח קישור לתשלום ישיר (Grow / Cardcom / iCredit)</p>
                      <button
                        onClick={() => alert("תשתית סליקה — תוטמע בקרוב")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-600 text-xs rounded-lg hover:bg-blue-50 transition-colors font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        שלח קישור תשלום
                      </button>
                    </div>
                    {payments.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>אין תשלומים עדיין</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {payments.map(payment => (
                          <div key={payment.id} className="bg-white border rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800">₪{payment.amount?.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 mt-0.5 truncate">{payment.service_description}</p>
                                {payment.due_date && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: he })}
                                  </p>
                                )}
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${paymentStatusColor[payment.status] || "bg-gray-100 text-gray-600"}`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Interactions Tab */}
              <TabsContent value="interactions" className="m-0 p-6">
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : interactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>אין היסטוריית אינטראקציות</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {interactions.map(interaction => (
                        <div key={interaction.id} className="flex items-start gap-4 relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 z-10 ${interactionTypeColor[interaction.type] || "bg-gray-100 text-gray-600"}`}>
                            {interactionTypeLabel[interaction.type]?.[0] || "?"}
                          </div>
                          <div className="flex-1 bg-white border rounded-xl p-4 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${interactionTypeColor[interaction.type] || "bg-gray-100 text-gray-600"}`}>
                                {interactionTypeLabel[interaction.type] || interaction.type}
                              </span>
                              {interaction.outcome && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  interaction.outcome === "positive" ? "bg-green-100 text-green-700" :
                                  interaction.outcome === "negative" ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {interaction.outcome === "positive" ? "חיובי" : interaction.outcome === "negative" ? "שלילי" : interaction.outcome === "neutral" ? "ניטרלי" : "נדרש המשך"}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 mr-auto">
                                {interaction.interaction_date
                                  ? format(new Date(interaction.interaction_date), "dd/MM/yyyy HH:mm", { locale: he })
                                  : ""}
                              </span>
                            </div>
                            <p className="font-medium text-gray-800 text-sm">{interaction.subject}</p>
                            {interaction.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-3">{interaction.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}