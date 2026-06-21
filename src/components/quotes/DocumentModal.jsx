import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";

const DEFAULT_BODY = `תיאור השירות:
[תאר כאן את השירות המוצע]

תהליך העבודה:
1.
2.
3.

תנאי תשלום:
[תנאי תשלום]

הערות:
`;

export default function DocumentModal({ doc, lead, customer, onSubmit, onClose }) {
  const isNew = !doc?.id;
  const entityName = lead?.full_name || (customer ? `${customer.first_name} ${customer.last_name}` : null);

  const [form, setForm] = useState({
    title: doc?.title || "",
    body: doc?.notes || (isNew ? DEFAULT_BODY : ""),
    price: doc?.amount || "",
    valid_until: doc?.valid_until || "",
    status: doc?.status || "טיוטה",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit({
      title: form.title,
      notes: form.body,
      amount: parseFloat(form.price) || 0,
      valid_until: form.valid_until,
      status: form.status,
      // שדות ריקים כדי לא לבלבל עם הצעת מחיר רגילה
      items: [],
      discount: 0,
      vat_included: false,
      currency: "ILS",
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="w-5 h-5 text-blue-600" />
            {isNew ? "מסמך חדש" : "עריכת מסמך"}
            {entityName && <span className="text-sm font-normal text-gray-400">— {entityName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* כותרת + סטטוס */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>כותרת המסמך *</Label>
              <Input
                autoFocus
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="לדוגמה: הסכם שירות אוטומציה"
              />
            </div>
            <div className="space-y-1.5">
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

          {/* תוכן חופשי */}
          <div className="space-y-1.5">
            <Label>תוכן המסמך</Label>
            <Textarea
              rows={12}
              value={form.body}
              onChange={e => set("body", e.target.value)}
              placeholder="כתוב כאן את תוכן הסכם העבודה..."
              className="resize-y font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-gray-400">מלל חופשי — תיאור השירות, תהליך עבודה, תנאים</p>
          </div>

          {/* מחיר + תוקף */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>מחיר (₪)</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>בתוקף עד</Label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={e => set("valid_until", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={!form.title.trim()}
          >
            {isNew ? "צור מסמך" : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
