import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2 } from "lucide-react";

const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, total: 0 });

export default function PaymentForm({ payment, customers, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customer_id: payment?.customer_id || "",
    due_date: payment?.due_date || "",
    status: payment?.status || "נוצר",
    payment_link: payment?.payment_link || "",
    items: payment?.items?.length ? payment.items : [emptyItem()],
  });

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const updateItem = (idx, field, value) => {
    const items = [...formData.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const qty = field === "quantity" ? parseFloat(value) || 0 : parseFloat(items[idx].quantity) || 0;
      const price = field === "unit_price" ? parseFloat(value) || 0 : parseFloat(items[idx].unit_price) || 0;
      items[idx].total = parseFloat((qty * price).toFixed(2));
    }
    set("items", items);
  };

  const total = formData.items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      customer_id: formData.customer_id,
      due_date: formData.due_date,
      status: formData.status,
      payment_link: formData.payment_link,
      items: formData.items,
      amount: parseFloat(total.toFixed(2)),
      service_description: formData.items.map(i => i.description).filter(Boolean).join(", "),
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{payment ? "עריכת חשבונית" : "חשבונית חדשה"}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">

          {/* לקוח + תאריך + סטטוס */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>לקוח *</Label>
              <Select value={formData.customer_id} onValueChange={v => set("customer_id", v)} required>
                <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>מועד אחרון *</Label>
              <Input type="date" value={formData.due_date} onChange={e => set("due_date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <Select value={formData.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="נוצר">נוצר</SelectItem>
                  <SelectItem value="נשלח">נשלח</SelectItem>
                  <SelectItem value="מחכה לתשלום">מחכה לתשלום</SelectItem>
                  <SelectItem value="שולם">שולם</SelectItem>
                  <SelectItem value="פג תוקף">פג תוקף</SelectItem>
                  <SelectItem value="מבוטל">מבוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* פריטים */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">פריטים</Label>
              <Button type="button" variant="outline" size="sm"
                onClick={() => set("items", [...formData.items, emptyItem()])}>
                <Plus className="w-3.5 h-3.5 ml-1" /> הוסף שורה
              </Button>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-2.5 font-medium text-gray-500">תיאור</th>
                    <th className="text-right p-2.5 font-medium text-gray-500 w-16">כמות</th>
                    <th className="text-right p-2.5 font-medium text-gray-500 w-28">מחיר יחידה</th>
                    <th className="text-right p-2.5 font-medium text-gray-500 w-24">סה"כ</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="p-1">
                        <Input value={item.description}
                          onChange={e => updateItem(idx, "description", e.target.value)}
                          placeholder="תיאור הפריט"
                          className="border-0 shadow-none bg-transparent h-8 text-sm" />
                      </td>
                      <td className="p-1">
                        <Input type="number" min="0" value={item.quantity}
                          onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="border-0 shadow-none bg-transparent h-8 text-sm text-center" />
                      </td>
                      <td className="p-1">
                        <Input type="number" min="0" step="0.01" value={item.unit_price}
                          onChange={e => updateItem(idx, "unit_price", e.target.value)}
                          className="border-0 shadow-none bg-transparent h-8 text-sm" />
                      </td>
                      <td className="p-1 font-medium text-sm text-gray-700">
                        ₪{(parseFloat(item.total) || 0).toLocaleString()}
                      </td>
                      <td className="p-1">
                        <Button type="button" variant="ghost" size="icon"
                          onClick={() => { if (formData.items.length > 1) set("items", formData.items.filter((_, i) => i !== idx)); }}
                          className="h-7 w-7 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* סכום סופי */}
            <div className="flex justify-end mt-3">
              <div className="bg-blue-50 rounded-xl px-5 py-3 flex items-center gap-4">
                <span className="text-sm text-gray-500">סה"כ לתשלום</span>
                <span className="text-xl font-bold text-blue-700">₪{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* קישור לתשלום */}
          <div className="space-y-1.5">
            <Label>קישור לתשלום (אופציונלי)</Label>
            <Input type="url" value={formData.payment_link}
              onChange={e => set("payment_link", e.target.value)}
              placeholder="https://..." />
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
