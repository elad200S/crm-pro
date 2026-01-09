
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "נוצר": "bg-gray-100 text-gray-800",
  "נשלח": "bg-blue-100 text-blue-800",
  "מחכה לתשלום": "bg-yellow-100 text-yellow-800",
  "שולם": "bg-green-100 text-green-800", 
  "פג תוקף": "bg-red-100 text-red-800",
  "מבוטל": "bg-gray-100 text-gray-800"
};

export default function PaymentTable({ payments, getCustomerName, loading, onEdit, onDelete, onSendReminder }) {
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

  const isOverdue = (dueDate, status) => {
    return status !== "שולם" && new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>חשבונית</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>מועד תשלום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow 
                  key={payment.id} 
                  className={`hover:bg-gray-50 ${
                    isOverdue(payment.due_date, payment.status) ? 'bg-red-50 border-r-4 border-red-400' : ''
                  }`}
                >
                  <TableCell>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {payment.invoice_number}
                      </div>
                      <div className="text-sm text-gray-600 truncate max-w-32">
                        {payment.service_description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{getCustomerName(payment.customer_id)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-lg">₪{payment.amount?.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${
                      isOverdue(payment.due_date, payment.status) ? 'text-red-600 font-semibold' : ''
                    }`}>
                      {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: he })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[payment.status]}>
                      {payment.status}
                    </Badge>
                    {isOverdue(payment.due_date, payment.status) && (
                      <Badge className="bg-red-100 text-red-800 mr-2">
                        באיחור
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(payment)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(payment)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {payment.status === "מחכה לתשלום" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onSendReminder(payment)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      {payment.payment_link && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={payment.payment_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו תשלומים
          </div>
        )}
      </CardContent>
    </Card>
  );
}
