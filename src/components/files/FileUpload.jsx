import React, { useState, useCallback } from "react";
import { FileAttachment } from "@/entities/FileAttachment";
import { UploadFile } from "@/integrations/Core";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function FileUpload({ relatedId, relatedType, onFileUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");

  const uploadFile = useCallback(async (file) => {
    setUploading(true);
    try {
      // העלאת הקובץ
      const { file_url } = await UploadFile({ file });

      // שמירת פרטי הקובץ במסד הנתונים
      await FileAttachment.create({
        filename: file.name,
        file_url: file_url,
        file_size: file.size,
        file_type: file.type,
        related_id: relatedId,
        related_type: relatedType,
        description: description
      });

      setDescription("");
      if (onFileUploaded) onFileUploaded();
    } catch (error) {
      console.error("שגיאה בהעלאת קובץ:", error);
      alert("שגיאה בהעלאת הקובץ");
    } finally {
      setUploading(false);
    }
  }, [relatedId, relatedType, description, onFileUploaded]);

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          העלאת קבצים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">שחרר את הקבצים כאן...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">גרור קבצים לכאן או לחץ לבחירה</p>
              <p className="text-sm text-gray-500">תמיכה בקבצים עד 10MB</p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="description">תיאור הקובץ (אופציונלי)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור קצר של הקובץ..."
            rows={2}
          />
        </div>

        {uploading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">מעלה קובץ...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}