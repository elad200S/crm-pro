import React, { useRef } from "react";
import { X, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const VAT = 0.17;

// ממלא משתנים בתבנית HTML
const fillTemplate = (html, lead, quote) => {
  if (!html) return "";
  const today = format(new Date(), "dd/MM/yyyy", { locale: he });
  const vars = {
    "{{שם_ליד}}": lead?.full_name || "",
    "{{טלפון}}": lead?.phone || "",
    "{{אימייל}}": lead?.email || "",
    "{{חברה}}": lead?.company_name || "",
    "{{תאריך}}": today,
    "{{כותרת_מסמך}}": quote?.title || "",
    "{{סכום}}": `₪${(quote?.amount || 0).toLocaleString()}`,
    "{{מטבע}}": quote?.currency || "ILS",
  };
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(k, v), html);
};

export default function QuoteDocument({ quote, lead, onClose }) {
  const printRef = useRef();

  const items = quote?.items || [];
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const discount = subtotal * ((parseFloat(quote?.discount) || 0) / 100);
  const afterDiscount = subtotal - discount;
  const vat = quote?.vat_included ? afterDiscount * VAT : 0;
  const total = afterDiscount + vat;
  const currSymbol = quote?.currency === "USD" ? "$" : quote?.currency === "EUR" ? "€" : "₪";
  const today = format(new Date(), "dd/MM/yyyy", { locale: he });

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl">
        <head>
          <meta charset="utf-8"/>
          <title>${quote?.title || "מסמך"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; color: #111; background: white; }
            .doc { max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 24px; }
            .logo-area h1 { font-size: 26px; font-weight: 800; color: #2563eb; }
            .logo-area p { color: #6b7280; font-size: 13px; margin-top: 4px; }
            .doc-meta { text-align: left; color: #6b7280; font-size: 13px; }
            .doc-meta .doc-num { font-size: 18px; font-weight: 700; color: #111; }
            .recipient { background: #f8fafc; border-radius: 10px; padding: 18px 22px; margin-bottom: 28px; }
            .recipient h3 { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .recipient p { font-size: 15px; font-weight: 600; color: #111; }
            .recipient .sub { font-size: 13px; color: #6b7280; font-weight: 400; margin-top: 2px; }
            .section-title { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
            thead tr { background: #2563eb; color: white; }
            thead th { padding: 11px 14px; text-align: right; font-size: 13px; font-weight: 600; }
            tbody tr { border-bottom: 1px solid #f1f5f9; }
            tbody tr:last-child { border-bottom: none; }
            tbody td { padding: 11px 14px; font-size: 14px; color: #374151; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .totals { margin-top: 16px; display: flex; justify-content: flex-start; }
            .totals-box { background: #f8fafc; border-radius: 10px; padding: 16px 22px; min-width: 260px; }
            .totals-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #6b7280; }
            .totals-row.total { font-size: 17px; font-weight: 700; color: #111; border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 10px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
            .sig-area { margin-top: 50px; display: flex; gap: 60px; }
            .sig-line { flex: 1; border-top: 1px solid #9ca3af; padding-top: 8px; font-size: 12px; color: #9ca3af; text-align: center; }
            @media print { body { padding: 0; } .doc { padding: 20px; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4" /> הדפסה / PDF
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Document */}
        <div ref={printRef} className="p-10" dir="rtl" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-blue-600">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-600">EH Automation</h1>
              <p className="text-gray-400 text-sm mt-1">אלעד חנינה • 054-710-8219</p>
            </div>
            <div className="text-left text-sm text-gray-500">
              <p className="text-lg font-bold text-gray-800">{quote?.title || "הצעת מחיר"}</p>
              <p className="mt-1">תאריך: {today}</p>
              {quote?.valid_until && <p>בתוקף עד: {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}</p>}
            </div>
          </div>

          {/* Recipient */}
          {(lead?.full_name || lead?.company_name) && (
            <div className="bg-slate-50 rounded-xl p-5 mb-7">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">מוגש עבור</p>
              <p className="text-lg font-semibold text-gray-800">{lead.full_name}</p>
              {lead.company_name && <p className="text-sm text-gray-500 mt-0.5">{lead.company_name}</p>}
              {lead.phone && <p className="text-sm text-gray-500">{lead.phone}</p>}
              {lead.email && <p className="text-sm text-gray-500">{lead.email}</p>}
            </div>
          )}

          {/* Items table */}
          {items.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">פירוט שירותים</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="text-right p-3 rounded-tr-lg font-semibold">תיאור</th>
                    <th className="text-right p-3 w-16 font-semibold">כמות</th>
                    <th className="text-right p-3 w-28 font-semibold">מחיר יחידה</th>
                    <th className="text-right p-3 w-24 rounded-tl-lg font-semibold">סה"כ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="p-3 text-gray-700">{item.description}</td>
                      <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="p-3 text-gray-600">{currSymbol}{(parseFloat(item.unit_price)||0).toLocaleString()}</td>
                      <td className="p-3 font-medium text-gray-800">{currSymbol}{(parseFloat(item.total)||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-start mt-4">
                <div className="bg-slate-50 rounded-xl p-4 min-w-[240px] space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>סכום ביניים</span><span>{currSymbol}{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>הנחה ({quote.discount}%)</span><span>− {currSymbol}{discount.toLocaleString()}</span>
                    </div>
                  )}
                  {vat > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>מע"מ 17%</span><span>{currSymbol}{vat.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-2 mt-1">
                    <span>סה"כ לתשלום</span>
                    <span className="text-blue-700">{currSymbol}{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {quote?.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-gray-700">
              <p className="text-xs text-amber-600 font-semibold mb-1">הערות ותנאים</p>
              <p className="whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Signature lines */}
          <div className="flex gap-12 mt-12">
            <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">חתימת הלקוח</div>
            <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">EH Automation • אלעד חנינה</div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>EH Automation • אלעד חנינה • 054-710-8219</span>
            <span>תאריך הפקה: {today}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
