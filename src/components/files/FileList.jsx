import React, { useState, useEffect, useCallback } from "react";
import { FileAttachment } from "@/entities/FileAttachment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File, Download, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function FileList({ relatedId, relatedType, refresh }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    try {
      const data = await FileAttachment.filter({
        related_id: relatedId,
        related_type: relatedType
      }, '-created_date');
      setFiles(data);
    } catch (error) {
      console.error("שגיאה בטעינת קבצים:", error);
    } finally {
      setLoading(false);
    }
  }, [relatedId, relatedType]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refresh]);

  const deleteFile = async (fileId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את הקובץ?")) {
      try {
        await FileAttachment.delete(fileId);
        loadFiles();
      } catch (error) {
        console.error("שגיאה במחיקת קובץ:", error);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-4">טוען קבצים...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="w-5 h-5" />
          קבצים מצורפים ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין קבצים מצורפים
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <File className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.filename}</p>
                    {file.description && (
                      <p className="text-xs text-gray-600 truncate">{file.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{format(new Date(file.created_date), "dd/MM/yyyy", { locale: he })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(file.file_url, '_blank')}
                    title="צפה בקובץ"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = file.file_url;
                      a.download = file.filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    title="הורד קובץ"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                    title="מחק קובץ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}