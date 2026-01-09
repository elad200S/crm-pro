import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Phone, Mail, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  "חדש": "bg-gray-100 text-gray-800",
  "פוטנציאלי": "bg-yellow-100 text-yellow-800",
  "פעיל": "bg-green-100 text-green-800",
  "לא פעיל": "bg-red-100 text-red-800"
};

export default function RecentCustomers({ customers, onCustomerClick }) {
  const navigate = useNavigate();

  const handleCustomerClick = (customer) => {
    if (onCustomerClick) {
      onCustomerClick(customer);
    } else {
      // אם אין callback, נווט לעמוד הלקוחות
      navigate(createPageUrl("Customers"));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          לקוחות אחרונים
        </CardTitle>
        <Link to={createPageUrl("Customers")}>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
            צפה בכל הלקוחות
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.map((customer) => (
            <div 
              key={customer.id} 
              onClick={() => handleCustomerClick(customer)}
              className="flex items-start justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </h4>
                  <Badge className={statusColors[customer.status]}>
                    {customer.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(customer.created_date), "dd/MM", { locale: he })}
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              אין לקוחות חדשים
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}