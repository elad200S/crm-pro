import React, { useState, useRef } from "react";
import { CheckCircle, PenLine, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

const todayStr = () => format(new Date(), "dd/MM/yyyy", { locale: he });

// כל השדות האפשריים — עם מיפוי לנתוני הליד ב-URL
const ALL_VARS = [
  { key: "{customer-id}",       label: 'ח"פ / ת"ז',    required: true,  leadField: "id_number" },
  { key: "{customer-address}",  label: "כתובת העסק",    required: false, leadField: "business_address" },
  { key: "{customer-email}",    label: "אימייל",         required: false, leadField: "email" },
  { key: "{customer-business}", label: "שם העסק",       required: false, leadField: "company" },
  { key: "{customer-name}",     label: "שם מלא",        required: false, leadField: "name" },
  { key: "{customer-phone}",    label: "טלפון",          required: false, leadField: "phone" },
];

const substituteAll = (text, clientData, price) => {
  if (!text) return "";
  const blank = "_______________";
  return text
    .replace(/\{customer-name\}/g,     clientData["{customer-name}"]     || blank)
    .replace(/\{customer-email\}/g,    clientData["{customer-email}"]    || blank)
    .replace(/\{customer-phone\}/g,    clientData["{customer-phone}"]    || blank)
    .replace(/\{customer-business\}/g, clientData["{customer-business}"] || blank)
    .replace(/\{customer-id\}/g,       clientData["{customer-id}"]       || blank)
    .replace(/\{customer-address\}/g,  clientData["{customer-address}"]  || blank)
    .replace(/\{current-date\}/g,      todayStr())
    .replace(/\{price\}/g,             price ? `₪${parseFloat(price).toLocaleString()}` : blank)
    .replace(/\{signature\}/g,         "");
};

// ─── Canvas חתימה ────────────────────────────────────────────────────────────
function SignaturePad({ onSignConfirmed }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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
    setConfirmed(false);
  };

  const stop = () => { drawing.current = false; };

  const clear = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSigned(false);
    setConfirmed(false);
    onSignConfirmed(null);
  };

  const confirm = () => {
    if (!signed) return;
    setConfirmed(true);
    onSignConfirmed(canvasRef.current.toDataURL("image/png"));
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
      <div className="flex items-center gap-3">
        <button onClick={clear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <RotateCcw className="w-3 h-3" /> נקה
        </button>
        {signed && !confirmed && (
          <button onClick={confirm} className="mr-auto px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            אשר חתימה ✓
          </button>
        )}
        {confirmed && (
          <span className="mr-auto text-sm text-green-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> החתימה אושרה
          </span>
        )}
      </div>
    </div>
  );
}

