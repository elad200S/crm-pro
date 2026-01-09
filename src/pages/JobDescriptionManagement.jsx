import React, { useState, useEffect } from "react";
import { JobDescriptionTemplate } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Plus, Edit, Trash2, Download } from "lucide-react";
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

const categoryNames = {
  "מנהל_ראשי": "מנהל ראשי",
  "מנהל_מחלקה": "מנהל מחלקה",
  "איש_מכירות": "איש מכירות",
  "שירות_לקוחות": "שירות לקוחות",
  "מנהל_פרויקטים": "מנהל פרויקטים",
  "רו_ח_חשבונות": "רו״ח חשבונות",
  "צפייה_בלבד": "צפייה בלבד"
};

export default function JobDescriptionManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    user_category: "איש_מכירות",
    file_url: "",
    description: "",
    is_active: true
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // בדיקת הרשאה - רק אדמין או מנהל ראשי
      if (user.role !== 'admin' && user.user_category !== "מנהל_ראשי") {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      await loadTemplates();
    } catch (error) {
      console.error("שגיאה באתחול:", error);
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await JobDescriptionTemplate.list('-created_date');
      setTemplates(data);
    } catch (error) {
      console.error("שגיאה בטעינת תבניות:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // בדיקת סוג הקובץ
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("ניתן להעלות רק קבצי Word (doc, docx) או PDF");
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, file_url: result.file_url }));
      alert("הקובץ הועלה בהצלחה!");
    } catch (error) {
      console.error("שגיאה בהעלאת קובץ:", error);
      alert("שגיאה בהעלאת הקובץ. אנא נסה שנית.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file_url) {
      alert("יש להעלות קובץ");
      return;
    }

    try {
      if (editingTemplate) {
        await JobDescriptionTemplate.update(editingTemplate.id, formData);
      } else {
        await JobDescriptionTemplate.create(formData);
      }
      
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      await loadTemplates();
    } catch (error) {
      console.error("שגיאה בשמירת תבנית:", error);
      alert("שגיאה בשמירת התבנית. אנא נסה שנית.");
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      user_category: template.user_category,
      file_url: template.file_url,
      description: template.description || "",
      is_active: template.is_active
    });
    setShowForm(true);
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      try {
        await JobDescriptionTemplate.delete(templateToDelete.id);
        setTemplateToDelete(null);
        await loadTemplates();
      } catch (error) {
        console.error("שגיאה במחיקת תבנית:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      user_category: "איש_מכירות",
      file_url: "",
      description: "",
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
    resetForm();
  };

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין לך הרשאת גישה</h2>
          <p className="text-gray-600 mb-6">רק מנהלים ראשיים יכולים לגשת לדף זה.</p>
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
              <FileText className="w-8 h-8 text-blue-600" />
              ניהול קבצי תיאור תפקיד
            </h1>
            <p className="text-gray-600">
              {templates.length} תבניות • קבצים אלה נשלחים אוטומטית למשתמשים חדשים
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            תבנית חדשה
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-blue-200 border-2 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle>
              {editingTemplate ? "עריכת תבנית" : "תבנית חדשה"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">כותרת התבנית *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="למשל: תיאור תפקיד - איש מכירות"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_category">קטגוריית משתמש *</Label>
                  <Select 
                    value={formData.user_category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, user_category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryNames).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="תיאור קצר של התבנית או התפקיד"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">קובץ תיאור התפקיד (Word/PDF) *</Label>
                <div className="flex items-center gap-4">
                  <label 
                    htmlFor="file" 
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{uploading ? "מעלה..." : "העלה קובץ"}</span>
                    <input
                      type="file"
                      id="file"
                      className="hidden"
                      accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  {formData.file_url && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">✓ הקובץ הועלה</Badge>
                      <a 
                        href={formData.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        צפייה בקובץ
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  התבנית פעילה (תישלח למשתמשים חדשים)
                </Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  ביטול
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingTemplate ? "עדכן" : "צור תבנית"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                  <Badge className="bg-indigo-100 text-indigo-800">
                    {categoryNames[template.user_category]}
                  </Badge>
                </div>
                {template.is_active && (
                  <Badge className="bg-green-100 text-green-800">פעיל</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {template.description && (
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 ml-1" />
                  ערוך
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(template.file_url, '_blank')}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 ml-1" />
                  הורד
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(template)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && !loading && (
          <Card className="col-span-full p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין תבניות עדיין</h3>
            <p className="text-gray-600 mb-4">צור תבנית ראשונה כדי להתחיל לשלוח קבצים למשתמשים חדשים</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              צור תבנית ראשונה
            </Button>
          </Card>
        )}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את התבנית "{templateToDelete?.title}"? פעולה זו הינה בלתי הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}