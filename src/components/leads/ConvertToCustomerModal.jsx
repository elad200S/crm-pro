import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function ConvertToCustomerModal({ lead, existingCustomer, onConfirm, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center" dir="rtl">
        <div className="flex flex-col items-center pt-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl text-center">המרה ללקוח</DialogTitle>
          </DialogHeader>

          <div className="py-3 text-sm text-gray-700 space-y-4 w-full">
            {existingCustomer && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2 text-right">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-700">לקוח עם אותו טלפון/אימייל כבר קיים!</p>
                  <p className="text-orange-600">{existingCustomer.full_name}</p>
                </div>
              </div>
            )}

            <p>
              להמיר את <strong>{lead.full_name || lead.phone}</strong> מליד ללקוח?
            </p>

            <ul className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-right text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                יירשם לקוח חדש עם פרטי הליד
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                הליד המקורי יישמר
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                יישלח התראה למנהל ולסוכן
              </li>
            </ul>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 h-11 text-base gap-2"
            onClick={onConfirm}
          >
            <CheckCircle2 className="w-4 h-4" />
            המר ללקוח
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ביטול
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}