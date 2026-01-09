import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function UserFilters({ filters, setFilters }) {
  return (
    <div className="flex gap-3 flex-wrap">
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
            <SelectItem value="פעיל">פעיל</SelectItem>
            <SelectItem value="לא_פעיל">לא פעיל</SelectItem>
            <SelectItem value="השעיה">השעיה</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Select 
        value={filters.category} 
        onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל הקטגוריות</SelectItem>
          <SelectItem value="מנהל_ראשי">מנהל ראשי</SelectItem>
          <SelectItem value="מנהל_מחלקה">מנהל מחלקה</SelectItem>
          <SelectItem value="איש_מכירות">איש מכירות</SelectItem>
          <SelectItem value="שירות_לקוחות">שירות לקוחות</SelectItem>
          <SelectItem value="מנהל_פרויקטים">מנהל פרויקטים</SelectItem>
          <SelectItem value="רו_ח_חשבונות">רו"ח חשבונות</SelectItem>
          <SelectItem value="צפייה_בלבד">צפייה בלבד</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.department} 
        onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל המחלקות</SelectItem>
          <SelectItem value="מכירות">מכירות</SelectItem>
          <SelectItem value="שירות לקוחות">שירות לקוחות</SelectItem>
          <SelectItem value="ניהול פרויקטים">ניהול פרויקטים</SelectItem>
          <SelectItem value="פיננסים">פיננסים</SelectItem>
          <SelectItem value="ניהול">ניהול</SelectItem>
          <SelectItem value="מערכות מידע">מערכות מידע</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}