import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, AlertTriangle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  "התקבל":                { color: "bg-blue-100 text-blue-800",   dot: "bg-blue-500",   urgent: false },
  "שיחה חוזרת":           { color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500", urgent: false },
  "בוצע איפיון":          { color: "bg-purple-100 text-purple-800", dot: "bg-purple-500", urgent: false },
  "נשלחה הצעת מחיר":     { color: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500",  urgent: false },
  "לא רלוונטי":           { color: "bg-gray-100 text-gray-500",   dot: "bg-gray-400",   urgent: false },
  "נסגר בהצלחה (שולם)":  { color: "bg-green-100 text-green-800", dot: "bg-green-500",  urgent: false },
};

// ליד נחשב דחוף אם עבר מועד המעקב שלו או אם אין קשר מעל 72 שעות
function isUrgent(lead) {
  if (lead.next_followup_at) {
    return new Date(lead.next_followup_at) < new Date();
  }
  if (lead.last_contact_at) {
    const hoursElapsed = (new Date() - new Date(lead.last_contact_at)) / (1000 * 60 * 60);
    return hoursElapsed > 72;
  }
  // ליד חדש ללא קשר כלל - דחוף לאחר 24 שעות
  const hoursFromCreation = (new Date() - new Date(lead.created_date)) / (1000 * 60 * 60);
  return hoursFromCreation > 24;
}

export default function LeadsByStatus({ leads, isAdmin, currentUserId }) {
  // סינון לפי תפקיד
  const relevantLeads = isAdmin
    ? leads
    : leads.filter(l => l.agent_id === currentUserId);

  const openLeads = relevantLeads.filter(
    l => l.status !== "לא רלוונטי" && l.status !== "נסגר בהצלחה (שולם)"
  );

  const urgentLeads = openLeads.filter(isUrgent);

  // קיבוץ לפי סטטוס
  const byStatus = {};
  openLeads.forEach(l => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            {isAdmin ? "לידים לפי סטטוס" : "הלידים שלי"}
          </div>
          {urgentLeads.length > 0 && (
            <Badge className="bg-red-100 text-red-700 gap-1">
              <AlertTriangle className="w-3 h-3" />
              {urgentLeads.length} דחופים
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* לידים דחופים */}
        {urgentLeads.length > 0 && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> דורשים טיפול מיידי
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {urgentLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border border-red-100">
                  <span className="font-medium text-gray-800">{lead.full_name || lead.phone || "ליד"}</span>
                  <Badge className="text-xs bg-red-100 text-red-700">{lead.status}</Badge>
                </div>
              ))}
              {urgentLeads.length > 5 && (
                <p className="text-xs text-red-500 text-center">+{urgentLeads.length - 5} נוספים</p>
              )}
            </div>
          </div>
        )}

        {/* התפלגות סטטוסים */}
        {Object.entries(STATUS_CONFIG)
          .filter(([status]) => status !== "לא רלוונטי" && status !== "נסגר בהצלחה (שולם)")
          .map(([status, cfg]) => {
            const count = byStatus[status] || 0;
            return (
              <div key={status} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                  <span className="text-sm text-gray-700">{status}</span>
                </div>
                <Badge className={`text-xs ${cfg.color}`}>{count}</Badge>
              </div>
            );
          })}

        <div className="pt-2 border-t mt-2">
          <Link
            to={createPageUrl("Leads")}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            לכל הלידים ←
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}