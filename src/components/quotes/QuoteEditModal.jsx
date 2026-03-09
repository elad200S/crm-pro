import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuoteEditModal({ quote, leadName, customerName, onSubmit, onClose }) {
  const [form, setForm] = useState({
    amount: quote.amount || "",
    currency: quote.currency || "ILS",
    status: quote.status || "טיוטה",
    notes: quote.notes || ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const entityName = leadName || customerName || "—";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת הצעת מחיר — {entityName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>סכום</Label>
              <Input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0" />
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
          <div className="space-y-1">
            <Label>סטטוס</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="טיוטה">טיוטה</SelectItem>
                <SelectItem value="נשלח">נשלח</SelectItem>
                <SelectItem value="שולם">שולם</SelectItem>
                <SelectItem value="בוטל">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>הערות</Label>
            <Textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onSubmit({ ...form, amount: parseFloat(form.amount) || 0 })}
          >
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}