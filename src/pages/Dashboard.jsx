import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const { Customer, Payment, Task, Lead } = base44.entities;
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { useNavigate, Link } from "react-router-dom";
import {
  Users, CreditCard, DollarSign, Target,
  Plus, AlertCircle, Clock, UserPlus, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/dashboard/StatsCard";
import TaskList from "../components/dashboard/TaskList";
import LeadsByStatus from "../components/dashboard/LeadsByStatus";
import PaymentChart from "../components/dashboard/PaymentChart";

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

function PipelineStage({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 min-w-0 text-center">
      <span className="text-2xl font-black text-gray-900">{count}</span>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden my-2">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} />
      </div>
      <p className="text-xs text-gray-500 leading-tight">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const isAdmin = user.role === 'admin';
      const [customersData, paymentsData, tasksData, leadsData] = await Promise.all([
        isAdmin ? Customer.list('-created_date', 100) : Customer.filter({ created_by: user.email }, '-created_date', 100),
        isAdmin ? Payment.list('-created_date', 500) : Payment.filter({ created_by: user.email }, '-created_date', 500),
        isAdmin ? Task.list('-due_date', 50) : Task.filter({ assigned_to: user.id }, '-due_date', 50),
        Lead.list('-created_date', 200)
      ]);
      setCustomers(customersData);
      setPayments(paymentsData);
      setTasks(tasksData);
      setLeads(leadsData);
    } catch (e) {
      console.error("שגיאה בטעינת dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const MONTHLY_DEALS_TARGET = 10;

  const activeCustomers = customers.filter(c => c.status === "פעיל").length;

  const monthlyRevenue = payments
    .filter(p => p.status === "שולם" && p.paid_date &&
      new Date(p.paid_date).getMonth() === currentMonth &&
      new Date(p.paid_date).getFullYear() === currentYear)
    .reduce((s, p) => s + (p.amount || 0), 0);

  const lastMonthRevenue = payments
    .filter(p => p.status === "שולם" && p.paid_date &&
      new Date(p.paid_date).getMonth() === prevMonth &&
      new Date(p.paid_date).getFullYear() === prevYear)
    .reduce((s, p) => s + (p.amount || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : null;

  const pendingPaymentsTotal = payments
    .filter(p => ["מחכה לתשלום", "נשלח", "נוצר"].includes(p.status))
    .reduce((s, p) => s + (p.amount || 0), 0);

  const monthlyDeals = payments.filter(p => {
    const d = new Date(p.created_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status !== "מבוטל";
  }).length;

  const overdueTasks = tasks.filter(t =>
    t.status !== "הושלם" && t.status !== "דחוי" && t.due_date && new Date(t.due_date) < now
  );

  const isAdmin = currentUser?.role === 'admin';
  const relevantLeads = isAdmin ? leads : leads.filter(l => l.agent_id === currentUser?.id);

  const PIPELINE_STAGES = [
    { key: "התקבל",                   label: "התקבל",       color: "bg-blue-400" },
    { key: "שיחה חוזרת",              label: "שיחה חוזרת",  color: "bg-yellow-400" },
    { key: "בוצע איפיון",             label: "איפיון",      color: "bg-purple-400" },
    { key: "נשלחה הצעת מחיר",        label: "הצעת מחיר",  color: "bg-indigo-400" },
    { key: "נסגר בהצלחה (שולם)",     label: "נסגר",        color: "bg-green-500" },
  ];

  const getGreeting = () => {
    const h = parseInt(new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hour12: false }));
    if (h >= 5 && h < 12) return 'בוקר טוב';
    if (h >= 12 && h < 17) return 'צהריים טובים';
    if (h >= 17 && h < 21) return 'ערב טוב';
    return 'לילה טוב';
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-xs text-gray-400 font-medium">
            {format(now, "EEEE, dd MMMM yyyy", { locale: he })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
            {getGreeting()}{currentUser?.full_name ? `, ${currentUser.full_name.split(' ')[0]}` : ''} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl("Leads"))}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" /> ליד חדש
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl("Calendar"))}
            className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" /> משימה
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl("Quotes"))}
            className="text-green-600 border-green-200 hover:bg-green-50 gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" /> מסמך
          </Button>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {!loading && (overdueTasks.length > 0 || pendingPaymentsTotal > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          {overdueTasks.length > 0 && (
            <Link to={createPageUrl("Calendar")}
              className="flex items-center gap-1.5 text-sm text-amber-800 hover:text-amber-900 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {overdueTasks.length} משימות באיחור ←
            </Link>
          )}
          {pendingPaymentsTotal > 0 && (
            <Link to={createPageUrl("Payments")}
              className="flex items-center gap-1.5 text-sm text-amber-800 hover:text-amber-900 font-medium">
              <CreditCard className="w-3.5 h-3.5" />
              ₪{pendingPaymentsTotal.toLocaleString()} ממתינים לגבייה ←
            </Link>
          )}
        </div>
      )}

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="לקוחות פעילים"
            value={activeCustomers}
            icon={Users}
            color="blue"
            trend="לקוחות במערכת"
            linkTo={createPageUrl("Customers")}
          />
          <StatsCard
            title="עסקאות החודש"
            value={`${monthlyDeals} / ${MONTHLY_DEALS_TARGET}`}
            icon={Target}
            color="orange"
            trend={monthlyDeals >= MONTHLY_DEALS_TARGET ? 'יעד הושג! 🎉' : `נותרו ${MONTHLY_DEALS_TARGET - monthlyDeals} ליעד`}
            progress={Math.min((monthlyDeals / MONTHLY_DEALS_TARGET) * 100, 100)}
            linkTo={createPageUrl("Payments")}
          />
          <StatsCard
            title={isAdmin ? "הכנסות החודש" : "ההכנסות שלי"}
            value={`₪${monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            trend={revenueGrowth !== null
              ? (revenueGrowth >= 0 ? `↑ +${revenueGrowth}% מהחודש שעבר` : `↓ ${revenueGrowth}% מהחודש שעבר`)
              : "הכנסות ששולמו"}
            trendUp={revenueGrowth !== null ? revenueGrowth >= 0 : null}
            linkTo={createPageUrl("Payments")}
          />
          <StatsCard
            title="ממתין לגבייה"
            value={pendingPaymentsTotal > 0 ? `₪${pendingPaymentsTotal.toLocaleString()}` : "אין"}
            icon={CreditCard}
            color={pendingPaymentsTotal > 0 ? "red" : "gray"}
            trend="תשלומים פתוחים"
            linkTo={createPageUrl("Payments")}
          />
        </div>
      )}

      {/* ── Pipeline ── */}
      {loading ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Pipeline לידים
              <span className="text-xs font-normal text-gray-400">({relevantLeads.length} סה"כ)</span>
            </h2>
            <Link to={createPageUrl("Leads")}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              כל הלידים <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-2 items-end">
            {PIPELINE_STAGES.map((stage, i) => (
              <React.Fragment key={stage.key}>
                <PipelineStage
                  label={stage.label}
                  count={relevantLeads.filter(l => l.status === stage.key).length}
                  total={relevantLeads.length}
                  color={stage.color}
                />
                {i < PIPELINE_STAGES.length - 1 && (
                  <span className="text-gray-200 text-lg mb-5 flex-shrink-0">›</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Tasks + Leads ── */}
      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <TaskList
            tasks={tasks.filter(t => t.status !== "הושלם").slice(0, 8)}
            onTaskClick={(task) => navigate(createPageUrl("Calendar"), { state: { editTask: task } })}
            isPersonal={!isAdmin}
          />
          <LeadsByStatus leads={leads} isAdmin={isAdmin} currentUserId={currentUser?.id} />
        </div>
      )}

      {/* ── Payment Chart ── */}
      {!loading && (
        <PaymentChart payments={payments} isPersonal={!isAdmin} />
      )}

    </div>
  );
}
