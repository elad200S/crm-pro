import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Repeat } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const categoryColors = {
  "שכר":            "bg-purple-100 text-purple-800",
  "שיווק ופרסום":   "bg-blue-100 text-blue-800",
  "תוכנה ומנויים":  "bg-indigo-100 text-indigo-800",
  "ספקים וקבלנים":  "bg-amber-100 text-amber-800",
  "משרד ותשתית":    "bg-teal-100 text-teal-800",
  "מיסים ואגרות":   "bg-red-100 text-red-800",
  "אחר":            "bg-gray-100 text-gray-800",
};

export default function ExpenseTable({ expenses, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>תיאור</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>ספק</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                      {expense.description}
                      {expense.is_recurring && (
                        <Repeat className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {expense.notes && (
                      <div className="text-xs text-gray-400 truncate max-w-52">{expense.notes}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[expense.category] || categoryColors["אחר"]}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{expense.vendor || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-lg">₪{(expense.amount || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {expense.expense_date ? format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: he }) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(expense)} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(expense)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {expenses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו הוצאות
          </div>
        )}
      </CardContent>
    </Card>
  );
}
