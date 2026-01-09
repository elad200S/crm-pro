import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function PaymentFilters({ filters, setFilters }) {
  return (
    <div className="flex gap-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select 
          value={filters.status} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="הכל">כל הסטטוסים</SelectItem>
            <SelectItem value="נוצר">נוצר</SelectItem>
            <SelectItem value="נשלח">נשלח</SelectItem>
            <SelectItem value="מחכה לתשלום">מחכה לתשלום</SelectItem>
            <SelectItem value="שולם">שולם</SelectItem>
            <SelectItem value="פג תוקף">פג תוקף</SelectItem>
            <SelectItem value="מבוטל">מבוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Select 
        value={filters.dateRange} 
        onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="הכל">כל התקופות</SelectItem>
          <SelectItem value="שבוע">שבוע אחרון</SelectItem>
          <SelectItem value="חודש">חודש אחרון</SelectItem>
          <SelectItem value="3חודשים">3 חודשים</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}