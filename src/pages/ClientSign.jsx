import React, { useState, useRef, useEffect } from "react";
import { CheckCircle, PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

const todayStr = () => format(new Date(), "dd/MM/yyyy", { locale: he });

// משתנים שהלקוח ממלא
const CLIENT_VARS = [
  { key: "{customer-id}",      label: 'ח"פ / ת"ז',    required: true },
  { key: "{customer-address}", label: "כתובת העסק",    required: false },
];

const substituteAll = (text, lead, price, clientData) => {
  if (!text) return "";
  const blank = "_______________";
  return text
    .replace(/\{customer-name\}/g,     lead?.name     || blank)
    .replace(/\{customer-email\}/g,    lead?.email    || blank)
    .replace(/\{customer-phone\}/g,    lead?.phone    || blank)
    .replace(/\{customer-business\}/g, lead?.company  || blank)
    .replace(/\{customer-id\}/g,       clientData["{customer-id}"]      || blank)
    .replace(/\{customer-address\}/g,  clientData["{customer-address}"] || blank)
    .replace(/\{current-date\}/g,      todayStr())
    .replace(/\{price\}/g,             price ? `₪${parseFloat(price).toLocaleString()}` : blank)
    .replace(/\{signature\}/g,         "");
};

// ─── Canvas חתימה ────────────────────────────────────────────────────────────
function SignaturePad({ onSign }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setSigned(true);
  };

  const stop = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onSign(null);
  };

  const confirm = () => {
    if (!signed) return;
    onSign(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={560}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
        />
        {!signed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm flex items-center gap-2">
              <PenLine className="w-4 h-4" /> חתום כאן
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={clear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <RotateCcw className="w-3 h-3" /> נקה
        </button>
        {signed && (
          <button onClick={confirm}
            className="mr-auto px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            אשר חתימה ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ─── דף ראשי ─────────────────────────────────────────────────────────────────
export default function ClientSign() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("q");

  let docData = null;
  try { docData = JSON.parse(atob(encoded)); } catch {}

  const [step, setStep] = useState("form"); // "form" | "document" | "done"
  const [clientData, setClientData] = useState({});
  const [signature, setSignature] = useState(null);
  const [sigConfirmed, setSigConfirmed] = useState(false);
  const printRef = useRef();

  if (!docData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center p-8">
          <p className="text-2xl mb-2">❌</p>
          <p className="text-gray-500">קישור לא תקין או פג תוקף</p>
        </div>
      </div>
    );
  }

  const { id, title, rawBody, amount, valid_until, lead } = docData;
  const price = parseFloat(amount) || 0;

  // משתנים שנדרש למלא
  const neededVars = CLIENT_VARS.filter(v => (rawBody || "").includes(v.key));
  const allRequired = neededVars.filter(v => v.required).every(v => (clientData[v.key] || "").trim());

  const body = substituteAll(rawBody || "", lead, amount, clientData);

  const handleSign = async () => {
    // נסה לעדכן את הסטטוס במערכת
    try {
      if (id) await base44.entities.Quote.update(id, { status: "אושר" });
    } catch {}
    setStep("done");
  };

  // ── שלב 1: טופס ──────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-black text-blue-600">EH Automation</h1>
            <p className="text-gray-400 text-xs mt-0.5">אלעד חנינה • 054-710-8219</p>
            <div className="mt-4 h-px bg-gray-100" />
            <h2 className="text-lg font-bold text-gray-800 mt-4">{title}</h2>
            {lead?.name && <p className="text-sm text-gray-500 mt-1">שלום, {lead.name}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
            לפני הצגת ההסכם נדרש למלא את הפרטים הבאים
          </div>

          {neededVars.length === 0 ? (
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setStep("document")}>
              הצג הסכם ←
            </Button>
          ) : (
            <div className="space-y-4">
              {neededVars.map(v => (
                <div key={v.key} className="space-y-1.5">
                  <Label>{v.label}{v.required ? " *" : ""}</Label>
                  <Input
                    value={clientData[v.key] || ""}
                    onChange={e => setClientData(d => ({ ...d, [v.key]: e.target.value }))}
                    placeholder={`הזן ${v.label}`}
                  />
                </div>
              ))}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                disabled={!allRequired}
                onClick={() => setStep("document")}
              >
                המשך לצפייה בהסכם ←
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── שלב 2: מסמך + חתימה ──────────────────────────────────────────────────
  if (step === "document") {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* כותרת */}
          <div className="bg-blue-600 px-10 py-5 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-white">EH Automation</h1>
              <p className="text-blue-200 text-xs mt-0.5">אלעד חנינה • 054-710-8219</p>
            </div>
            <div className="text-left text-blue-100 text-sm">
              <p className="font-bold text-white text-base">{title}</p>
              <p className="text-xs mt-0.5">תאריך: {todayStr()}</p>
              {valid_until && <p className="text-xs">בתוקף עד: {valid_until}</p>}
            </div>
          </div>

          {/* גוף המסמך */}
          <div ref={printRef} className="px-10 py-8">
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-loose mb-8">
              {body}
            </div>

            {price > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex justify-between items-center mb-8">
                <span className="text-sm font-semibold text-blue-600">סכום הסכם</span>
                <span className="text-2xl font-black text-blue-700">₪{price.toLocaleString()}</span>
              </div>
            )}

            {/* חתימה דיגיטלית */}
            <div className="border-t-2 border-gray-100 pt-8 mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <PenLine className="w-4 h-4 text-blue-600" /> חתימה דיגיטלית
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                קראתי את ההסכם ואני מסכים/ה לכל תנאיו — אנא חתום/י למטה
              </p>

              {sigConfirmed ? (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">החתימה אושרה</p>
                    <p className="text-xs text-green-500">{todayStr()} — {lead?.name || ""}</p>
                  </div>
                </div>
              ) : (
                <SignaturePad onSign={(sig) => {
                  setSignature(sig);
                  if (sig) setSigConfirmed(true);
                }} />
              )}
            </div>
          </div>

          {/* כפתור אישור */}
          <div className="px-10 pb-8">
            <div className="flex gap-16 mb-8">
              <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
                חתימת הלקוח — {lead?.name || ""}
              </div>
              <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
                EH Automation — אלעד חנינה
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold"
              disabled={!sigConfirmed}
              onClick={handleSign}
            >
              <CheckCircle className="w-5 h-5 ml-2" />
              אשר וחתום על ההסכם
            </Button>
            {!sigConfirmed && (
              <p className="text-xs text-gray-400 text-center mt-2">יש לחתום לפני האישור</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── שלב 3: אישור ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">ההסכם נחתם!</h2>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className="text-gray-400 text-xs">{todayStr()}</p>
        <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700">
          תודה, {lead?.name || ""}. ההסכם נחתם ונשמר בהצלחה.
          <br />נציג מ-EH Automation יצור איתך קשר בקרוב.
        </div>
      </div>
    </div>
  );
}
