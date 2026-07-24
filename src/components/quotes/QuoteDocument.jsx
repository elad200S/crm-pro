import React, { useRef, useState } from "react";
import { X, Printer, Mail, MessageCircle, CheckCircle, Link2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const todayStr = () => format(new Date(), "dd/MM/yyyy", { locale: he });

// משתנים שהלקוח חייב למלא (לא ניתן לאחזר מהליד)
const CLIENT_FILL_VARS = [
  { key: "{customer-id}",      label: 'ח"פ / ת"ז' },
  { key: "{customer-address}", label: "כתובת העסק" },
];

const substituteAll = (text, lead, price, clientData = {}) => {
  if (!text) return "";
  const blank = "_______________";
  return text
    .replace(/\{customer-name\}/g,     lead?.full_name     || blank)
    .replace(/\{customer-email\}/g,    lead?.email         || blank)
    .replace(/\{customer-phone\}/g,    lead?.phone         || blank)
    .replace(/\{customer-business\}/g, lead?.company_name  || blank)
    .replace(/\{customer-id\}/g,       clientData["{customer-id}"]      || blank)
    .replace(/\{customer-address\}/g,  clientData["{customer-address}"] || blank)
    .replace(/\{current-date\}/g,      todayStr())
    .replace(/\{price\}/g,             price ? `₪${parseFloat(price).toLocaleString()}` : blank)
    .replace(/\{signature\}/g,         "________________________");
};

export default function QuoteDocument({ quote, lead, onClose, onApprove }) {
  const printRef = useRef();
  const rawBody  = quote?.notes || "";
  const price    = parseFloat(quote?.amount) || 0;

  // זיהוי אילו משתנים של לקוח קיימים בטקסט ועדיין לא מולאו
  const neededVars = CLIENT_FILL_VARS.filter(v => rawBody.includes(v.key));
  const [clientData, setClientData] = useState({});
  const [gateSubmitted, setGateSubmitted] = useState(true);
  const [approved, setApproved] = useState(false);

  const body = substituteAll(rawBody, lead, quote?.amount, clientData);

  const allFilled = neededVars.every(v => (clientData[v.key] || "").trim() !== "");

  const handleApprove = async () => {
    try {
      if (quote?.id) {
        await base44.entities.Quote.update(quote.id, { status: "אושר" });
      }
    } catch {}
    setApproved(true);
    if (onApprove) onApprove();
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl">
        <head>
          <meta charset="utf-8"/>
          <title>${quote?.title || "מסמך"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: 'Segoe UI', 'Heebo', Arial, sans-serif; direction: rtl; color: #0e1b14; background: white; }
            .page { max-width: 820px; margin: 0 auto; padding: 0 40px 40px; }
            .head { background: linear-gradient(135deg, #0A8E7F 0%, #0B1B1A 100%); color: #fff; border-radius: 0 0 22px 22px; padding: 30px 36px; margin: 0 -40px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand .tag { color: #5DF5D1; letter-spacing: 2px; font-size: 10px; margin-top: 8px; }
            .brand p { font-size: 12px; opacity: .75; margin-top: 3px; }
            .doc-meta { text-align: left; font-size: 12.5px; }
            .doc-meta h2 { font-size: 17px; font-weight: 700; }
            .doc-meta p { opacity: .8; margin-top: 3px; }
            .body-text { font-size: 14px; line-height: 2.1; white-space: pre-wrap; margin-bottom: 32px; }
            .price-box { background: #e8f7f4; border: 1px solid #d8ebe7; border-radius: 14px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .price-box .lbl { font-size: 13px; color: #0A8E7F; font-weight: 700; }
            .price-box .amt { font-size: 24px; font-weight: 800; color: #0A8E7F; }
            .sig-row { display: flex; gap: 60px; margin-top: 14px; align-items: flex-end; }
            .sig-line { flex: 1; font-size: 11px; color: #5f7a6c; text-align: center; }
            .sig-line img { display: block; margin: 0 auto; }
            .sig-line .sigwrap { display: flex; align-items: flex-end; justify-content: center; gap: 12px; }
            .sig-line .sigwrap img { margin: 0; }
            .sig-line .line { border-top: 1px solid #5f7a6c; padding-top: 8px; }
            .footer { margin-top: 44px; padding-top: 14px; border-top: 1px solid #d8ebe7; display: flex; justify-content: space-between; font-size: 11px; color: #5f7a6c; }
            @page { size: A4; margin: 0; }
            @media print { .page { padding: 0 40px 30px; } }
          </style>
        </head>
        <body><div class="page">
          <div class="head">
            <div class="brand">
              <img src="${window.location.origin}/logo-hey.png" style="height:38px;" />
              <p class="tag">AUTOMATE. GROW. SUCCEED.</p>
              <p>אלעד חנינה • 054-710-8219 • eladauto66@gmail.com</p>
            </div>
            <div class="doc-meta">
              <h2>${quote?.title || "הסכם עבודה"}</h2>
              <p>תאריך: ${todayStr()}</p>
              ${quote?.valid_until ? `<p>בתוקף עד: ${format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}</p>` : ""}
            </div>
          </div>
          <div class="body-text">${body.replace(/\n/g, "<br/>")}</div>
          ${price > 0 ? `<div class="price-box"><span class="lbl">סכום הסכם</span><span class="amt">&#8362;${price.toLocaleString()}</span></div>` : ""}
          <div class="sig-row">
            <div class="sig-line"><div class="line">חתימת הלקוח ותאריך</div></div>
            <div class="sig-line"><div class="sigwrap"><img src="${window.location.origin}/signature.png" style="max-height:52px;" /><img src="${window.location.origin}/stamp-hey.png" style="max-height:66px;" /></div><div class="line">HEY Digital — אלעד חנינה</div></div>
          </div>
          <div class="footer"><span>HEY Digital • אלעד חנינה • 054-710-8219</span><span>הופק: ${todayStr()}</span></div>
        </div></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleWhatsApp = () => {
    const phone = (lead?.phone || "").replace(/[^0-9]/g, "");
    const intlPhone = phone.startsWith("0") ? "972" + phone.slice(1) : phone;
    const text = encodeURIComponent(
      `*${quote?.title || "הסכם עבודה"}*\n\n${body}${price > 0 ? `\n\n*סכום הסכם: ₪${price.toLocaleString()}*` : ""}\n\n_HEY Digital — אלעד חנינה | 054-710-8219_`
    );
    window.open(`https://wa.me/${intlPhone}?text=${text}`, "_blank");
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const [shortLinkCache, setShortLinkCache] = useState(null);
  const [shorteningLink, setShorteningLink] = useState(false);

  const buildRawLink = () => {
    const data = {
      id: quote?.id,
      title: quote?.title,
      rawBody: quote?.notes,
      amount: quote?.amount,
      valid_until: quote?.valid_until,
      lead: {
        name: lead?.full_name,
        phone: lead?.phone,
        email: lead?.email,
        company: lead?.company_name,
        id_number: lead?.id_number || "",
        business_address: lead?.business_address || "",
      }
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    return `${window.location.origin}/ClientSign?q=${encoded}`;
  };

  const getSignLink = async () => {
    if (shortLinkCache) return shortLinkCache;
    const longUrl = buildRawLink();
    setShorteningLink(true);
    try {
      const resp = await fetch(
        `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const short = await resp.text();
      if (short.startsWith("https://is.gd/")) {
        setShortLinkCache(short);
        setShorteningLink(false);
        return short;
      }
    } catch {}
    setShorteningLink(false);
    return longUrl;
  };

  const handleCopyLink = async () => {
    const link = await getSignLink();
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const handleSendLinkWhatsApp = async () => {
    const link = await getSignLink();
    const phone = (lead?.phone || "").replace(/[^0-9]/g, "");
    const intlPhone = phone.startsWith("0") ? "972" + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `שלום ${lead?.full_name || ""},\n\nמצורף הסכם העבודה שלנו לחתימה:\n👇 לחץ/י על הקישור למילוי פרטים וחתימה דיגיטלית:\n\n${link}\n\n_HEY Digital — אלעד חנינה_`
    );
    window.open(`https://wa.me/${intlPhone}?text=${msg}`, "_blank");
  };

  const handleEmail = () => {
    const to = lead?.email || "";
    const subject = encodeURIComponent(quote?.title || "הסכם עבודה");
    const bodyText = encodeURIComponent(
      `שלום ${lead?.full_name || ""},\n\n${body}\n\nבברכה,\nHEY Digital — אלעד חנינה\n054-710-8219`
    );
    window.open(`mailto:${to}?subject=${subject}&body=${bodyText}`, "_blank");
  };

  // ── שלב 1: טופס פרטי לקוח ──────────────────────────────────────────────
  if (!gateSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" dir="rtl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{quote?.title || "הסכם עבודה"}</h2>
            <p className="text-sm text-gray-500 mt-1">מאת HEY Digital — אלעד חנינה</p>
          </div>

          <div className="bg-teal-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-teal-700 font-medium mb-1">לפני הצפייה במסמך</p>
            <p className="text-xs text-teal-600">יש למלא את הפרטים הבאים — הם יופיעו בהסכם</p>
          </div>

          <div className="space-y-4">
            {neededVars.map(v => (
              <div key={v.key} className="space-y-1.5">
                <Label className="text-sm font-medium">{v.label} *</Label>
                <Input
                  value={clientData[v.key] || ""}
                  onChange={e => setClientData(d => ({ ...d, [v.key]: e.target.value }))}
                  placeholder={`הזן ${v.label}`}
                  className="h-10"
                />
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-6 bg-teal-700 hover:bg-teal-800 h-11 text-base"
            disabled={!allFilled}
            onClick={() => setGateSubmitted(true)}
          >
            צפה בהסכם ←
          </Button>

          <p className="text-xs text-gray-400 text-center mt-3">
            הפרטים ישמשו לצורך הסכם זה בלבד
          </p>
        </div>
      </div>
    );
  }

  // ── שלב 2: המסמך ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-2xl flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors">
              <Printer className="w-4 h-4" /> הדפסה / PDF
            </button>
            {lead?.phone && (
              <button onClick={handleSendLinkWhatsApp} disabled={shorteningLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60">
                <MessageCircle className="w-4 h-4" />
                {shorteningLink ? "מכין קישור..." : "שלח קישור לחתימה"}
              </button>
            )}
            <button onClick={handleCopyLink} disabled={shorteningLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60">
              <Link2 className="w-4 h-4" />
              {linkCopied ? "✓ הועתק!" : shorteningLink ? "מקצר..." : "העתק קישור"}
            </button>
            {lead?.email && (
              <button onClick={handleEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                <Mail className="w-4 h-4" /> מייל
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Document */}
        <div ref={printRef} className="px-14 py-10" dir="rtl"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

          <div className="flex justify-between items-start mb-8 rounded-2xl px-6 py-5 text-white"
            style={{ background: "linear-gradient(135deg,#0A8E7F,#0B1B1A)" }}>
            <div>
              <img src="/logo-hey.png" alt="HEY Digital" className="h-9" />
              <p className="text-[10px] mt-2 tracking-widest" style={{ color: "#5DF5D1" }}>AUTOMATE. GROW. SUCCEED.</p>
              <p className="text-xs opacity-75 mt-1">אלעד חנינה • 054-710-8219</p>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold">{quote?.title || "הסכם עבודה"}</h2>
              <p className="text-xs mt-1 opacity-80">תאריך: {todayStr()}</p>
              {quote?.valid_until && (
                <p className="text-xs opacity-80">
                  בתוקף עד: {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}
                </p>
              )}
            </div>
          </div>

          {body && (
            <div className="text-sm text-gray-800 whitespace-pre-wrap mb-8"
              style={{ lineHeight: "2.1" }}>
              {body}
            </div>
          )}

          {price > 0 && (
            <div className="rounded-xl px-5 py-4 flex justify-between items-center mb-10"
              style={{ background: "#e8f7f4", border: "1px solid #d8ebe7" }}>
              <span className="text-sm font-bold" style={{ color: "#0A8E7F" }}>סכום הסכם</span>
              <span className="text-2xl font-black" style={{ color: "#0A8E7F" }}>₪{price.toLocaleString()}</span>
            </div>
          )}

          <div className="flex gap-16 mt-14 items-end">
            <div className="flex-1 text-center text-xs text-gray-400">
              <div className="border-t border-gray-300 pt-3">חתימת הלקוח ותאריך</div>
            </div>
            <div className="flex-1 text-center text-xs text-gray-400">
              <div className="flex items-end justify-center gap-3">
                <img src="/signature.png" alt="" className="h-12" />
                <img src="/stamp-hey.png" alt="" className="h-16" />
              </div>
              <div className="border-t border-gray-300 pt-3">HEY Digital — אלעד חנינה</div>
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
            <span>HEY Digital • אלעד חנינה • 054-710-8219</span>
            <span>הופק: {todayStr()}</span>
          </div>
        </div>

        {/* אישור הסכם */}
        <div className="px-8 pb-8">
          {approved ? (
            <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-semibold">
              <CheckCircle className="w-5 h-5" /> ההסכם אושר ונחתם — {todayStr()}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">קראתי את ההסכם ואני מסכים לתנאיו</p>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <CheckCircle className="w-4 h-4 ml-2" /> אישור וחתימה
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
