import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddTaskModal({ lead, users, currentUser, accountId, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_at: "",
    status: "פתוח",
    assigned_to_user_id: currentUser?.id || ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.title || !form.due_at) return;
    onSubmit({ ...form, lead_id: lead.id, account_id: accountId });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת משימה ל{lead.full_name || lead.phone}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>כותרת *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="תיאור המשימה" required />
          </div>
          <div className="space-y-1">
            <Label>תאריך יעד *</Label>
            <Input type="datetime-local" value={form.due_at} onChange={e => set("due_at", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>מוקצה לסוכן</Label>
            <Select value={form.assigned_to_user_id} onValueChange={v => set("assigned_to_user_id", v)}>
              <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>תיאור</Label>
            <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>הוסף משימה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}