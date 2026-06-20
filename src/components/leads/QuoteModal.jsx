import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

const VAT_RATE = 0.17;
const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, total: 0 });

export default function QuoteModal({ lead, accountId, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: "",
    currency: "ILS",
    status: "טיוטה",
    notes: "",
    valid_until: "",
    discount: 0,
    vat_included: false,
    items: [emptyItem()]
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const qty = field === "quantity" ? parseFloat(value) || 0 : parseFloat(items[idx].quantity) || 0;
      const price = field === "unit_price" ? parseFloat(value) || 0 : parseFloat(items[idx].unit_price) || 0;
      items[idx].total = parseFloat((qty * price).toFixed(2));
    }
    set("items", items);
  };

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const discountAmount = subtotal * ((parseFloat(form.discount) || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = form.vat_included ? afterDiscount * VAT_RATE : 0;
  const total = afterDiscount + vatAmount;
  const currSymbol = form.currency === "ILS" ? "₪" : form.currency === "USD" ? "$" : "€";

  const handleSubmit = () => {
    onSubmit({
      title: form.title,
      currency: form.currency,
      status: form.status,
      notes: form.notes,
      valid_until: form.valid_until,
      discount: parseFloat(form.discount) || 0,
      vat_included: form.vat_included,
      items: form.items.map(i => ({
        ...i,
        quantity: parseFloat(i.quantity) || 0,
        unit_price: parseFloat(i.unit_price) || 0,
        total: parseFloat(i.total) || 0
      })),
      amount: parseFloat(total.toFixed(2)),
      lead_id: lead.id,
      account_id: accountId
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הצעת מחיר — {lead.full_name || lead.phone}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* כותרת + סטטוס */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>כותרת</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="כותרת ההצעה" />
            </div>
            <div className="space-y-1">
              <Label>סטטוס</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="טיוטה">טיוטה</SelectItem>
                  <SelectItem value="נשלח">נשלח</SelectItem>
                  <SelectItem value="אושר">אושר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* תוקף + מטבע */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>תוקף עד</Label>
              <Input type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>מטבע</Label>
              <Select value={form.currency} onValueChange={v => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">ILS ₪</SelectItem>
                  <SelectItem value="USD">USD $</SelectItem>
                  <SelectItem value="EUR">EUR €</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* פריטים */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">פריטים</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => set("items", [...form.items, emptyItem()])}>
                <Plus className="w-3.5 h-3.5 ml-1" /> הוסף שורה
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-2 font-medium text-gray-500 w-1/2">תיאור</th>
                    <th className="text-right p-2 font-medium text-gray-500 w-14">כמות</th>
                    <th className="text-right p-2 font-medium text-gray-500 w-24">מחיר</th>
                    <th className="text-right p-2 font-medium text-gray-500 w-24">סה"כ</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-1">
                        <Input value={item.description} onChange={e => updateItem(idx, "description", e.target.value)}
                          placeholder="תיאור" className="border-0 shadow-none bg-transparent h-8 text-sm" />
                      </td>
                      <td className="p-1">
                        <Input type="number" min="0" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="border-0 shadow-none bg-transparent h-8 text-sm text-center" />
                      </td>
                      <td className="p-1">
                        <Input type="number" min="0" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)}
                          className="border-0 shadow-none bg-transparent h-8 text-sm" />
                      </td>
                      <td className="p-1 font-medium text-sm">{currSymbol}{(parseFloat(item.total) || 0).toLocaleString()}</td>
                      <td className="p-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => { if (form.items.length > 1) set("items", form.items.filter((_, i) => i !== idx)); }}
                          className="h-7 w-7 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* סיכום */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">סכום ביניים</span>
              <span>{currSymbol}{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">הנחה (%)</span>
                <Input type="number" min="0" max="100" value={form.discount} onChange={e => set("discount", e.target.value)}
                  className="w-14 h-6 text-xs text-center" />
              </div>
              {discountAmount > 0 && <span className="text-red-500">− {currSymbol}{discountAmount.toLocaleString()}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.vat_included} onCheckedChange={v => set("vat_included", v)} id="vat-modal" />
                <label htmlFor="vat-modal" className="text-gray-500 cursor-pointer text-xs">כולל מע"מ 17%</label>
              </div>
              {form.vat_included && <span className="text-gray-500">{currSymbol}{vatAmount.toLocaleString()}</span>}
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>סה"כ</span>
              <span className="text-blue-700">{currSymbol}{total.toLocaleString()}</span>
            </div>
          </div>

          {/* הערות */}
          <div className="space-y-1">
            <Label>הערות</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="הערות / תנאים" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>צור הצעה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
