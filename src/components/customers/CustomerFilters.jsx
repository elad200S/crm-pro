import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function CustomerFilters({ filters, setFilters }) {
  return (
    <div className="flex gap-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select 
          value={filters.status} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="הכל">כל הסטטוסים</SelectItem>
            <SelectItem value="חדש">חדש</SelectItem>
            <SelectItem value="פוטנציאלי">פוטנציאלי</SelectItem>
            <SelectItem value="פעיל">פעיל</SelectItem>
            <SelectItem value="לא פעיל">לא פעיל</SelectItem>
            <SelectItem value="סגור">סגור</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Select 
        value={filters.source} 
        onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל המקורות</SelectItem>
          <SelectItem value="אתר">אתר</SelectItem>
          <SelectItem value="המלצה">המלצה</SelectItem>
          <SelectItem value="רשתות חברתיות">רשתות חברתיות</SelectItem>
          <SelectItem value="פרסום">פרסום</SelectItem>
          <SelectItem value="אחר">אחר</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}