import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function ConvertToCustomerModal({ lead, existingCustomer, onConfirm, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            המרה ללקוח
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 text-sm text-gray-700 space-y-3">
          {existingCustomer ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-700">לקוח עם אותו טלפון/אימייל כבר קיים!</p>
                <p className="text-orange-600">{existingCustomer.full_name}</p>
              </div>
            </div>
          ) : null}
          <p>האם להמיר את הליד <strong>{lead.full_name || lead.phone}</strong> ללקוח?</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>יירשם לקוח חדש עם פרטי הליד</li>
            <li>הליד המקורי יישמר</li>
            <li>יישלח התראה למנהל ולסוכן</li>
          </ul>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={onConfirm}>המר ללקוח</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}