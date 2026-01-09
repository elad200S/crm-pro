import React, { useState, useEffect } from "react";
import { User, FileAttachment } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import UserForm from "../components/users/UserForm";
import UserTable from "../components/users/UserTable";
import UserFilters from "../components/users/UserFilters";

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

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    status: "הכל",
    category: "הכל",
    department: "הכל"
  });
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const initializeData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // בדיקת הרשאה - רק אדמין או מי שיש לו קטגוריית מנהל ראשי
      if (user.role !== 'admin' && user.user_category !== "מנהל_ראשי") {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      await loadUsers();
    } catch (error) {
      console.error("שגיאה באתחול:", error);
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await User.list('-created_date');
      setUsers(data);
    } catch (error) {
      console.error("שגיאה בטעינת משתמשים:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filters.status !== "הכל") {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    if (filters.category !== "הכל") {
      filtered = filtered.filter(user => user.user_category === filters.category);
    }

    if (filters.department !== "הכל") {
      filtered = filtered.filter(user => user.department === filters.department);
    }

    setFilteredUsers(filtered);
  };

  const sendWelcomeEmail = async (user) => {
    try {
      // חיפוש קובץ תיאור תפקיד ב-FileAttachment
      let fileUrl = null;
      let fileName = "";
      
      try {
        const files = await FileAttachment.filter({
          related_type: "task",
          related_id: user.user_category
        });
        
        if (files && files.length > 0) {
          fileUrl = files[0].file_url;
          fileName = files[0].filename || "";
          console.log(`נמצא קובץ תיאור תפקיד למשתמש: ${fileName}`);
        } else {
          console.log(`לא נמצא קובץ תיאור תפקיד לקטגוריה: ${user.user_category}`);
          // לא נשלח מייל אם אין קובץ
          return false;
        }
      } catch (fileError) {
        console.error("שגיאה בחיפוש קובץ:", fileError);
        return false;
      }
      
      // אם לא נמצא קובץ - לא נשלח מייל
      if (!fileUrl) {
        return false;
      }
      
      const jobDescription = getJobDescription(user.user_category);
      
      // בניית תוכן המייל
      const emailBody = `
שלום ${user.full_name},

ברוכים הבאים לחברה! 🎉

אנחנו שמחים שהצטרפת אלינו. הנה הפרטים החשובים שלך:

📋 פרטי התפקיד:
• שם: ${user.full_name}
• תפקיד: ${user.job_title}
• מחלקה: ${user.department}
• קטגוריה: ${user.user_category.replace(/_/g, ' ')}

${jobDescription}

📄 מסמך תיאור התפקיד המלא:
צרפנו עבורך את קובץ תיאור התפקיד המלא "${fileName}".
ניתן להוריד אותו מהקישור הבא:
${fileUrl}

🔐 ההרשאות שלך במערכת:
${user.permissions?.map(p => `• ${p.replace(/_/g, ' ')}`).join('\n') || '• יוגדרו בקרוב'}

${user.manager_email ? `👤 מנהל ישיר: ${user.manager_email}` : ''}

בהצלחה ושתהנה מהעבודה!
צוות החברה
      `;
      
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `ברוכים הבאים! 🎉 - ${user.full_name}`,
        body: emailBody
      });
      
      return true;
    } catch (error) {
      console.error("שגיאה בשליחת מייל onboarding:", error);
      return false;
    }
  };

  const getJobDescription = (category) => {
    const descriptions = {
      "מנהל_ראשי": "אחראי על ניהול המערכת כולה, כולל ניהול משתמשים, גישה מלאה לכל המידע והדוחות.",
      "מנהל_מחלקה": "אחראי על ניהול המחלקה, כולל ניהול לקוחות, תשלומים ומשימות של המחלקה.",
      "איש_מכירות": "אחראי על גיוס לקוחות חדשים, ניהול תהליך המכירה וטיפול בלקוחות פוטנציאליים.",
      "שירות_לקוחות": "אחראי על מתן שירות ללקוחות קיימים, טיפול בפניות ומשימות תמיכה.",
      "מנהל_פרויקטים": "אחראי על ניהול פרויקטים, משימות וקשרי לקוחות הקשורים לפרויקטים.",
      "רו_ח_חשבונות": "אחראי על ניהול תשלומים, חשבוניות ודיווחים פיננסיים.",
      "צפייה_בלבד": "הרשאת צפייה בלבד במידע המערכת, ללא אפשרות עריכה."
    };
    
    return descriptions[category] || "תפקיד כללי במערכת.";
  };

  const handleSubmit = async (userData) => {
    try {
      if (editingUser) {
        await User.update(editingUser.id, userData);
      } else {
        // משתמש חדש - שליחת מייל אוטומטית עם קובץ תיאור תפקיד מ-FileAttachment
        const emailSent = await sendWelcomeEmail({ 
          ...userData, 
          email: userData.email, 
          full_name: userData.full_name 
        });

        if (emailSent) {
          alert("המשתמש נוסף והמייל נשלח בהצלחה עם קובץ תיאור התפקיד! ✅");
        } else {
          alert("המשתמש נוסף, אך לא נמצא קובץ תיאור תפקיד מתאים לקטגוריה שלו.");
        }
      }
      
      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error("שגיאה בשמירת משתמש:", error);
      alert("שגיאה בשמירת המשתמש. אנא נסה שנית.");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeactivateClick = (user) => {
    setUserToDeactivate(user);
  };

  const confirmDeactivate = async () => {
    if (userToDeactivate) {
      try {
        await User.update(userToDeactivate.id, { status: "לא_פעיל" });
        setUserToDeactivate(null);
        await loadUsers();
      } catch (error) {
        console.error("שגיאה בהשבתת משתמש:", error);
      }
    }
  };

  const handleActivate = async (user) => {
    try {
      await User.update(user.id, { status: "פעיל" });
      await loadUsers();
    } catch (error) {
      console.error("שגיאה בהפעלת משתמש:", error);
    }
  };

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין לך הרשאת גישה</h2>
          <p className="text-gray-600 mb-6">רק מנהלים ראשיים יכולים לגשת לדף ניהול המשתמשים.</p>
          <Button onClick={() => window.history.back()}>חזור</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              ניהול משתמשים והרשאות
            </h1>
            <p className="text-gray-600">
              {filteredUsers.length} משתמשים מתוך {users.length} סה"כ
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            משתמש חדש
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <UserFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Form */}
      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          permissionTemplates={PERMISSION_TEMPLATES}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <UserTable
          users={filteredUsers}
          loading={loading}
          onEdit={handleEdit}
          onDeactivate={handleDeactivateClick}
          onActivate={handleActivate}
        />
      </div>

      <AlertDialog open={!!userToDeactivate} onOpenChange={() => setUserToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור השבתת משתמש</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך להשבית את המשתמש "{userToDeactivate?.full_name}"? 
              המשתמש לא יוכל להתחבר למערכת עד שיופעל מחדש.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-orange-600 hover:bg-orange-700">
              השבת משתמש
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}