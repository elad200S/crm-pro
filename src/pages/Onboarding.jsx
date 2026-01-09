
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, UserCircle } from "lucide-react";

// תבניות הרשאות לפי קטגוריה
const PERMISSION_TEMPLATES = {
  "מנהל_ראשי": [
    "ניהול_לקוחות_מלא",
    "ניהול_תשלומים_מלא",
    "ניהול_משימות_מלא",
    "צפייה_בדוחות",
    "ניהול_משתמשים",
    "שליחת_מיילים",
    "גישה_למידע_פיננסי",
    "עריכת_הגדרות_מערכת"
  ],
  "מנהל_מחלקה": [
    "ניהול_לקוחות_מלא",
    "ניהול_תשלומים_מלא",
    "ניהול_משימות_מלא",
    "צפייה_בדוחות",
    "שליחת_מיילים",
    "גישה_למידע_פיננסי"
  ],
  "איש_מכירות": [
    "ניהול_לקוחות_מלא",
    "צפייה_בתשלומים",
    "ניהול_משימות_מלא",
    "שליחת_מיילים"
  ],
  "שירות_לקוחות": [
    "צפייה_בלקוחות",
    "צפייה_בתשלומים",
    "ניהול_משימות_מלא",
    "שליחת_מיילים"
  ],
  "מנהל_פרויקטים": [
    "צפייה_בלקוחות",
    "ניהול_משימות_מלא",
    "צפייה_בדוחות",
    "שליחת_מיילים"
  ],
  "רו_ח_חשבונות": [
    "צפייה_בלקוחות",
    "ניהול_תשלומים_מלא",
    "צפייה_בדוחות",
    "גישה_למידע_פיננסי"
  ],
  "צפייה_בלבד": [
    "צפייה_בלקוחות",
    "צפייה_בתשלומים",
    "צפייה_במשימות",
    "צפייה_בדוחות"
  ]
};

export default function OnboardingPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    job_title: "",
    department: "מכירות",
    user_category: "איש_מכירות",
    permissions: PERMISSION_TEMPLATES["איש_מכירות"],
    start_date: new Date().toISOString().split('T')[0],
    status: "פעיל",
    manager_email: "",
    notes: ""
  });

  React.useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // אם יש כבר נתונים, נמלא אותם בטופס
      if (user.phone) {
        setFormData(prev => ({
          ...prev,
          phone: user.phone || "",
          job_title: user.job_title || "",
          department: user.department || "מכירות",
          user_category: user.user_category || "איש_מכירות",
          permissions: user.permissions || PERMISSION_TEMPLATES["איש_מכירות"],
          start_date: user.start_date || new Date().toISOString().split('T')[0],
          manager_email: user.manager_email || "",
          notes: user.notes || ""
        }));
      }
    } catch (error) {
      console.error("שגיאה בטעינת משתמש:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // עדכון פרטי המשתמש
      await base44.auth.updateMe({
        ...formData,
        last_login: new Date().toISOString()
      });

      // רענון הדף כדי לעבור לממשק הראשי
      window.location.reload();
    } catch (error) {
      console.error("שגיאה בשמירת פרטים:", error);
      alert("שגיאה בשמירת הפרטים. אנא נסה שנית.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      user_category: category,
      permissions: PERMISSION_TEMPLATES[category] || []
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-3xl mb-2">ברוכים הבאים ל-CRM Pro! 🎉</CardTitle>
              <p className="text-blue-100">
                שלום {currentUser?.full_name || currentUser?.email}! בואו נשלים את הפרטים שלך כדי להתחיל
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* פרטים אישיים */}
            <div className="bg-gray-50 p-6 rounded-lg border-r-4 border-blue-500">
              <h3 className="font-semibold text-xl mb-4 text-gray-900 flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-blue-600" />
                פרטים אישיים
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">שם מלא</Label>
                  <Input
                    id="full_name"
                    value={currentUser?.full_name || ""}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">השם נלקח מחשבון המשתמש שלך</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    value={currentUser?.email || ""}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">האימייל נלקח מחשבון המשתמש שלך</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="050-1234567"
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
            <div className="bg-gray-50 p-6 rounded-lg border-r-4 border-indigo-500">
              <h3 className="font-semibold text-xl mb-4 text-gray-900">תפקיד והרשאות</h3>
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="user_category">קטגוריית משתמש *</Label>
                  <Select value={formData.user_category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="מנהל_ראשי">מנהל ראשי (גישה מלאה לכל המערכת)</SelectItem>
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
            <div className="bg-gray-50 p-6 rounded-lg border-r-4 border-green-500">
              <h3 className="font-semibold text-xl mb-4 text-gray-900">פרטים נוספים (אופציונלי)</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manager_email">אימייל מנהל ישיר</Label>
                  <Input
                    id="manager_email"
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => handleChange("manager_email", e.target.value)}
                    placeholder="manager@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">הערות</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={3}
                    placeholder="הערות כלליות, תחומי אחריות, וכו'"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6"
                disabled={loading}
              >
                {loading ? "שומר..." : "שמור והתחל לעבוד! 🚀"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
