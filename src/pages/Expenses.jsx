import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const { Expense } = base44.entities;
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, TrendingDown, Repeat } from "lucide-react";
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

import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpenseTable from "../components/expenses/ExpenseTable";

const CATEGORIES = ["שכר", "שיווק ופרסום", "תוכנה ומנויים", "ספקים וקבלנים", "משרד ותשתית", "מיסים ואגרות", "אחר"];
const isAdmin = (user) => user?.role === "admin" || user?.user_category === "מנהל_ראשי";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("הכל");
  const [currentUser, setCurrentUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadExpenses = useCallback(async () => {
    try {
      const data = await Expense.list("-expense_date", 500);
      setExpenses(data);
    } catch (error) {
      console.error("שגיאה בטעינת הוצאות:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        // הוצאות הן מידע פיננסי רגיש — כמו ניהול משתמשים, נגיש רק למנהלים
        if (!isAdmin(user)) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        await loadExpenses();
      } catch (error) {
        console.error("שגיאה באתחול:", error);
        setLoading(false);
      }
    };
    init();
  }, [loadExpenses]);

  const filteredExpenses = categoryFilter === "הכל"
    ? expenses
    : expenses.filter(e => e.category === categoryFilter);

  const now = new Date();
  const thisMonthTotal = expenses
    .filter(e => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + (e.amount || 0), 0);

  const recurringMonthlyTotal = expenses
    .filter(e => e.is_recurring)
    .reduce((s, e) => s + (e.amount || 0), 0);

  const handleSubmit = async (data) => {
    try {
      if (editingExpense) {
        await Expense.update(editingExpense.id, data);
      } else {
        await Expense.create(data);
      }
      setShowForm(false);
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      console.error("שגיאה בשמירת הוצאה:", error);
      alert("שגיאה בשמירת ההוצאה. נסה שוב.");
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await Expense.delete(expenseToDelete.id);
      setExpenseToDelete(null);
      loadExpenses();
    } catch (error) {
      console.error("שגיאה במחיקת הוצאה:", error);
    }
  };

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין לך הרשאת גישה</h2>
          <p className="text-gray-600 mb-6">רק מנהלים יכולים לצפות בהוצאות העסק.</p>
          <Button onClick={() => window.history.back()}>חזור</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">הוצאות</h1>
            <p className="text-gray-600">{filteredExpenses.length} הוצאות מתוך {expenses.length} סה"כ</p>
          </div>
          <Button onClick={() => { setEditingExpense(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="w-5 h-5 ml-2" /> הוצאה חדשה
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">הוצאות החודש</p>
            <p className="text-2xl font-bold text-gray-900">₪{thisMonthTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Repeat className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">הוצאות חוזרות (סה"כ לחודש)</p>
            <p className="text-2xl font-bold text-gray-900">₪{recurringMonthlyTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 shadow-sm flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="הכל">כל הקטגוריות</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Form */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {/* Table */}
      <ExpenseTable
        expenses={filteredExpenses}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setExpenseToDelete}
      />

      <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את ההוצאה "{expenseToDelete?.description}"? פעולה זו הינה בלתי הפיכה.
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
