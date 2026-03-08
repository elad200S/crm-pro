import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "חדש": "bg-gray-100 text-gray-800",
  "פוטנציאלי": "bg-yellow-100 text-yellow-800", 
  "פעיל": "bg-green-100 text-green-800",
  "לא פעיל": "bg-red-100 text-red-800",
  "סגור": "bg-gray-100 text-gray-800"
};

export default function CustomerTable({ customers, loading, onEdit, onDelete, isAdmin }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-950"> {/* Added sticky header */}
              <TableRow className="bg-gray-50">
                <TableHead className="text-right">שם מלא</TableHead>
                <TableHead className="text-right">פרטי קשר</TableHead>
                <TableHead className="text-right">חברה</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">מקור הגעה</TableHead>
                <TableHead className="text-right">תאריך רישום</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50">
                 <TableCell className="text-right">
                   <div className="font-semibold text-gray-900">
                     {customer.first_name} {customer.last_name}
                   </div>
                   {isAdmin && (
                     <div className="text-xs text-gray-500 mt-0.5">
                       נוצר על ידי: {customer.created_by}
                     </div>
                   )}
                 </TableCell>
                 <TableCell className="text-right">
                   <div className="space-y-1 text-sm">
                     <div className="flex items-center justify-end gap-2">
                       <span>{customer.phone}</span>
                       <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                     </div>
                     <div className="flex items-center justify-end gap-2">
                       <span className="truncate max-w-40">{customer.email}</span>
                       <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                     </div>
                   </div>
                 </TableCell>
                 <TableCell className="text-right">
                   <span className="text-sm">{customer.company || "-"}</span>
                 </TableCell>
                 <TableCell className="text-right">
                   <Badge className={statusColors[customer.status]}>
                     {customer.status}
                   </Badge>
                 </TableCell>
                 <TableCell className="text-right">
                   <span className="text-sm">{customer.source || "-"}</span>
                 </TableCell>
                 <TableCell className="text-right">
                   <span className="text-sm">
                     {customer.registration_date ? 
                       format(new Date(customer.registration_date), "dd/MM/yyyy", { locale: he }) : 
                       format(new Date(customer.created_date), "dd/MM/yyyy", { locale: he })
                     }
                   </span>
                 </TableCell>
                 <TableCell className="text-right">
                   <div className="flex gap-1 justify-end">
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => onEdit(customer)}
                       className="text-blue-600 hover:text-blue-800"
                     >
                       <Edit className="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => onDelete(customer)}
                       className="text-red-600 hover:text-red-800"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {customers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו לקוחות
          </div>
        )}
      </CardContent>
    </Card>
  );
}