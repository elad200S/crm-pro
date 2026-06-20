import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const { Customer, Payment, Task, User, Lead } = base44.entities;
import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, DollarSign, AlertTriangle, Target } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

import StatsCard from "../components/dashboard/StatsCard";
import RecentCustomers from "../components/dashboard/RecentCustomers";
import PaymentChart from "../components/dashboard/PaymentChart";
import TaskList from "../components/dashboard/TaskList";
import LeadsByStatus from "../components/dashboard/LeadsByStatus";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      let paymentsData;
      if (user.role === 'admin') {
        paymentsData = await Payment.list('-created_date', 500);
      } else {
        paymentsData = await Payment.filter({ created_by_id: user.id }, '-created_date', 500);
      }

      // משימות: admin רואה הכל, נציג רואה רק משימות שהוקצו לו
      const tasksQuery = user.role === 'admin'
        ? Task.list('-due_date', 50)
        : Task.filter({ assigned_to: user.id }, '-due_date', 50);

      const [customersData, tasksData, leadsData] = await Promise.all([
        Customer.list('-created_date', 50),
        tasksQuery,
        Lead.list('-created_date', 200)
      ]);
      
      setCustomers(customersData);
      setPayments(paymentsData);
      setTasks(tasksData);
      setLeads(leadsData);
    } catch (error) {
      console.error("שגיאה בטעינת נתונים:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeCustomers = customers.filter(c => c.status === "פעיל").length;

    // עסקאות החודש: חשבוניות שנוצרו החודש (סטטוס כלשהו חוץ מ"מבוטל")
    const monthlyDeals = payments.filter(p => {
      const d = new Date(p.created_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status !== "מבוטל";
    }).length;

    const monthlyRevenue = payments
      .filter(p => p.status === "שולם" && p.paid_date && new Date(p.paid_date).getMonth() === currentMonth && new Date(p.paid_date).getFullYear() === currentYear)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const overdueTasks = tasks.filter(t =>
      t.status !== "הושלם" && new Date(t.due_date) < now
    ).length;

    return { activeCustomers, monthlyDeals, monthlyRevenue, overdueTasks };
  };

  const { activeCustomers, monthlyDeals, monthlyRevenue, overdueTasks } = getStats();
  const MONTHLY_DEALS_TARGET = 10;

  // פונקציה לטיפול בלחיצה על לקוח - מעבר לעמוד לקוחות עם מצב עריכה
  const handleCustomerClick = (customer) => {
    // נווט לעמוד הלקוחות ושמור את ה-ID בסטייט או ב-URL
    navigate(createPageUrl("Customers"), { state: { editCustomer: customer } });
  };

  // פונקציה לטיפול בלחיצה על משימה - מעבר לעמוד יומן עם מצב עריכה
  const handleTaskClick = (task) => {
    navigate(createPageUrl("Calendar"), { state: { editTask: task } });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">דשבורד ראשי</h1>
          <p className="text-gray-600">סקירה כללית של מערכת ה-CRM שלך</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border">
          עודכן: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          trend={`${MONTHLY_DEALS_TARGET - monthlyDeals > 0 ? MONTHLY_DEALS_TARGET - monthlyDeals + ' נותרו ליעד' : 'יעד הושג! 🎉'}`}
          linkTo={createPageUrl("Payments")}
        />
        <StatsCard
          title={currentUser?.role !== 'admin' ? "ההכנסות שלי החודש" : "הכנסות החודש"}
          value={`₪${monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend="הכנסות ששולמו"
          linkTo={createPageUrl("Payments")}
        />
        <StatsCard
          title="משימות דחופות"
          value={overdueTasks}
          icon={AlertTriangle}
          color="red"
          trend="דורש טיפול מיידי"
          linkTo={createPageUrl("Calendar")}
        />
      </div>

      {/* Charts and Recent Data */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PaymentChart payments={payments} isPersonal={currentUser?.role !== 'admin'} />
        </div>
        <div>
          <RecentCustomers 
            customers={customers.slice(0, 5)} 
            onCustomerClick={handleCustomerClick}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        <TaskList 
          tasks={tasks.slice(0, 8)} 
          onTaskClick={handleTaskClick}
          isPersonal={currentUser?.role !== 'admin'}
        />
        <LeadsByStatus
          leads={leads}
          isAdmin={currentUser?.role === 'admin'}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
}