// ─── הדפסה / PDF ─────────────────────────────────────────────────────────────
function printDoc({ title, body, price, clientData, signatureDataUrl }) {
  const signImg = signatureDataUrl
    ? `<img src="${signatureDataUrl}" style="max-height:70px;margin-top:4px;" />`
    : "";
  const win = window.open("", "_blank");
  win.document.write(`
    <html dir="rtl"><head>
      <meta charset="utf-8"/>
      <title>${title || "הסכם עבודה"}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; color: #111; background: white; }
        .page { max-width: 820px; margin: 0 auto; padding: 54px 60px 70px; }
        .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; }
        .brand h1 { font-size: 26px; font-weight: 900; color: #2563eb; }
        .brand p { font-size: 12px; color: #94a3b8; margin-top: 3px; }
        .meta { text-align: left; }
        .meta h2 { font-size: 17px; font-weight: 700; color: #1e293b; }
        .meta p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .body { font-size: 14px; line-height: 2.1; color: #1e293b; white-space: pre-wrap; margin-bottom: 36px; }
        .price { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 44px; }
        .sig-row { display: flex; gap: 60px; margin-top: 14px; }
        .sig-line { flex: 1; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 11px; color: #94a3b8; text-align: center; }
        .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
      </style>
    </head><body><div class="page">
      <div class="hdr">
        <div class="brand"><h1>EH Automation</h1><p>אלעד חנינה • 054-710-8219</p></div>
        <div class="meta"><h2>${title || "הסכם עבודה"}</h2><p>תאריך: ${todayStr()}</p></div>
      </div>
      <div class="body">${body.replace(/\n/g, "<br/>")}</div>
      ${price > 0 ? `<div class="price"><span style="color:#3b82f6;font-weight:600;font-size:13px">סכום הסכם</span><span style="font-size:24px;font-weight:900;color:#1d4ed8">&#8362;${parseFloat(price).toLocaleString()}</span></div>` : ""}
      <div class="sig-row">
        <div class="sig-line">${signImg}<div>חתימת הלקוח — ${clientData["{customer-name}"] || ""}</div><div style="font-size:10px;margin-top:2px">${todayStr()}</div></div>
        <div class="sig-line">EH Automation — אלעד חנינה</div>
      </div>
      <div class="footer"><span>EH Automation • אלעד חנינה • 054-710-8219</span><span>הופק: ${todayStr()}</span></div>
    </div></body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

// ─── דף ראשי ─────────────────────────────────────────────────────────────────
export default function ClientSign() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("q");

  let docData = null;
  try {
    docData = JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {}

  const { id, title, rawBody, amount, valid_until, lead } = docData || {};
  const price = parseFloat(amount) || 0;

  // מילוי מוקדם מנתוני הליד ב-URL
  const initData = {};
  ALL_VARS.forEach(v => {
    const val = lead?.[v.leadField] || "";
    if (val) initData[v.key] = val;
  });

  // שדות שחסרים מהמסמך ולא נמלאו מהליד
  const computeNeeded = (cd) =>
    ALL_VARS.filter(v => (rawBody || "").includes(v.key) && !(cd[v.key] || "").trim());

  const [clientData, setClientData] = useState(initData);
  const [step, setStep] = useState(() =>
    computeNeeded(initData).length === 0 ? "document" : "form"
  );
  const [signature, setSignature] = useState(null);
  const [signing, setSigning] = useState(false);

  if (!docData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center p-8">
          <p className="text-4xl mb-3">❌</p>
          <h2 className="text-lg font-bold text-gray-700 mb-1">קישור לא תקין</h2>
          <p className="text-gray-400 text-sm">פנה לאלעד חנינה לקבל קישור מחודש</p>
        </div>
      </div>
    );
  }

  const neededVars = computeNeeded(clientData);
  const allRequired = neededVars.filter(v => v.required).every(v => (clientData[v.key] || "").trim());
  const body = substituteAll(rawBody || "", clientData, amount);

  const handleFormSubmit = async () => {
    try {
      if (id) {
        await base44.entities.Quote.update(id, {
          signing_client_id:      clientData["{customer-id}"]       || "",
          signing_client_address: clientData["{customer-address}"]  || "",
          signing_client_email:   clientData["{customer-email}"]    || "",
          signing_client_company: clientData["{customer-business}"] || "",
        });
      }
    } catch {}
    setStep("document");
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      if (id) await base44.entities.Quote.update(id, { status: "אושר" });
    } catch {}
    setSigning(false);
    setStep("done");
  };

  // ── שלב 1: טופס פרטים חסרים ───────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-black text-blue-600">EH Automation</h1>
            <p className="text-gray-400 text-xs mt-0.5">אלעד חנינה • 054-710-8219</p>
            <div className="mt-4 h-px bg-gray-100" />
            <h2 className="text-lg font-bold text-gray-800 mt-4">ממתין לך מסמך לחתימה</h2>
            {lead?.name && <p className="text-sm text-gray-500 mt-1">שלום, {lead.name}</p>}
          </div>

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
              onClick={handleFormSubmit}
            >
              שמור והמשך לחתימה ←
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── שלב 2: מסמך + חתימה ──────────────────────────────────────────────────
  if (step === "document") {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

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

          <div className="px-10 py-8">
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-loose mb-8">
              {body}
            </div>

            {price > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex justify-between items-center mb-8">
                <span className="text-sm font-semibold text-blue-600">סכום הסכם</span>
                <span className="text-2xl font-black text-blue-700">&#8362;{price.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t-2 border-gray-100 pt-8">
              <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <PenLine className="w-4 h-4 text-blue-600" /> חתימה דיגיטלית
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                קראתי את ההסכם ואני מסכים/ה לכל תנאיו — אנא חתום/י למטה ולחץ "אשר חתימה"
              </p>
              <SignaturePad onSignConfirmed={setSignature} />
            </div>
          </div>

          <div className="px-10 pb-4">
            <div className="flex gap-16">
              <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
                חתימת הלקוח — {clientData["{customer-name}"] || lead?.name || ""}
              </div>
              <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
                EH Automation — אלעד חנינה
              </div>
            </div>
          </div>

          <div className="px-10 pb-8 pt-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold"
              disabled={!signature || signing}
              onClick={handleSign}
            >
              <CheckCircle className="w-5 h-5 ml-2" />
              {signing ? "שומר..." : "אשר וחתום על ההסכם"}
            </Button>
            {!signature && (
              <p className="text-xs text-gray-400 text-center mt-2">יש לחתום ולאשר את החתימה לפני הגשה</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── שלב 3: אישור + PDF ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">ההסכם נחתם!</h2>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className="text-gray-400 text-xs">{todayStr()}</p>

        <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700 mb-6">
          תודה, {clientData["{customer-name}"] || lead?.name || ""}.<br />
          ההסכם נחתם ונשמר בהצלחה.<br />
          נציג מ-EH Automation יצור איתך קשר בקרוב.
        </div>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          onClick={() => printDoc({ title, body, price, clientData, signatureDataUrl: signature })}
        >
          <Download className="w-4 h-4" />
          הורד / הדפס עותק PDF
        </Button>
      </div>
    </div>
  );
}
