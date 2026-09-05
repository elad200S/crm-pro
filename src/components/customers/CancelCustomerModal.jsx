import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle } from "lucide-react";

const REASONS = ["מחיר", "איכות שירות", "עבר למתחרה", "קיצוצי תקציב", "לא היה צורך יותר", "אחר"];

export default function CancelCustomerModal({ customer, onConfirm, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [refundAmount, setRefundAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm({
      reason,
      refund_amount: refundAmount ? parseFloat(refundAmount) : undefined,
      notes,
    });
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            ביטול לקוח
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4" dir="rtl">
          <p className="text-sm text-gray-600">
            מבטל את <strong>{customer.first_name} {customer.last_name}</strong> — הסטטוס יעודכן ל"לא פעיל" והסיבה תישמר למעקב נטישה.
          </p>

          <div className="space-y-1.5">
            <Label>סיבת הביטול *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>סכום שהוחזר (אופציונלי)</Label>
            <Input type="number" min="0" step="0.01" value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)} placeholder="0" />
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="פרטים נוספים על הביטול" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleConfirm} disabled={saving}>
            {saving ? "שומר..." : "אשר ביטול לקוח"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
