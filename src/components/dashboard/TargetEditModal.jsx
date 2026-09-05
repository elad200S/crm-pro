import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Target as TargetIcon } from "lucide-react";

export default function TargetEditModal({ monthLabel, target, onSave, onClose }) {
  const [revenueTarget, setRevenueTarget] = useState(target?.revenue_target ?? "");
  const [dealsTarget, setDealsTarget] = useState(target?.deals_target ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      revenue_target: parseFloat(revenueTarget) || 0,
      deals_target: parseInt(dealsTarget) || 0,
    });
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <TargetIcon className="w-5 h-5" />
            יעד חודשי — {monthLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4" dir="rtl">
          <div className="space-y-1.5">
            <Label>יעד הכנסות (₪)</Label>
            <Input type="number" min="0" step="100" value={revenueTarget}
              onChange={e => setRevenueTarget(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>יעד מספר עסקאות</Label>
            <Input type="number" min="0" step="1" value={dealsTarget}
              onChange={e => setDealsTarget(e.target.value)} placeholder="0" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : "שמירת יעד"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
