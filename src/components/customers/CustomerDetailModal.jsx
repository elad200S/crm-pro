import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, Building2, Edit, Trash2, CreditCard, ExternalLink, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "חדש": "bg-gray-100 text-gray-800",
  "פוטנציאלי": "bg-yellow-100 text-yellow-800",
  "פעיל": "bg-green-100 text-green-800",
  "לא פעיל": "bg-red-100 text-red-800",
  "סגור": "bg-gray-100 text-gray-800"
};

const paymentStatusConfig = {
  "שולם":           { color: "bg-green-100 text-green-800",  icon: CheckCircle2 },
  "מחכה לתשלום":   { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  "נשלח":           { color: "bg-blue-100 text-blue-800",    icon: Clock },
  "נוצר":           { color: "bg-gray-100 text-gray-700",    icon: Clock },
  "פג תוקף":        { color: "bg-red-100 text-red-700",      icon: AlertCircle },
  "מבוטל":          { color: "bg-gray-100 text-gray-500",    icon: AlertCircle },
};

export default function CustomerDetailModal({ customer, onClose, onEdit, onDelete, onAddPayment }) {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (customer) loadPayments();
  }, [customer]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const data = await base44.entities.Payment.filter({ customer_id: customer.id }, '-created_date', 50);
      setPayments(data);
    } catch {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  if (!customer) return null;

  const totalPaid = payments.filter(p => p.status === "שולם").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status !== "שולם" && p.status !== "מבוטל").reduce((s, p) => s + (p.amount || 0), 0);

  const Field = ({ label, value }) => value ? (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  ) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {customer.first_name} {customer.last_name}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge className={statusColors[customer.status]}>{customer.status}</Badge>
            {customer.company && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {customer.company}
              </span>
            )}
            {customer.source && <Badge variant="outline" className="text-xs">{customer.source}</Badge>}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="flex-shrink-0 mb-3">
            <TabsTrigger value="details">פרטים</TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              תשלומים
              {payments.length > 0 && (
                <span className="mr-1 bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5 font-semibold">
                  {payments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB: פרטים */}
          <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <Field label="תאריך רישום" value={
                customer.registration_date
                  ? format(new Date(customer.registration_date), "dd/MM/yyyy", { locale: he })
                  : customer.created_date
                    ? format(new Date(customer.created_date), "dd/MM/yyyy", { locale: he })
                    : null
              } />
            </div>

            {customer.notes && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-600 font-semibold mb-1">הערות</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </TabsContent>

          {/* TAB: תשלומים */}
          <TabsContent value="payments" className="flex-1 overflow-y-auto mt-0 space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="text-xs text-green-600 font-medium mb-1">שולם סה"כ</div>
                <div className="text-xl font-bold text-green-700">₪{totalPaid.toLocaleString()}</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <div className="text-xs text-orange-600 font-medium mb-1">ממתין לתשלום</div>
                <div className="text-xl font-bold text-orange-700">₪{totalPending.toLocaleString()}</div>
              </div>
            </div>

            {/* Payment infrastructure placeholder */}
            <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/50 text-center">
              <CreditCard className="w-8 h-8 mx-auto text-blue-400 mb-2" />
              <p className="text-sm font-medium text-blue-700 mb-1">קישור לסליקה</p>
              <p className="text-xs text-blue-500 mb-3">ניתן לשלוח ללקוח קישור לתשלום עצמאי</p>
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
                onClick={() => alert("תשתית סליקה — יוטמע בקרוב (Grow, Cardcom, iCredit)")}
              >
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
                שלח קישור תשלום
              </Button>
            </div>

            {/* Payment history */}
            {loadingPayments ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                אין תשלומים ללקוח זה עדיין
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map(payment => {
                  const cfg = paymentStatusConfig[payment.status] || paymentStatusConfig["נוצר"];
                  const Icon = cfg.icon;
                  const overdue = payment.status !== "שולם" && payment.due_date && new Date(payment.due_date) < new Date();
                  return (
                    <div
                      key={payment.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${overdue ? "border-red-200 bg-red-50" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${overdue ? "text-red-500" : "text-gray-400"}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{payment.invoice_number}</div>
                          <div className="text-xs text-gray-500">{payment.service_description}</div>
                          {payment.due_date && (
                            <div className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                              {overdue ? "⚠ " : ""}מועד: {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: he })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">₪{(payment.amount || 0).toLocaleString()}</div>
                          <Badge className={`text-xs ${cfg.color}`}>{payment.status}</Badge>
                        </div>
                        {payment.payment_link && (
                          <a href={payment.payment_link} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add payment */}
            {onAddPayment && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-gray-500 hover:text-blue-600 hover:border-blue-400"
                onClick={() => { onAddPayment(customer); onClose(); }}
              >
                <Plus className="w-4 h-4 ml-1" /> הוסף תשלום
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-3 border-t flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>סגור</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { onEdit(customer); onClose(); }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Edit className="w-4 h-4 ml-1" /> עריכה
            </Button>
            <Button variant="outline" size="sm" onClick={() => { onDelete(customer); onClose(); }}
              className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 ml-1" /> מחיקה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
