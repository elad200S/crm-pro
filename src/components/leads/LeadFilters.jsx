import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Bell } from "lucide-react";

const STATUSES = ["התקבל", "שיחה חוזרת", "בוצע איפיון", "נשלחה הצעת מחיר", "לא רלוונטי", "נסגר בהצלחה (שולם)"];
const SOURCES = ["טופס באתר", "Facebook", "Google", "WhatsApp", "טלפון", "ידני", "הפניה", "אחר"];

export default function LeadFilters({ filters, setFilters, users }) {
  const now = new Date();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="pr-9"
        />
      </div>

      <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל הסטטוסים</SelectItem>
          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.source} onValueChange={v => setFilters(f => ({ ...f, source: v }))}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="מקור" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל המקורות</SelectItem>
          {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.agent} onValueChange={v => setFilters(f => ({ ...f, agent: v }))}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="סוכן מטפל" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל הסוכנים</SelectItem>
          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Button
        variant={filters.followupDue ? "default" : "outline"}
        size="sm"
        onClick={() => setFilters(f => ({ ...f, followupDue: !f.followupDue }))}
        className="flex items-center gap-2"
      >
        <Bell className="w-4 h-4" />
        דורש מעקב עכשיו
      </Button>
    </div>
  );
}