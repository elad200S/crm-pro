import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, AlertCircle, FileText, PieChart } from "lucide-react";

export default function LeadStatsCards({ leads }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newToday = leads.filter(l => {
    const d = new Date(l.created_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const openLeads = leads.filter(l =>
    !["לא רלוונטי", "נסגר בהצלחה (שולם)"].includes(l.status)
  ).length;

  const quoteSent = leads.filter(l => l.status === "נשלחה הצעת מחיר").length;

  const sourceMap = {};
  leads.forEach(l => {
    if (l.lead_source) sourceMap[l.lead_source] = (sourceMap[l.lead_source] || 0) + 1;
  });
  const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { label: "לידים חדשים היום", value: newToday, icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "לידים פתוחים", value: openLeads, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: 'נשלחה הצעת מחיר', value: quoteSent, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "מקור מוביל", value: topSource ? `${topSource[0]} (${topSource[1]})` : "—", icon: PieChart, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}