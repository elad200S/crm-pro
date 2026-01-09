
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Edit, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
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

export default function TaskList({ tasks, getCustomerName, onEdit, onDelete, onStatusChange }) {
  const isOverdue = (dueDate, status) => {
    return status !== "הושלם" && new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          משימות קרובות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                isOverdue(task.due_date, task.status) ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex-1 ml-2">{task.title}</h4>
                <div className="flex gap-2">
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                  <Badge className={statusColors[task.status]}>
                    {task.status}
                  </Badge>
                </div>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                      {format(new Date(task.due_date), "dd/MM/yyyy", { locale: he })}
                      {isOverdue(task.due_date, task.status) && " (באיחור)"}
                    </span>
                  </div>
                  
                  {task.customer_id && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{getCustomerName(task.customer_id)}</span>
                    </div>
                  )}
                  
                  {task.assigned_to && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">אחראי:</span>
                      <span className="text-gray-700 font-medium">{task.assigned_to}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-1">
                  {task.status !== "הושלם" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange(task.id, "הושלם")}
                      className="text-green-600 hover:text-green-800"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(task)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                   <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
