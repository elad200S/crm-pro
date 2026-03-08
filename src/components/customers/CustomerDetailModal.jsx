import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "חדש": "bg-gray-100 text-gray-800",
  "פוטנציאלי": "bg-yellow-100 text-yellow-800",
  "פעיל": "bg-green-100 text-green-800",
  "לא פעיל": "bg-red-100 text-red-800",
  "סגור": "bg-gray-100 text-gray-800"
};

export default function CustomerDetailModal({ customer, onClose, onEdit, onDelete }) {
  if (!customer) return null;

  const Field = ({ label, value }) => value ? (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  ) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={statusColors[customer.status]}>{customer.status}</Badge>
            {customer.source && <Badge variant="outline">{customer.source}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{customer.company}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <Field label="עיר" value={customer.city} />
            <Field label="רחוב" value={customer.street} />
            <Field label="מיקוד" value={customer.postal_code} />
            <Field label="תאריך רישום" value={
              customer.registration_date
                ? format(new Date(customer.registration_date), "dd/MM/yyyy", { locale: he })
                : customer.created_date
                  ? format(new Date(customer.created_date), "dd/MM/yyyy", { locale: he })
                  : null
            } />
          </div>

          {customer.notes && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 mb-1">הערות</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>סגור</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { onEdit(customer); onClose(); }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Edit className="w-4 h-4 ml-1" /> עריכה
            </Button>
            <Button variant="outline" size="sm" onClick={() => { onDelete(customer); onClose(); }}
              className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 ml-1" /> מחיקה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}