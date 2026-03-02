import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const STATUSES = ["התקבל", "שיחה חוזרת", "בוצע איפיון", "נשלחה הצעת מחיר", "לא רלוונטי", "נסגר בהצלחה (שולם)"];
const SOURCES = ["טופס באתר", "Facebook", "Google", "WhatsApp", "טלפון", "ידני", "הפניה", "אחר"];

export default function LeadForm({ lead, users, currentUser, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    company_name: "",
    service_requested: "",
    lead_source: "ידני",
    source_details: "",
    notes: "",
    status: "התקבל",
    agent_id: currentUser?.id || "",
    last_contact_at: "",
    next_followup_at: "",
    ...lead
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card className="border-blue-200 border-2 shadow-lg">
      <CardHeader className="bg-blue-50 flex flex-row items-center justify-between">
        <CardTitle>{lead ? "עריכת ליד" : "ליד חדש"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>שם מלא</Label>
              <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="ישראל ישראלי" />
            </div>
            <div className="space-y-1">
              <Label>טלפון</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="050-0000000" />
            </div>
            <div className="space-y-1">
              <Label>אימייל</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>שם חברה</Label>
              <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>מקור ליד *</Label>
              <Select value={form.lead_source} onValueChange={v => set("lead_source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>סטטוס</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>סוכן מטפל</Label>
              <Select value={form.agent_id} onValueChange={v => set("agent_id", v)}>
                <SelectTrigger><SelectValue placeholder="בחר סוכן" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>שירות מבוקש</Label>
              <Input value={form.service_requested} onChange={e => set("service_requested", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>קשר אחרון</Label>
              <Input type="datetime-local" value={form.last_contact_at} onChange={e => set("last_contact_at", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>מעקב הבא</Label>
              <Input type="datetime-local" value={form.next_followup_at} onChange={e => set("next_followup_at", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>פרטי מקור</Label>
            <Input value={form.source_details} onChange={e => set("source_details", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>הערות</Label>
            <Textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{lead ? "עדכן" : "צור ליד"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}