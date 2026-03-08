import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import TaskForm from "../components/calendar/TaskForm";
import TaskCalendar from "../components/calendar/TaskCalendar";
import TaskList from "../components/calendar/TaskList";

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  // בדיקה אם הגענו מהדשבורד עם משימה לעריכה
  useEffect(() => {
    if (location.state?.editTask) {
      setEditingTask(location.state.editTask);
      setShowForm(true);
      // נקה את ה-state כדי שהטופס לא ייפתח שוב לאחר רענון או ניווט פנימי
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadData = async () => {
    try {
      const [tasksData, customersData] = await Promise.all([
        Task.list('-created_date'),
        Customer.list()
      ]);
      setTasks(tasksData);
      setCustomers(customersData);
    } catch (error) {
      console.error("שגיאה בטעינת נתונים:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await Task.update(editingTask.id, taskData);
      } else {
        await Task.create(taskData);
      }
      setShowForm(false);
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error("שגיאה בשמירת משימה:", error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      try {
        await Task.delete(taskToDelete.id);
        
        // If the deleted task was being edited, close the form
        if (editingTask && editingTask.id === taskToDelete.id) {
          setShowForm(false);
          setEditingTask(null);
        }

        setTaskToDelete(null);
        loadData();
      } catch (error) {
        console.error("שגיאה במחיקת משימה:", error);
      }
    }
  };


  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await Task.update(taskId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("שגיאה בעדכון סטטוס:", error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : "";
  };

  const todayTasks = tasks.filter(task => 
    format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingTasks = tasks.filter(task => 
    new Date(task.due_date) > new Date() && 
    task.status !== "הושלם"
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              יומן ומשימות
            </h1>
            <p className="text-gray-600">
              {todayTasks.length} משימות להיום • {upcomingTasks.length} משימות קרובות
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            משימה חדשה
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <TaskForm
          task={editingTask}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Calendar and Tasks */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border shadow-sm">
            <TaskCalendar 
              tasks={tasks}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onTaskClick={handleEdit}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <TaskList
            tasks={upcomingTasks}
            getCustomerName={getCustomerName}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
      
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המשימה "{taskToDelete?.title}"? פעולה זו הינה בלתי הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}