import React, { useRef, useState } from "react";
import { X, Printer, Mail, MessageCircle, Loader2, CheckCircle, Link2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const todayStr = () => format(new Date(), "dd/MM/yyyy", { locale: he });

const curr = (n) => `₪${(parseFloat(n) || 0).toLocaleString()}`;

// הגנה מפני XSS: שדות כמו שם/כתובת/חברה של הלקוח מגיעים מטופס החתימה
// הציבורי (ClientSign) — כל אחד עם קישור יכול למלא שם משתמש זדוני, וזה
// נשמר גולמי. בלי בריחה, קוד כזה היה רץ כש-HTML הזה מוצג/נפתח כאן בתוך
// ההתחברות של איש הצוות.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

export default function QuotePriceDocument({ quote, customer, onClose, onSent }) {
  const printRef = useRef();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(quote?.status === "נשלד" || quote?.status === "אושר");
  const [copied, setCopied] = useState(false);

  const items = (quote?.items || []).filter(i => (i.description || "").trim());
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const discountAmount = subtotal * ((parseFloat(quote?.discount) || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = quote?.vat_included ? afterDiscount * 0.17 : 0;
  const total = parseFloat(quote?.amount) || afterDiscount + vatAmount;

  const clientName = quote?.signing_client_name || `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim();
  const clientEmail = quote?.signing_client_email || customer?.email || "";
  const clientPhone = quote?.signing_client_phone || customer?.phone || "";

  // ── HTML מעוצב של ההצעה — משמש גם להדפסה/PDF וגם למייל ──
  const buildQuoteHtml = (forEmail = false) => {
    const logoSrc = forEmail
      ? "https://hey-digital-crm.base44.app/logo-hey.png"
      : `${window.location.origin}/logo-hey.png`;
    const stampSrc = forEmail
      ? "https://hey-digital-crm.base44.app/stamp-hey.png"
      : `${window.location.origin}/stamp-hey.png`;

    return `
      <div style="max-width:760px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;color:#0e1b14;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#0A8E7F 0%,#0B1B1A 100%);color:#fff;border-radius:0 0 22px 22px;padding:30px 36px;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <img src="${logoSrc}" style="height:38px;" alt="HEY Digital" />
            <p style="color:#5DF5D1;letter-spacing:2px;font-size:10px;margin:8px 0 3px;">AUTOMATE. GROW. SUCCEED.</p>
            <p style="font-size:12px;opacity:.75;">אלעד חנינה • 054-710-8219</p>
          </div>
          <div style="text-align:left;font-size:12.5px;">
            <h2 style="font-size:17px;font-weight:700;margin:0;">${esc(quote?.title) || "הצעת מחיר"}</h2>
            <p style="opacity:.8;margin:3px 0 0;">מספר: ${esc(quote?.quote_number)}</p>
            <p style="opacity:.8;margin:3px 0 0;">תאריך: ${todayStr()}</p>
            ${quote?.valid_until ? `<p style="opacity:.8;margin:3px 0 0;">בתוקף עד: ${format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}</p>` : ""}
          </div>
        </div>

        <div style="padding:28px 36px;">
          <div style="background:#f7faf9;border:1px solid #d8ebe7;border-radius:12px;padding:14px 20px;margin-bottom:24px;font-size:13px;line-height:1.9;">
            <strong>${esc(clientName)}</strong>${quote?.signing_client_company ? ` — ${esc(quote.signing_client_company)}` : ""}<br/>
            ${clientEmail ? `מייל: ${esc(clientEmail)}<br/>` : ""}
            ${clientPhone ? `טלפון: ${esc(clientPhone)}<br/>` : ""}
            ${quote?.signing_client_id ? `ח"פ/ת"ז: ${esc(quote.signing_client_id)}<br/>` : ""}
            ${quote?.signing_client_address ? `כתובת: ${esc(quote.signing_client_address)}` : ""}
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr style="background:#e8f7f4;">
                <th style="text-align:right;padding:10px 12px;border-bottom:2px solid #0A8E7F;color:#0A8E7F;font-weight:700;">תיאור</th>
                <th style="text-align:center;padding:10px 12px;border-bottom:2px solid #0A8E7F;color:#0A8E7F;font-weight:700;width:70px;">כמות</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #0A8E7F;color:#0A8E7F;font-weight:700;width:100px;">מחיר יחידה</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #0A8E7F;color:#0A8E7F;font-weight:700;width:100px;">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(i => `
                <tr>
                  <td style="padding:9px 12px;border-bottom:1px solid #e5efec;">${esc(i.description)}</td>
                  <td style="padding:9px 12px;border-bottom:1px solid #e5efec;text-align:center;">${esc(i.quantity)}</td>
                  <td style="padding:9px 12px;border-bottom:1px solid #e5efec;text-align:left;">${curr(i.unit_price)}</td>
                  <td style="padding:9px 12px;border-bottom:1px solid #e5efec;text-align:left;font-weight:600;">${curr(i.total)}</td>
                </tr>`).join("")}
            </tbody>
          </table>

          <div style="max-width:320px;margin-left:0;margin-right:auto;text-align:left;font-size:13px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>סכום ביניים</span><span>${curr(subtotal)}</span></div>
            ${discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:3px 0;color:#c0392b;"><span>הנחה (${quote.discount}%)</span><span>− ${curr(discountAmount)}</span></div>` : ""}
            ${vatAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>מע"מ 17%</span><span>${curr(vatAmount)}</span></div>` : ""}
            <div style="display:flex;justify-content:space-between;padding:10px 14px;background:#e8f7f4;border-radius:10px;margin-top:8px;font-size:16px;font-weight:800;color:#0A8E7F;"><span>סה"כ לתשלום</span><span>${curr(total)}</span></div>
          </div>

          ${quote?.notes ? `<div style="font-size:12.5px;line-height:1.9;color:#3a4a44;white-space:pre-wrap;background:#f7faf9;border-radius:10px;padding:12px 18px;margin-bottom:28px;">${esc(quote.notes)}</div>` : ""}

          <div style="display:flex;gap:60px;margin-top:14px;align-items:flex-end;">
            <div style="flex:1;text-align:center;font-size:11px;color:#5f7a6c;"><div style="border-top:1px solid #5f7a6c;padding-top:8px;">אישור וחתימת הלקוח</div></div>
            <div style="flex:1;text-align:center;font-size:11px;color:#5f7a6c;">
              <img src="${stampSrc}" style="max-height:66px;display:block;margin:0 auto;" alt="HEY Digital" />
              <div style="border-top:1px solid #5f7a6c;padding-top:8px;">HEY Digital</div>
            </div>
          </div>

          <div style="margin-top:44px;padding-top:14px;border-top:1px solid #d8ebe7;display:flex;justify-content:space-between;font-size:11px;color:#5f7a6c;">
            <span>HEY Digital • eladauto66@gmail.com</span>
            <span>הופק: ${todayStr()}</span>
          </div>
        </div>
      </div>`;
  };

  // ── שליחה ישירה במייל מהמערכת ──
  const handleSendEmail = async () => {
    if (!clientEmail || sending) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: clientEmail,
        from_name: "HEY Digital",
        subject: `${quote?.title || "הצעת מחיר"} — ${quote?.quote_number || ""}`,
        html: `
          <p style="font-family:Arial,sans-serif;direction:rtl;font-size:14px;">שלום ${clientName},</p>
          <p style="font-family:Arial,sans-serif;direction:rtl;font-size:14px;">מצורפת הצעת המחיר שלנו לפרטיכם — לצפייה ולאישור:</p>
          ${buildQuoteHtml(true)}
          <p style="font-family:Arial,sans-serif;direction:rtl;font-size:13px;color:#5f7a6c;">בברכה,<br/>HEY Digital — אלעד חנינה</p>`,
      });
      // עדכון ההצעה ל"נשלד" אחרי שליחה מוצלחת
      if (quote?.id) {
        await base44.entities.Quote.update(quote.id, {
          status: "נשלד",
          sent_at: new Date().toISOString(),
        });
      }
      setSent(true);
      if (onSent) onSent();
    } catch (e) {
      console.error("שליחת הצעת המחיר במייל נכשלה:", e);
      alert("שליחת המייל נכשלה. ודא שללקוח יש כתובת מייל תקינה, או שלח ידנית בכפתור ההדפסה.");
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl">
        <head><meta charset="utf-8"/><title>${esc(quote?.title) || "הצעת מחיר"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
        </style>
        </head>
        <body>${buildQuoteHtml(false)}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleWhatsApp = () => {
    const phone = (clientPhone || "").replace(/\D/g, "");
    const intl = phone.startsWith("0") ? "972" + phone.slice(1) : phone;
    const lines = items.map(i => `• ${i.description} — ${i.quantity} × ${curr(i.unit_price)} = ${curr(i.total)}`);
    const text = encodeURIComponent(
      `*${quote?.title || "הצעת מחיר"}* (${quote?.quote_number || ""})\n\n${lines.join("\n")}` +
      (discountAmount > 0 ? `\nהנחה: ${curr(discountAmount)}` : "") +
      (vatAmount > 0 ? `\nמע"מ: ${curr(vatAmount)}` : "") +
      `\n\n*סה"כ לתשלום: ${curr(total)}*` +
      (quote?.valid_until ? `\nבתוקף עד: ${format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}` : "") +
      `\n\n_HEY Digital — אלעד חנינה_`
    );
    window.open(`https://wa.me/${intl}?text=${text}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/ClientSign?id=${quote?.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-2xl flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleSendEmail} disabled={sending || !clientEmail || sent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sent ? "נשלח ✓" : sending ? "שולח..." : "שלח במייל ישירות"}
            </button>
            {clientPhone && (
              <button onClick={handleWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
            )}
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" /> הדפסה / PDF
            </button>
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              <Link2 className="w-4 h-4" />{copied ? "✓ הועתק!" : "העתק קישור לחתימה"}
            </button>
            {sent && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> ההצעה סומנה כ"נשלדה"
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4 text-gray-500" /></Button>
        </div>

        {/* Document preview */}
        <div ref={printRef} className="max-h-[70vh] overflow-y-auto bg-gray-100 p-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden" dir="rtl"
            dangerouslySetInnerHTML={{ __html: buildQuoteHtml(false) }} />
        </div>
      </div>
    </div>
  );
}