import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VAT_RATE = 0.17;
const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, total: 0 });

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function QuoteBuilderModal({ customer, onClose, onCreated }) {
  const fullName = `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim();

  const [quoteNumber, setQuoteNumber] = useState("...");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: `הצעת מחיר — ${fullName || "לקוח"}`,
    discount: 0,
    vat_included: false,
    notes: "מחכים לכם! ההצעה בתוקף על פי התאריך המצוין.\nלשאלות ובירורים — נשמח לעמוד לרשותכם.",
    valid_until: addDays(30),
    items: [emptyItem()]
  });

  // מספר הצעה אוטומטי — המספר העוקב אחרי האחרון שנוצר השנה
  useEffect(() => {
    base44.entities.Quote.list('-created_date', 500).then(all => {
      const year = new Date().getFullYear();
      const maxNum = all.reduce((max, q) => {
        const m = (q.quote_number || "").match(new RegExp(`Q-${year}-(\\d+)`));
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 0);
      setQuoteNumber(`Q-${year}-${String(maxNum + 1).padStart(3, "0")}`);
    }).catch(e => console.error("טעינת מספור הצעות נכשל:", e));
  }, []);

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

  const handleSubmit = async () => {
    if (!form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await base44.entities.Quote.create({
        quote_number: quoteNumber,
        title: form.title,
        customer_id: customer.id,
        // פרטי הלקוח ממולאים אוטומטית מתוך כרטיס הלקוח
        signing_client_name: fullName,
        signing_client_email: customer.email || "",
        signing_client_phone: customer.phone || "",
        signing_client_company: customer.company || "",
        signing_client_id: customer.id_number || "",
        signing_client_address: customer.business_address || "",
        status: "טיוטה",
        items: form.items
          .filter(i => (i.description || "").trim())
          .map(i => ({
            ...i,
            quantity: parseFloat(i.quantity) || 0,
            unit_price: parseFloat(i.unit_price) || 0,
            total: parseFloat(i.total) || 0
          })),
        amount: parseFloat(total.toFixed(2)),
        discount: parseFloat(form.discount) || 0,
        vat_included: form.vat_included,
        currency: "ILS",
        notes: form.notes,
        valid_until: form.valid_until
      });
      onCreated(created);
    } catch (e) {
      console.error("יצירת הצעת המחיר נכשלה:", e);
      alert("יצירת הצעת המחיר נכשלה. נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const customerRows = [
    ["שם", fullName],
    ['ח"פ / ת"ז', customer?.id_number],
    ["טלפון", customer?.phone],
    ["מייל", customer?.email],
    ["שם העסק", customer?.company],
    ["כתובת", customer?.business_address],
  ].filter(r => r[1]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הצעת מחיר חדשה — ממולאת מנתוני הלקוח</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* פרטי הלקוח שמולאו אוטומטית */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" />
              פרטי הלקוח — מולאו אוטומטית, יופיעו בהצעה
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
              {customerRows.map(([label, value]) => (
                <div key={label} className="truncate">
                  <span className="text-gray-400">{label}: </span>
                  <span className="font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* מספר + כותרת */}
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div className="space-y-1">
              <Label>מספר הצעה</Label>
              <Input value={quoteNumber} disabled className="font-mono text-xs bg-gray-50" />
            </div>
            <div className="space-y-1">
              <Label>כותרת</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
          </div>

          {/* תוקף */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>בתוקף עד</Label>
              <Input type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>הנחה (%)</Label>
              <Input type="number" min="0" max="100" value={form.discount} onChange={e => set("discount", e.target.value)} />
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
                      <td className="p-1 font-medium text-sm">₪{(parseFloat(item.total) || 0).toLocaleString()}</td>
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
              <span>₪{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">הנחה ({form.discount}%)</span>
                <span className="text-red-500">− ₪{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.vat_included} onCheckedChange={v => set("vat_included", v)} id="vat-customer-quote" />
                <label htmlFor="vat-customer-quote" className="text-gray-500 cursor-pointer text-xs">כולל מע"מ 17%</label>
              </div>
              {form.vat_included && <span className="text-gray-500">₪{vatAmount.toLocaleString()}</span>}
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>סה"כ</span>
              <span className="text-blue-700">₪{total.toLocaleString()}</span>
            </div>
          </div>

          {/* הערות */}
          <div className="space-y-1">
            <Label>הערות / תנאים</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={!form.title.trim() || submitting}>
            {submitting ? "יוצר..." : "צור הצעה והצג תצוגה מקדימה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}