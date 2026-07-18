import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Edit, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { format, differenceInHours, isToday, isTomorrow } from "date-fns";
import { he } from "date-fns/locale";

const priorityColors = {
  "נמוכה": "bg-blue-100 text-blue-800",
  "בינונית": "bg-yellow-100 text-yellow-800",
  "גבוהה": "bg-orange-100 text-orange-800",
  "קריטית": "bg-red-100 text-red-800"
};

const statusColors = {
  "פתוח": "bg-yellow-100 text-yellow-800",
  "בטיפול": "bg-blue-100 text-blue-800",
  "הושלם": "bg-green-100 text-green-800",
  "דחוי": "bg-gray-100 text-gray-800"
};

export default function TaskList({ tasks, getCustomerName, getLeadName, onEdit, onDelete, onStatusChange }) {
  const navigate = useNavigate();

  // לחיצה על משימה שמקושרת לליד מעבירה ישר לכרטיס הליד
  const openLead = (task) => {
    if (task.lead_id) navigate(`${createPageUrl("Leads")}?lead=${task.lead_id}`);
  };

  const isOverdue = (dueDate, status) => {
    return status !== "הושלם" && new Date(dueDate) < new Date();
  };

  const getDueBadge = (dueDate, status) => {
    if (status === "הושלם") return null;
    const due = new Date(dueDate);
    const now = new Date();
    const hours = differenceInHours(due, now);
    if (due < now) return <span className="text-xs font-bold text-red-600">⚠ באיחור!</span>;
    if (isToday(due)) return <span className="text-xs font-semibold text-orange-600">🔔 היום!</span>;
    if (isTomorrow(due)) return <span className="text-xs font-semibold text-yellow-600">⏰ מחר</span>;
    if (hours <= 72) return <span className="text-xs text-gray-500">בקרוב</span>;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          משימות קרובות
          {tasks.some(t => isOverdue(t.due_date, t.status)) && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-normal">
              {tasks.filter(t => isOverdue(t.due_date, t.status)).length} באיחור
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => openLead(task)}
              className={`p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                task.lead_id ? 'cursor-pointer' : ''
              } ${
                isOverdue(task.due_date, task.status) ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 ml-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                    <Badge className={`text-xs ${statusColors[task.status]}`}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {task.status !== "הושלם" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, "הושלם"); }}
                      className="h-7 w-7 text-green-600 hover:text-green-800"
                      title="סמן כהושלם"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    className="h-7 w-7 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                    className="h-7 w-7 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {task.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-semibold' : ''}>
                    {format(new Date(task.due_date), "dd/MM/yyyy", { locale: he })}
                  </span>
                  {getDueBadge(task.due_date, task.status)}
                </div>

                {task.customer_id && getCustomerName && getCustomerName(task.customer_id) && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{getCustomerName(task.customer_id)}</span>
                  </div>
                )}

                {task.lead_id && getLeadName && getLeadName(task.lead_id) && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-600">ליד: {getLeadName(task.lead_id)}</span>
                  </div>
                )}

                {task.assigned_to && (
                  <span className="text-gray-400">אחראי: {task.assigned_to}</span>
                )}
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              אין משימות קרובות
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}