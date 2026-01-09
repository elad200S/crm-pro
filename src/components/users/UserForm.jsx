import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save } from "lucide-react";

export default function UserForm({ user, onSubmit, onCancel, permissionTemplates }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    job_title: user?.job_title || "",
    department: user?.department || "מכירות",
    user_category: user?.user_category || "איש_מכירות",
    permissions: user?.permissions || [],
    start_date: user?.start_date || new Date().toISOString().split('T')[0],
    status: user?.status || "פעיל",
    manager_email: user?.manager_email || "",
    notes: user?.notes || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      user_category: category,
      permissions: permissionTemplates[category] || []
    }));
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const allPermissions = [
    "ניהול_לקוחות_מלא",
    "צפייה_בלקוחות",
    "ניהול_תשלומים_מלא",
    "צפייה_בתשלומים",
    "ניהול_משימות_מלא",
    "צפייה_במשימות",
    "צפייה_בדוחות",
    "ניהול_משתמשים",
    "שליחת_מיילים",
    "גישה_למידע_פיננסי",
    "עריכת_הגדרות_מערכת"
  ];

  return (
    <Card className="mb-6 border-blue-200 border-2 shadow-lg">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-blue-900">
            {user ? "עריכת משתמש" : "משתמש חדש"}
          </span>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* פרטים אישיים */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">פרטים אישיים</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">שם מלא *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  required
                  disabled={!!user}
                />
                {user && <p className="text-xs text-gray-500">לא ניתן לשנות שם משתמש קיים</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={!!user}
                />
                {user && <p className="text-xs text-gray-500">לא ניתן לשנות אימייל משתמש קיים</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">תאריך התחלה *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* תפקיד והרשאות */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">תפקיד והרשאות</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">כותרת תפקיד *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange("job_title", e.target.value)}
                  required
                  placeholder="למשל: מנהל מכירות בכיר"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">מחלקה *</Label>
                <Select value={formData.department} onValueChange={(value) => handleChange("department", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="מכירות">מכירות</SelectItem>
                    <SelectItem value="שירות לקוחות">שירות לקוחות</SelectItem>
                    <SelectItem value="ניהול פרויקטים">ניהול פרויקטים</SelectItem>
                    <SelectItem value="פיננסים">פיננסים</SelectItem>
                    <SelectItem value="ניהול">ניהול</SelectItem>
                    <SelectItem value="מערכות מידע">מערכות מידע</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_category">קטגוריית משתמש *</Label>
                <Select value={formData.user_category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="מנהל_ראשי">מנהל ראשי</SelectItem>
                    <SelectItem value="מנהל_מחלקה">מנהל מחלקה</SelectItem>
                    <SelectItem value="איש_מכירות">איש מכירות</SelectItem>
                    <SelectItem value="שירות_לקוחות">שירות לקוחות</SelectItem>
                    <SelectItem value="מנהל_פרויקטים">מנהל פרויקטים</SelectItem>
                    <SelectItem value="רו_ח_חשבונות">רו"ח חשבונות</SelectItem>
                    <SelectItem value="צפייה_בלבד">צפייה בלבד</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">הקטגוריה קובעת אוטומטית את ההרשאות המתאימות</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="פעיל">פעיל</SelectItem>
                    <SelectItem value="לא_פעיל">לא פעיל</SelectItem>
                    <SelectItem value="השעיה">השעיה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* הרשאות מותאמות אישית */}
            <div className="space-y-2 mt-4">
              <Label className="text-base">הרשאות ספציפיות (ניתן להתאמה אישית)</Label>
              <div className="bg-white p-4 rounded-lg border max-h-64 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-3">
                  {allPermissions.map(permission => (
                    <div key={permission} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={permission}
                        checked={formData.permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      <label
                        htmlFor={permission}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* פרטים נוספים */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">פרטים נוספים</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manager_email">אימייל מנהל ישיר</Label>
                <Input
                  id="manager_email"
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => handleChange("manager_email", e.target.value)}
                  placeholder="לא חובה"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="הערות כלליות על המשתמש"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 ml-2" />
              {user ? "עדכן משתמש" : "צור משתמש חדש"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}