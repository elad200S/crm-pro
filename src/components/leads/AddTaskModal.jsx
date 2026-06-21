import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Calendar, Clock, AlertCircle } from "lucide-react";

// פרסור תאריך עברי חכם
const parseHebrewTask = (text) => {
  const now = new Date();
  let due = new Date(now.getTime() + 24 * 60 * 60 * 1000); // default: מחר
  let title = text.trim();

  const dayMap = { ראשון: 0, שני: 1, שלישי: 2, רביעי: 3, חמישי: 4, שישי: 5, שבת: 6 };
  const monthMap = { ינואר:0,פברואר:1,מרץ:2,אפריל:3,מאי:4,יוני:5,יולי:6,אוגוסט:7,ספטמבר:8,אוקטובר:9,נובמבר:10,דצמבר:11 };

  let dateFound = false;

  // "מחר"
  if (/מחר/.test(text)) { due = new Date(now); due.setDate(due.getDate() + 1); dateFound = true; }
  // "היום"
  else if (/היום/.test(text)) { due = new Date(now); dateFound = true; }
  // "בעוד X ימים"
  else if (/בעוד\s+(\d+)\s+ימים?/.test(text)) {
    const m = text.match(/בעוד\s+(\d+)\s+ימים?/);
    due = new Date(now); due.setDate(due.getDate() + parseInt(m[1])); dateFound = true;
  }
  // "בשבוע הבא" / "שבוע הבא"
  else if (/שבוע\s+הבא/.test(text)) { due = new Date(now); due.setDate(due.getDate() + 7); dateFound = true; }
  // "ביום שישי" / "יום חמישי"
  else {
    for (const [dayName, dayNum] of Object.entries(dayMap)) {
      if (text.includes(dayName)) {
        due = new Date(now);
        const diff = (dayNum - now.getDay() + 7) % 7 || 7;
        due.setDate(due.getDate() + diff);
        dateFound = true;
        break;
      }
    }
  }

  // "ב-DD/MM" / "DD.MM"
  if (!dateFound) {
    const dmMatch = text.match(/(\d{1,2})[\/\.](\d{1,2})/);
    if (dmMatch) {
      due = new Date(now.getFullYear(), parseInt(dmMatch[2]) - 1, parseInt(dmMatch[1]));
      if (due < now) due.setFullYear(due.getFullYear() + 1);
      dateFound = true;
    }
  }

  // "בשעה X" / "ב-X"
  const hourMatch = text.match(/בשעה?\s*(\d{1,2})(?::(\d{2}))?/) || text.match(/\bב[-](\d{1,2})(?::(\d{2}))?/);
  if (hourMatch) {
    due.setHours(parseInt(hourMatch[1]), parseInt(hourMatch[2] || 0), 0, 0);
  } else {
    due.setHours(9, 0, 0, 0);
  }

  // ניקוי התאריך מהכותרת
  title = text
    .replace(/מחר|היום|שבוע\s+הבא/g, '')
    .replace(/ב?יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/g, '')
    .replace(/בעוד\s+\d+\s+ימים?/g, '')
    .replace(/בשעה?\s*\d{1,2}(?::\d{2})?/g, '')
    .replace(/ב[-]\d{1,2}(?::\d{2})?/g, '')
    .replace(/\d{1,2}[\/\.]\d{1,2}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) title = text.trim();

  return {
    title,
    due_date: due.toISOString().split('T')[0],
    due_time: `${String(due.getHours()).padStart(2,'0')}:${String(due.getMinutes()).padStart(2,'0')}`,
    due,
  };
};

const formatPreview = (parsed) => {
  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const d = parsed.due;
  return `יום ${days[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1} בשעה ${parsed.due_time}`;
};

export default function AddTaskModal({ lead, users, currentUser, accountId, onSubmit, onClose }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [step, setStep] = useState("input"); // "input" | "confirm"

  const handleParse = () => {
    if (!text.trim()) return;
    const result = parseHebrewTask(text);
    setParsed(result);
    setStep("confirm");
  };

  const handleSubmit = () => {
    onSubmit({
      title: parsed.title,
      due_date: parsed.due_date,
      status: "פתוח",
      priority: "בינונית",
      lead_id: lead?.id,
      customer_id: lead?.customer_id,
      assigned_to: currentUser?.id,
      account_id: accountId,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            משימה חדשה
            {lead && <span className="text-sm font-normal text-gray-400">— {lead.full_name || lead.phone}</span>}
          </DialogTitle>
        </DialogHeader>

        {step === "input" ? (
          <>
            <div className="py-2">
              <p className="text-sm text-gray-500 mb-3">תאר את המשימה בחופשיות. לדוגמה:</p>
              <div className="space-y-1 mb-4 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                <p>• "להתקשר לאלעד מחר בשעה 10"</p>
                <p>• "לשלוח הצעה ביום שישי ב-14:00"</p>
                <p>• "פגישה בעוד 3 ימים ב-9"</p>
              </div>
              <Textarea
                autoFocus
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
                placeholder="כתוב כאן..."
                className="text-base resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">Enter לאישור</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>ביטול</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleParse} disabled={!text.trim()}>
                <Sparkles className="w-3.5 h-3.5 ml-1.5" /> המשך
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-2 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-500 font-medium mb-2">הבנתי את המשימה:</p>
                <p className="font-semibold text-gray-800 text-base mb-3">{parsed.title}</p>
                <div className="flex items-center gap-4 text-sm text-blue-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatPreview(parsed)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">הכל נכון?</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("input")}>תיקון</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
                צור משימה
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
