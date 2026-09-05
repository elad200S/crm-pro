import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const { Payment, Customer, User, Quote } = base44.entities;
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { logActivity } from "@/lib/activityLog";
import PaymentForm from "../components/payments/PaymentForm";
import PaymentTable from "../components/payments/PaymentTable";
import PaymentFilters from "../components/payments/PaymentFilters";

const isAdmin = (user) => user?.role === 'admin';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filters, setFilters] = useState({
    status: "הכל",
    dateRange: "הכל"
  });
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [prefill, setPrefill] = useState(null);

  const filterPayments = useCallback(() => {
    let filtered = payments;

    if (filters.status !== "הכל") {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    if (filters.dateRange !== "הכל") {
      const today = new Date();
      const daysAgo = {
        "שבוע": 7,
        "חודש": 30,
        "3חודשים": 90
      };
      
      if (daysAgo[filters.dateRange]) {
        const cutoffDate = new Date(today.getTime() - daysAgo[filters.dateRange] * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(payment => 
          new Date(payment.created_date) >= cutoffDate
        );
      }
    }

    setFilteredPayments(filtered);
  }, [payments, filters]);

  const loadData = useCallback(async (user) => {
    try {
      let paymentsData, customersData;

      if (isAdmin(user)) {
        [paymentsData, customersData] = await Promise.all([
          Payment.list('-created_date'),
          Customer.list()
        ]);
      } else {
        [paymentsData, customersData] = await Promise.all([
          Payment.filter({ created_by: user.email }, '-created_date'),
          Customer.filter({ created_by: user.email })
        ]);
      }

      setPayments(paymentsData);
      setCustomers(customersData);
    } catch (error) {
      console.error("שגיאה בטעינת נתונים:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // הגעה מ"צור חשבונית" בהסכם חתום — /Payments?quote=<id> פותח את הטופס ממולא מראש
  const loadPrefillFromQuote = useCallback(async () => {
    const quoteId = new URLSearchParams(window.location.search).get("quote");
    if (!quoteId) return;
    try {
      const quote = await Quote.get(quoteId);
      if (!quote?.customer_id) return; // חשבונית דורשת לקוח קיים, לא ליד
      const items = quote.items?.length
        ? quote.items
        : [{ description: quote.title || "עבודה לפי הסכם", quantity: 1, unit_price: quote.amount || 0, total: quote.amount || 0 }];
      const due = new Date();
      due.setDate(due.getDate() + 14);
      setPrefill({
        customer_id: quote.customer_id,
        quote_id: quote.id,
        items,
        due_date: due.toISOString().split("T")[0],
      });
      setShowForm(true);
    } catch (e) {
      console.error("שגיאה בטעינת הסכם לחשבונית:", e);
    }
  }, []);

  const initializeData = useCallback(async () => {
    try {
      // קבלת המשתמש הנוכחי
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // טעינת נתונים עם הגנה על פרטיות
      await loadData(user);
      await loadPrefillFromQuote();
    } catch (error) {
      console.error("שגיאה באתחול:", error);
      setLoading(false);
    }
  }, [loadData, loadPrefillFromQuote]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    filterPayments();
  }, [filterPayments]);

  const canEdit = (payment) =>
    isAdmin(currentUser) || payment.created_by === currentUser?.email;

  const handleSubmit = async (paymentData) => {
    try {
      if (editingPayment) {
        if (!canEdit(editingPayment)) {
          alert("אין לך הרשאה לערוך תשלום זה");
          return;
        }
        await Payment.update(editingPayment.id, paymentData);
        if (paymentData.status === "שולם" && editingPayment.status !== "שולם") {
          logActivity({
            entity_type: "payment", entity_id: editingPayment.id, action: "paid",
            summary: `חשבונית ${editingPayment.invoice_number || ""} סומנה כשולמה`,
            amount: paymentData.amount,
          });
        }
      } else {
        const invoiceNumber = `INV-${Date.now()}`;
        const created = await Payment.create({
          ...paymentData,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0]
        });
        logActivity({
          entity_type: "payment", entity_id: created.id, action: "created",
          summary: `נוצרה חשבונית ${invoiceNumber} על סך ₪${(paymentData.amount || 0).toLocaleString()}`,
          amount: paymentData.amount,
        });
      }
      setShowForm(false);
      setEditingPayment(null);
      setPrefill(null);
      loadData(currentUser);
    } catch (error) {
      console.error("שגיאה בשמירת תשלום:", error);
    }
  };

  const handleEdit = (payment) => {
    if (!canEdit(payment)) {
      alert("אין לך הרשאה לערוך תשלום זה");
      return;
    }
    setPrefill(null);
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleDeleteClick = (payment) => {
    if (!canEdit(payment)) {
      alert("אין לך הרשאה למחוק תשלום זה");
      return;
    }
    setPaymentToDelete(payment);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      try {
        await Payment.delete(paymentToDelete.id);
        setPaymentToDelete(null);
        loadData(currentUser);
      } catch (error) {
        console.error("שגיאה במחיקת תשלום:", error);
      }
    }
  };

  const sendReminder = async (payment) => {
    try {
      if (!canEdit(payment)) {
        alert("אין לך הרשאה לשלוח תזכורת לתשלום זה");
        return;
      }

      const customer = customers.find(c => c.id === payment.customer_id);
      if (!customer) return;

      await base44.integrations.Core.SendEmail({
        to: customer.email,
        subject: `תזכורת לתשלום - חשבונית ${payment.invoice_number}`,
        body: `שלום ${customer.first_name},\n\nזוהי תזכורת לתשלום חשבונית מספר: ${payment.invoice_number}\nסכום לתשלום: ₪${payment.amount}\nמועד אחרון לתשלום: ${payment.due_date}\n\nתיאור השירות: ${payment.service_description}\n\nאנא בצע את התשלום בהקדם האפשרי.\n\nתודה,\nצוות החברה`
      });

      await Payment.update(payment.id, {
        reminder_sent_date: new Date().toISOString().split('T')[0]
      });

      loadData(currentUser);
    } catch (error) {
      console.error("שגיאה בשליחת תזכורת:", error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : "לא ידוע";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול תשלומים</h1>
            <p className="text-gray-600">
              {filteredPayments.length} תשלומים מתוך {payments.length} סה"כ
              {!isAdmin(currentUser) && " (התשלומים שלך בלבד)"}
            </p>
          </div>
          <Button
            onClick={() => { setPrefill(null); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            תשלום חדש
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <PaymentFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Form */}
      {showForm && (
        <PaymentForm
          payment={editingPayment}
          prefill={prefill}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPayment(null);
            setPrefill(null);
          }}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <PaymentTable
          payments={filteredPayments}
          getCustomerName={getCustomerName}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onSendReminder={sendReminder}
          isAdmin={isAdmin(currentUser)}
        />
      </div>

      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את חשבונית מספר "{paymentToDelete?.invoice_number}"? פעולה זו הינה בלתי הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}