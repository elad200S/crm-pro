import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const { Customer, Payment, Task, User, Lead } = base44.entities;
import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, DollarSign, AlertTriangle, UserPlus } from "lucide-react";
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
        paymentsData = await Payment.filter({ created_by: user.email }, '-created_date', 500);
      }

      const [customersData, tasksData, leadsData] = await Promise.all([
        Customer.list('-created_date', 50),
        Task.list('-created_date', 20),
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
    const activeCustomers = customers.filter(c => c.status === "פעיל").length;
    const pendingPayments = payments.filter(p => p.status === "מחכה לתשלום").length;
    const monthlyRevenue = payments
      .filter(p => p.status === "שולם" && p.paid_date && new Date(p.paid_date).getMonth() === new Date().getMonth())
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdueTasks = tasks.filter(t => 
      t.status !== "הושלם" && new Date(t.due_date) < new Date()
    ).length;

    const openLeads = leads.filter(l => l.status !== "נסגר בהצלחה (שולם)" && l.status !== "לא רלוונטי").length;
    return { activeCustomers, pendingPayments, monthlyRevenue, overdueTasks, openLeads };
  };

  const { activeCustomers, pendingPayments, monthlyRevenue, overdueTasks, openLeads } = getStats();

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

      {/* Stats Cards - WITH LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="לידים פעילים"
          value={openLeads}
          icon={UserPlus}
          color="purple"
          trend="לידים פתוחים"
          linkTo={createPageUrl("Leads")}
        />
        <StatsCard
          title="לקוחות פעילים"
          value={activeCustomers}
          icon={Users}
          color="blue"
          trend="+12% מהחודש שעבר"
          linkTo={createPageUrl("Customers")}
        />
        <StatsCard
          title="תשלומים פתוחים"
          value={pendingPayments}
          icon={CreditCard}
          color="orange"
          trend={`${pendingPayments} חשבוניות`}
          linkTo={createPageUrl("Payments")}
        />
        <StatsCard
          title="הכנסות החודש"
          value={`₪${monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend="+8% מהחודש שעבר"
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
          <PaymentChart payments={payments} />
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
          tasks={tasks.slice(0, 6)} 
          onTaskClick={handleTaskClick}
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