import React, { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Tag, User } from "lucide-react";

const VARIABLES = [
  { key: "{customer-name}",     label: "שם לקוח",   autoField: "full_name" },
  { key: "{customer-id}",       label: 'ח"פ / ת"ז', autoField: "id_number" },
  { key: "{customer-email}",    label: "מייל",       autoField: "email" },
  { key: "{customer-phone}",    label: "טלפון",      autoField: "phone" },
  { key: "{customer-business}", label: "שם העסק",   autoField: "company_name" },
  { key: "{customer-address}",  label: "כתובת העסק", autoField: "business_address" },
  { key: "{current-date}",      label: "תאריך היום", autoField: "__date__" },
  { key: "{price}",             label: "מחיר",       autoField: "__price__" },
  { key: "{signature}",         label: "חתימה",      autoField: "__sig__" },
];

const DEFAULT_BODY = `{customer-name}
ח"פ/ת"ז: {customer-id}
מייל: {customer-email}
טלפון: {customer-phone}
שם העסק: {customer-business}

הח"מ {customer-name} (להלן: "המזמין"), מזמין בזה את שירותיה של EH Automation (להלן: "החברה"), על פי תנאי הסכם התקשרות זה.

תיאור השירותים:


תמורה:
סכום הסכם: {price}

תנאי תשלום:


{current-date}

חתימת המזמין: {signature}`;

// מזהה אילו משתנים קיימים בטקסט ואין להם ערך אוטומטי מהליד
const detectMissingVars = (body, lead) => {
  return VARIABLES.filter(v => {
    if (!body.includes(v.key)) return false;          // לא בשימוש בטקסט
    if (v.autoField === "__date__") return false;     // תאריך — אוטומטי
    if (v.autoField === "__price__") return false;    // מחיר — בשדה נפרד
    if (v.autoField === "__sig__") return false;      // חתימה — placeholder
    if (v.autoField && lead?.[v.autoField]) return false; // יש ערך בליד
    return true;                                       // חסר
  });
};

export default function DocumentModal({ doc, lead, onSubmit, onClose }) {
  const isNew = !doc?.id;
  const hasLead = !!lead;
  const entityName = lead?.full_name || null;
  const textareaRef = useRef();

  const [form, setForm] = useState({
    title: doc?.title || "",
    body: doc?.notes || (isNew ? DEFAULT_BODY : ""),
    price: doc?.amount || "",
    valid_until: doc?.valid_until || "",
  });

  // שדות ידניים שהמשתמש ימלא
  const [manualVars, setManualVars] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setVar = (k, v) => setManualVars(m => ({ ...m, [k]: v }));

  // משתנים חסרים (לא ממולאים מהליד)
  const missingVars = useMemo(
    () => hasLead ? detectMissingVars(form.body, lead) : [],
    [form.body, lead]
  );

  // מוסיף משתנה לתוך הטקסט במיקום הסמן
  const insertVar = (varKey) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newBody = form.body.slice(0, start) + varKey + form.body.slice(end);
    set("body", newBody);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    // שמור את הערכים הידניים בתוך הטקסט לפני שמירה
    let finalBody = form.body;
    Object.entries(manualVars).forEach(([key, val]) => {
      if (val) finalBody = finalBody.replaceAll(key, val);
    });
    onSubmit({
      title: form.title,
      notes: finalBody,
      amount: parseFloat(form.price) || 0,
      valid_until: form.valid_until,
      status: "טיוטה",
      items: [],
      discount: 0,
      vat_included: false,
      currency: "ILS",
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="w-5 h-5 text-blue-600" />
            {isNew ? "מסמך חדש" : "עריכת מסמך"}
            {entityName && <span className="text-sm font-normal text-gray-400">— {entityName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* כותרת */}
          <div className="space-y-1.5">
            <Label>כותרת המסמך *</Label>
            <Input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="לדוגמה: הסכם שירות — אוטומציה"
            />
          </div>

          {/* שדות ידניים — רק כשיש ליד ויש משתנים חסרים */}
          {hasLead && missingVars.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-3">
                <User className="w-3.5 h-3.5" />
                פרטי לקוח חסרים — מלא לפני שליחה
              </p>
              <div className="grid grid-cols-2 gap-3">
                {missingVars.map(v => (
                  <div key={v.key} className="space-y-1">
                    <Label className="text-xs text-amber-800">{v.label}</Label>
                    <Input
                      value={manualVars[v.key] || ""}
                      onChange={e => setVar(v.key, e.target.value)}
                      placeholder={v.label}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* משתנים זמינים (כשלא יש ליד — עורכים תבנית) */}
          {!hasLead && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-2">
                <Tag className="w-3.5 h-3.5" /> משתנים — לחץ להוספה בטקסט
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVar(v.key)}
                    className="px-2 py-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-mono"
                  >
                    {v.key} <span className="text-gray-400 font-sans">({v.label})</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-blue-400 mt-2">ערכים אלו יתמלאו אוטומטית מנתוני הליד בעת יצירת מסמך ללקוח</p>
            </div>
          )}

          {/* תוכן */}
          <div className="space-y-1.5">
            <Label>תוכן המסמך</Label>
            <Textarea
              ref={textareaRef}
              rows={16}
              value={form.body}
              onChange={e => set("body", e.target.value)}
              placeholder="כתוב כאן את תוכן הסכם העבודה..."
              className="resize-y font-mono text-sm leading-relaxed"
              dir="rtl"
            />
          </div>

          {/* מחיר + תוקף */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>מחיר (₪)</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>בתוקף עד</Label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={e => set("valid_until", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={!form.title.trim()}
          >
            {isNew ? "צור מסמך" : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
