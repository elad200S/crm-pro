import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, MessageCircle, FileText, Plus, Trash2, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "התקבל": "bg-blue-100 text-blue-800",
  "שיחה חוזרת": "bg-yellow-100 text-yellow-800",
  "בוצע איפיון": "bg-purple-100 text-purple-800",
  "נשלחה הצעת מחיר": "bg-orange-100 text-orange-800",
  "לא רלוונטי": "bg-gray-100 text-gray-600",
  "נסגר בהצלחה (שולם)": "bg-green-100 text-green-800",
};

export default function LeadTable({ leads, users, onEdit, onDelete, onWhatsApp, onQuote, onTask, onConvert, loading, onRowClick }) {
  const getUserName = (id) => users.find(u => u.id === id)?.full_name || "—";

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">טוען לידים...</div>
  );

  if (!leads.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
      <span className="text-4xl">📋</span>
      <p>לא נמצאו לידים</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">שם מלא</TableHead>
            <TableHead className="text-right">פרטי קשר</TableHead>
            <TableHead className="text-right">סטטוס</TableHead>
            <TableHead className="text-right">מקור הגעה</TableHead>
            <TableHead className="text-right">סוכן מטפל</TableHead>
            <TableHead className="text-right">תאריך יצירה</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map(lead => (
            <TableRow key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick && onRowClick(lead)}>
              <TableCell className="text-right font-medium">
                <div>
                  <p className="font-semibold text-gray-900">{lead.full_name || "—"}</p>
                  {lead.company_name && <p className="text-xs text-gray-500">{lead.company_name}</p>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="text-sm space-y-0.5">
                  {lead.phone && <p className="text-gray-700">{lead.phone}</p>}
                  {lead.email && <p className="text-gray-500 text-xs">{lead.email}</p>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge className={statusColors[lead.status] || "bg-gray-100 text-gray-600"}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm text-gray-600">{lead.lead_source || "—"}</TableCell>
              <TableCell className="text-right text-sm text-gray-600">{getUserName(lead.agent_id)}</TableCell>
              <TableCell className="text-right text-sm text-gray-500">
                {lead.created_date ? format(new Date(lead.created_date), "dd/MM/yy", { locale: he }) : "—"}
              </TableCell>
              <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(lead)}>
                      <Edit className="w-4 h-4 ml-2" /> עריכה
                    </DropdownMenuItem>
                    {lead.phone && (
                      <DropdownMenuItem onClick={() => onWhatsApp(lead)}>
                        <MessageCircle className="w-4 h-4 ml-2" /> שליחת וואטסאפ
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onQuote(lead)}>
                      <FileText className="w-4 h-4 ml-2" /> יצירת הצעת מחיר
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTask(lead)}>
                      <Plus className="w-4 h-4 ml-2" /> הוספת משימה
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onConvert(lead)}>
                      <UserCheck className="w-4 h-4 ml-2" /> המרה ללקוח
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(lead)} className="text-red-600">
                      <Trash2 className="w-4 h-4 ml-2" /> מחיקה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}