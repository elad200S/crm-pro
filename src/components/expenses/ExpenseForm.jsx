import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

const CATEGORIES = ["שכר", "שיווק ופרסום", "תוכנה ומנויים", "ספקים וקבלנים", "משרד ותשתית", "מיסים ואגרות", "אחר"];
const PAYMENT_METHODS = ["העברה בנקאית", "כרטיס אשראי", "הוראת קבע", "מזומן", "צ'ק", "אחר"];

export default function ExpenseForm({ expense, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: expense?.description || "",
    category: expense?.category || "אחר",
    vendor: expense?.vendor || "",
    amount: expense?.amount ?? "",
    expense_date: expense?.expense_date || new Date().toISOString().split("T")[0],
    is_recurring: expense?.is_recurring || false,
    payment_method: expense?.payment_method || "",
    notes: expense?.notes || "",
  });

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{expense ? "עריכת הוצאה" : "הוצאה חדשה"}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>תיאור *</Label>
              <Input value={formData.description} onChange={e => set("description", e.target.value)}
                placeholder="למשל: מנוי Base44 חודשי" required />
            </div>
            <div className="space-y-1.5">
              <Label>ספק</Label>
              <Input value={formData.vendor} onChange={e => set("vendor", e.target.value)}
                placeholder="שם הספק/גורם" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>קטגוריה *</Label>
              <Select value={formData.category} onValueChange={v => set("category", v)} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>סכום *</Label>
              <Input type="number" min="0" step="0.01" value={formData.amount}
                onChange={e => set("amount", e.target.value)} placeholder="0" required />
            </div>
            <div className="space-y-1.5">
              <Label>תאריך *</Label>
              <Input type="date" value={formData.expense_date} onChange={e => set("expense_date", e.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>אמצעי תשלום</Label>
              <Select value={formData.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger><SelectValue placeholder="בחר (אופציונלי)" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-2.5">
              <Checkbox id="is_recurring" checked={formData.is_recurring}
                onCheckedChange={v => set("is_recurring", !!v)} />
              <label htmlFor="is_recurring" className="text-sm font-medium cursor-pointer">
                הוצאה חוזרת (כל חודש)
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea value={formData.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 ml-2" /> שמירה
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
