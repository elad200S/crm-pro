import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const { ActivityLog: ActivityLogEntity, User } = base44.entities;
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Filter, FileText, CreditCard, UserPlus, Users, Receipt, XCircle, Target as TargetIcon, History
} from "lucide-react";

const isAdmin = (user) => user?.role === "admin" || user?.user_category === "מנהל_ראשי";

const ENTITY_CONFIG = {
  lead:         { label: "ליד",     icon: UserPlus,  color: "bg-blue-100 text-blue-700" },
  quote:        { label: "הסכם",    icon: FileText,  color: "bg-indigo-100 text-indigo-700" },
  payment:      { label: "תשלום",   icon: CreditCard, color: "bg-green-100 text-green-700" },
  customer:     { label: "לקוח",    icon: Users,     color: "bg-purple-100 text-purple-700" },
  expense:      { label: "הוצאה",   icon: Receipt,   color: "bg-red-100 text-red-700" },
  cancellation: { label: "ביטול",   icon: XCircle,   color: "bg-red-100 text-red-700" },
  target:       { label: "יעד",     icon: TargetIcon, color: "bg-orange-100 text-orange-700" },
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [filterType, setFilterType] = useState("הכל");

  const loadData = useCallback(async () => {
    try {
      const [logsData, usersData] = await Promise.all([
        ActivityLogEntity.list("-created_date", 300),
        User.list("-created_date", 200),
      ]);
      setLogs(logsData);
      setUsers(usersData);
    } catch (e) {
      console.error("טעינת יומן הפעילות נכשלה:", e);
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
          <p className="text-gray-600 mb-6">רק מנהלים יכולים לצפות ביומן הפעילות.</p>
          <Button onClick={() => window.history.back()}>חזור</Button>
        </div>
      </div>
    );
  }

  const nameOf = (email) => users.find(u => u.email === email)?.full_name || email || "לא ידוע";

  const filtered = filterType === "הכל" ? logs : logs.filter(l => l.entity_type === filterType);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <History className="w-7 h-7 text-teal-600" /> יומן פעילות
            </h1>
            <p className="text-gray-600">כל שינוי הקשור לכסף במערכת — מי, מה ומתי</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="הכל">הכל</SelectItem>
                {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-500">אין פעילות רשומה עדיין</p>
        ) : (
          <div className="divide-y">
            {filtered.map(log => {
              const cfg = ENTITY_CONFIG[log.entity_type] || { icon: History, color: "bg-gray-100 text-gray-600", label: log.entity_type };
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{log.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {nameOf(log.created_by)}
                      {log.created_date && ` · ${format(new Date(log.created_date), "dd/MM/yyyy HH:mm", { locale: he })}`}
                    </p>
                  </div>
                  {log.amount > 0 && (
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0">₪{log.amount.toLocaleString()}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
