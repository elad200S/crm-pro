import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function PaymentForm({ payment, customers, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customer_id: payment?.customer_id || "",
    amount: payment?.amount || "",
    service_description: payment?.service_description || "",
    due_date: payment?.due_date || "",
    status: payment?.status || "נוצר",
    payment_link: payment?.payment_link || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{payment ? "עריכת תשלום" : "תשלום חדש"}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customer_id">לקוח *</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(value) => handleChange("customer_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">סכום *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">מועד אחרון לתשלום *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="נוצר">נוצר</SelectItem>
                  <SelectItem value="נשלח">נשלח</SelectItem>
                  <SelectItem value="מחכה לתשלום">מחכה לתשלום</SelectItem>
                  <SelectItem value="שולם">שולם</SelectItem>
                  <SelectItem value="פג תוקף">פג תוקף</SelectItem>
                  <SelectItem value="מבוטל">מבוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description">תיאור השירות/פרויקט *</Label>
            <Textarea
              id="service_description"
              value={formData.service_description}
              onChange={(e) => handleChange("service_description", e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_link">קישור לתשלום</Label>
            <Input
              id="payment_link"
              type="url"
              value={formData.payment_link}
              onChange={(e) => handleChange("payment_link", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 ml-2" />
              שמירה
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}