import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function QuoteDocument({ quote, lead, onClose }) {
  const printRef = useRef();
  const today = format(new Date(), "dd/MM/yyyy", { locale: he });
  const price = parseFloat(quote?.amount) || 0;
  const body = quote?.notes || "";

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl">
        <head>
          <meta charset="utf-8"/>
          <title>${quote?.title || "מסמך"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; color: #111; background: white; }
            .page { max-width: 800px; margin: 0 auto; padding: 50px 50px 60px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 3px solid #2563eb; }
            .brand h1 { font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
            .brand p { font-size: 13px; color: #9ca3af; margin-top: 3px; }
            .doc-info { text-align: left; }
            .doc-info h2 { font-size: 18px; font-weight: 700; color: #111; }
            .doc-info p { font-size: 12px; color: #9ca3af; margin-top: 4px; }
            .recipient-box { background: #f8fafc; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; }
            .recipient-box .lbl { font-size: 10px; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
            .recipient-box .name { font-size: 16px; font-weight: 700; color: #1e293b; }
            .recipient-box .sub { font-size: 13px; color: #64748b; margin-top: 2px; }
            .body-text { font-size: 14.5px; line-height: 2; color: #1e293b; white-space: pre-wrap; margin-bottom: 32px; }
            .price-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .price-box .lbl { font-size: 14px; color: #3b82f6; font-weight: 600; }
            .price-box .amount { font-size: 26px; font-weight: 900; color: #1d4ed8; }
            .validity { font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 40px; }
            .sig-row { display: flex; gap: 60px; margin-top: 20px; }
            .sig-line { flex: 1; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px; color: #94a3b8; text-align: center; }
            .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
            @media print { .page { padding: 30px; } }
          </style>
        </head>
        <body><div class="page">${content}</div></body>
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
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Printer className="w-4 h-4" /> הדפסה / PDF
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Document body */}
        <div ref={printRef} className="px-12 py-10" dir="rtl" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

          {/* Header */}
          <div className="flex justify-between items-start mb-9 pb-6 border-b-4 border-blue-600">
            <div>
              <h1 className="text-3xl font-black text-blue-600 tracking-tight">EH Automation</h1>
              <p className="text-gray-400 text-sm mt-1">אלעד חנינה • 054-710-8219</p>
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-800">{quote?.title || "מסמך"}</h2>
              <p className="text-sm text-gray-400 mt-1">תאריך: {today}</p>
              {quote?.valid_until && (
                <p className="text-sm text-gray-400">
                  בתוקף עד: {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}
                </p>
              )}
            </div>
          </div>

          {/* Recipient */}
          {(lead?.full_name || lead?.company_name) && (
            <div className="bg-slate-50 rounded-xl p-5 mb-8">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">מוגש עבור</p>
              <p className="text-lg font-bold text-gray-800">{lead.full_name}</p>
              {lead.company_name && <p className="text-sm text-gray-500 mt-0.5">{lead.company_name}</p>}
              {lead.phone && <p className="text-sm text-gray-500">{lead.phone}</p>}
              {lead.email && <p className="text-sm text-gray-500">{lead.email}</p>}
            </div>
          )}

          {/* Body — free text */}
          {body && (
            <div className="text-[14.5px] leading-loose text-gray-800 whitespace-pre-wrap mb-8" style={{ lineHeight: "2" }}>
              {body}
            </div>
          )}

          {/* Price */}
          {price > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 flex justify-between items-center mb-8">
              <span className="text-base font-semibold text-blue-600">סכום הסכם</span>
              <span className="text-2xl font-black text-blue-700">₪{price.toLocaleString()}</span>
            </div>
          )}

          {/* Signature lines */}
          <div className="flex gap-16 mt-14">
            <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">חתימת הלקוח ותאריך</div>
            <div className="flex-1 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">EH Automation — אלעד חנינה</div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>EH Automation • אלעד חנינה • 054-710-8219</span>
            <span>הופק: {today}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
