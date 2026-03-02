import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DuplicateWarningModal({ existingLead, onOpenExisting, onAddAnyway, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            ליד קיים במערכת
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 text-gray-700 text-sm">
          <p>נמצא ליד קיים עם אותו טלפון / אימייל:</p>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <p className="font-semibold">{existingLead.full_name || "ללא שם"}</p>
            <p className="text-gray-500">{existingLead.phone} | {existingLead.email}</p>
            <p className="text-gray-500">סטטוס: {existingLead.status}</p>
          </div>
        </div>
        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button variant="outline" onClick={onOpenExisting} className="border-blue-500 text-blue-600">
            פתח ליד קיים
          </Button>
          <Button onClick={onAddAnyway} className="bg-orange-500 hover:bg-orange-600">
            הוסף בכל זאת
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}