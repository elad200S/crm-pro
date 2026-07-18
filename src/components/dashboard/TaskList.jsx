import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-800",
  "בינונית": "bg-blue-100 text-blue-800", 
  "גבוהה": "bg-orange-100 text-orange-800",
  "קריטית": "bg-red-100 text-red-800"
};

const statusColors = {
  "פתוח": "bg-yellow-100 text-yellow-800",
  "בטיפול": "bg-blue-100 text-blue-800",
  "הושלם": "bg-green-100 text-green-800",
  "דחוי": "bg-gray-100 text-gray-800"
};

export default function TaskList({ tasks, onTaskClick, isPersonal }) {
  const navigate = useNavigate();

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const handleTaskClick = (task) => {
    if (task.lead_id) {
      // משימה שמקושרת לליד — ישר לכרטיס הליד
      navigate(`${createPageUrl("Leads")}?lead=${task.lead_id}`);
    } else if (onTaskClick) {
      onTaskClick(task);
    } else {
      // אם אין callback, נווט לעמוד היומן
      navigate(createPageUrl("Calendar"));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {isPersonal ? "המשימות שלי" : "משימות קרובות"}
        </CardTitle>
        <Link to={createPageUrl("Calendar")}>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
            צפה בכל המשימות
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer hover:shadow-md ${
                isOverdue(task.due_date) ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 flex-1">{task.title}</h4>
                <Badge className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {format(new Date(task.due_date), "dd/MM", { locale: he })}
                    </span>
                  </div>
                  {task.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{task.assigned_to}</span>
                    </div>
                  )}
                </div>
                <Badge className={statusColors[task.status]}>
                  {task.status}
                </Badge>
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              אין משימות קרובות
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}