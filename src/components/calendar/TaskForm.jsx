import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Trash2 } from "lucide-react";

export default function TaskForm({ task, customers, leads = [], onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    customer_id: task?.customer_id || "",
    lead_id: task?.lead_id || "",
    due_date: task?.due_date || "",
    status: task?.status || "פתוח",
    priority: task?.priority || "בינונית",
    assigned_to: task?.assigned_to || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // אם בחרנו לקוח, מנקים ליד ולהפך
  const handleCustomerChange = (val) => {
    setFormData(prev => ({ ...prev, customer_id: val, lead_id: "" }));
  };

  const handleLeadChange = (val) => {
    setFormData(prev => ({ ...prev, lead_id: val, customer_id: "" }));
  };

  return (
    <Card className="mb-6 border-blue-200 border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{task ? "עריכת משימה" : "משימה חדשה"}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת המשימה *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>שיוך ללקוח</Label>
              <Select
                value={formData.customer_id}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>שיוך לליד</Label>
              <Select
                value={formData.lead_id}
                onValueChange={handleLeadChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר ליד (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.full_name || lead.phone || lead.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">מועד ביצוע *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="נמוכה">נמוכה</SelectItem>
                  <SelectItem value="בינונית">בינונית</SelectItem>
                  <SelectItem value="גבוהה">גבוהה</SelectItem>
                  <SelectItem value="קריטית">קריטית</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="פתוח">פתוח</SelectItem>
                  <SelectItem value="בטיפול">בטיפול</SelectItem>
                  <SelectItem value="הושלם">הושלם</SelectItem>
                  <SelectItem value="דחוי">דחוי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">מוקצה למשתמש</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => handleChange("assigned_to", e.target.value)}
                placeholder="שם המשתמש"
              />
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <div>
              {task && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק משימה
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                ביטול
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 ml-2" />
                שמירה
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}