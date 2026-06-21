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

export default function QuoteEditModal({ quote, leadName, customerName, isNew, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: quote.title || "",
    status: quote.status || "טיוטה",
    currency: quote.currency || "ILS",
    notes: quote.notes || "",
    valid_until: quote.valid_until || "",
    discount: quote.discount || 0,
    vat_included: quote.vat_included || false,
    items: (quote.items && quote.items.length > 0)
      ? quote.items
      : [emptyItem()]
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

  const addItem = () => set("items", [...form.items, emptyItem()]);

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    set("items", form.items.filter((_, i) => i !== idx));
  };

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const discountAmount = subtotal * ((parseFloat(form.discount) || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = form.vat_included ? afterDiscount * VAT_RATE : 0;
  const total = afterDiscount + vatAmount;

  const currencySymbol = form.currency === "ILS" ? "₪" : form.currency === "USD" ? "$" : "€";
  const entityName = leadName || customerName || "—";

  const handleSubmit = () => {
    onSubmit({
      title: form.title,
      status: form.status,
      currency: form.currency,
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
      amount: parseFloat(total.toFixed(2))
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isNew ? "מסמך חדש" : `עריכת מסמך — ${entityName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* כותרת + סטטוס */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>כותרת ההצעה</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="למשל: הצעת מחיר לפרויקט X" />
            </div>
            <div className="space-y-1">
              <Label>סטטוס</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="טיוטה">טיוטה</SelectItem>
                  <SelectItem value="נשלח">נשלח</SelectItem>
                  <SelectItem value="אושר">אושר</SelectItem>
                  <SelectItem value="בוטל">בוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* תוקף + מטבע */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>תוקף ההצעה עד</Label>
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

          {/* טבלת פריטים */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">פריטים</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 ml-1" /> הוסף שורה
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-2 font-semibold text-gray-600 w-1/2">תיאור</th>
                    <th className="text-right p-2 font-semibold text-gray-600 w-16">כמות</th>
                    <th className="text-right p-2 font-semibold text-gray-600 w-28">מחיר יחידה</th>
                    <th className="text-right p-2 font-semibold text-gray-600 w-28">סה"כ</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-1.5">
                        <Input
                          value={item.description}
                          onChange={e => updateItem(idx, "description", e.target.value)}
                          placeholder="תיאור פריט / שירות"
                          className="border-0 shadow-none bg-transparent focus-visible:ring-1"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="border-0 shadow-none bg-transparent focus-visible:ring-1 text-center"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={e => updateItem(idx, "unit_price", e.target.value)}
                          className="border-0 shadow-none bg-transparent focus-visible:ring-1"
                          placeholder={`0 ${currencySymbol}`}
                        />
                      </td>
                      <td className="p-1.5 font-medium text-gray-800">
                        {currencySymbol}{(parseFloat(item.total) || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          className="text-red-400 hover:text-red-600 h-7 w-7"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* סיכום */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">סכום ביניים</span>
              <span className="font-medium">{currencySymbol}{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">הנחה (%)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount}
                  onChange={e => set("discount", e.target.value)}
                  className="w-16 h-7 text-center text-sm"
                />
              </div>
              {discountAmount > 0 && (
                <span className="text-red-600 font-medium">− {currencySymbol}{discountAmount.toLocaleString()}</span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.vat_included}
                  onCheckedChange={v => set("vat_included", v)}
                  id="vat"
                />
                <label htmlFor="vat" className="text-gray-600 cursor-pointer">כולל מע"מ 17%</label>
              </div>
              {form.vat_included && (
                <span className="text-gray-600">{currencySymbol}{vatAmount.toLocaleString()}</span>
              )}
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>סה"כ לתשלום</span>
              <span className="text-blue-700">{currencySymbol}{total.toLocaleString()}</span>
            </div>
          </div>

          {/* הערות */}
          <div className="space-y-1">
            <Label>הערות / תנאי תשלום</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="תנאי תשלום, הערות נוספות..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
            {isNew ? "צור מסמך" : "שמור מסמך"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
