import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const { User, Payment, Quote, Lead, Customer } = base44.entities;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Percent, Wallet, ChevronRight, ChevronLeft, Info } from "lucide-react";

const isAdmin = (user) => user?.role === "admin" || user?.user_category === "מנהל_ראשי";

const monthKeyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function Commissions() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [monthDate, setMonthDate] = useState(new Date());
  const [rateEdits, setRateEdits] = useState({});
  const [saving, setSaving] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [usersData, paymentsData, quotesData, leadsData, customersData] = await Promise.all([
        User.list("-created_date", 200),
        Payment.list("-paid_date", 1000),
        Quote.list("-created_date", 1000),
        Lead.list("-created_date", 1000),
        Customer.list("-created_date", 1000),
      ]);
      setUsers(usersData);
      setPayments(paymentsData);
      setQuotes(quotesData);
      setLeads(leadsData);
      setCustomers(customersData);
    } catch (e) {
      console.error("טעינת נתוני עמלות נכשלה:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (!isAdmin(user)) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        await loadData();
      } catch (e) {
        console.error("שגיאה באתחול:", e);
        setLoading(false);
      }
    };
    init();
  }, [loadData]);

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין לך הרשאת גישה</h2>
          <p className="text-gray-600 mb-6">רק מנהלים יכולים לצפות בעמלות.</p>
          <Button onClick={() => window.history.back()}>חזור</Button>
        </div>
      </div>
    );
  }

  const monthKey = monthKeyOf(monthDate);
  const monthLabel = monthDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  // מוצא את הסוכן שאמור לקבל קרדיט על תשלום — דרך ההסכם המקושר, ואם הוא
  // מקושר ללקוח (לא ליד) - דרך הליד שממנו הלקוח הומר (source_from_lead_id).
  const attributeAgent = (payment) => {
    const quote = quotes.find(q => q.id === payment.quote_id);
    if (!quote) return null;
    if (quote.lead_id) {
      return leads.find(l => l.id === quote.lead_id)?.agent_id || null;
    }
    if (quote.customer_id) {
      const customer = customers.find(c => c.id === quote.customer_id);
      if (customer?.source_from_lead_id) {
        return leads.find(l => l.id === customer.source_from_lead_id)?.agent_id || null;
      }
    }
    return null;
  };

  const paidThisMonth = payments.filter(p =>
    p.status === "שולם" && p.paid_date && monthKeyOf(new Date(p.paid_date)) === monthKey
  );

  const byAgent = {};
  let unattributedTotal = 0;
  for (const p of paidThisMonth) {
    const agentId = attributeAgent(p);
    if (!agentId) {
      unattributedTotal += p.amount || 0;
      continue;
    }
    byAgent[agentId] = (byAgent[agentId] || 0) + (p.amount || 0);
  }

  const rows = users
    .map(u => ({
      user: u,
      revenue: byAgent[u.id] || 0,
      rate: rateEdits[u.id] ?? (u.commission_rate ?? 10),
    }))
    .filter(r => r.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const totalCommission = rows.reduce((s, r) => s + (r.revenue * r.rate) / 100, 0);

  const saveRate = async (userId) => {
    const rate = parseFloat(rateEdits[userId]);
    if (isNaN(rate)) return;
    setSaving(userId);
    try {
      await User.update(userId, { commission_rate: rate });
      await loadData();
    } catch (e) {
      console.error("שמירת אחוז עמלה נכשלה:", e);
      alert("שמירת האחוז נכשלה. נסה שוב.");
    } finally {
      setSaving(null);
    }
  };

  const shiftMonth = (delta) => {
    setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">עמלות</h1>
            <p className="text-gray-600">עמלה מחושבת על עסקאות ששולמו בפועל בחודש שנבחר, לפי אחוז לכל נציג</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(-1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-gray-700 min-w-[110px] text-center">{monthLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white rounded-lg border p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-xs text-gray-400">סה"כ עמלות לתשלום — {monthLabel}</p>
          <p className="text-2xl font-bold text-gray-900">₪{totalCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center py-12 text-gray-500">אין עסקאות ששולמו בחודש זה</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-3 font-medium text-gray-500">נציג</th>
                  <th className="text-right p-3 font-medium text-gray-500">הכנסה מיוחסת</th>
                  <th className="text-right p-3 font-medium text-gray-500">אחוז עמלה</th>
                  <th className="text-right p-3 font-medium text-gray-500">עמלה</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ user, revenue, rate }) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="p-3 font-medium text-gray-800">{user.full_name || user.email}</td>
                    <td className="p-3 font-bold text-gray-700">₪{revenue.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-20">
                          <Input
                            type="number" min="0" max="100" step="0.5"
                            value={rate}
                            onChange={e => setRateEdits(r => ({ ...r, [user.id]: e.target.value }))}
                            className="h-8 text-sm pl-6"
                          />
                          <Percent className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                        </div>
                        {String(rate) !== String(user.commission_rate ?? 10) && (
                          <Button size="sm" className="h-8 text-xs" disabled={saving === user.id}
                            onClick={() => saveRate(user.id)}>
                            {saving === user.id ? "שומר..." : "שמור"}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-orange-700">
                      ₪{((revenue * rate) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {unattributedTotal > 0 && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>₪{unattributedTotal.toLocaleString()} מתוך התשלומים החודש לא משויכים לאף נציג (חשבונית לא מקושרת להסכם/ליד) — לא נכללים בחישוב.</span>
        </div>
      )}
    </div>
  );
}
