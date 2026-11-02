import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Edit, TrendingUp, Clock, CheckCircle2, XCircle, Eye, Plus, PenLine, Receipt, Files, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { logActivity } from "@/lib/activityLog";
import QuoteEditModal from "../components/quotes/QuoteEditModal";
import QuoteDocument from "../components/quotes/QuoteDocument";
import DocumentModal from "../components/quotes/DocumentModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG = {
  "טיוטה":  { label: "טיוטה",  color: "bg-gray-100 text-gray-700",    icon: FileText },
  "נשלח":   { label: "נשלח",   color: "bg-brand-100 text-brand-800",    icon: Clock },
  "אושר":   { label: "אושר",   color: "bg-green-100 text-green-800",  icon: CheckCircle2 },
  "בוטל":   { label: "בוטל",   color: "bg-red-100 text-red-700",      icon: XCircle }
};

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("הכל");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [quotesData, leadsData, customersData, paymentsData] = await Promise.all([
      base44.entities.Quote.list('-created_date', 200),
      base44.entities.Lead.list('-created_date', 200),
      base44.entities.Customer.list('-created_date', 200),
      base44.entities.Payment.list('-created_date', 200).catch(e => { console.error("טעינה נכשלה:", e); return []; })
    ]);
    setQuotes(quotesData);
    setLeads(leadsData);
    setCustomers(customersData);
    setPayments(paymentsData);
    setLoading(false);
  };

  const getLinkedPayment = (quoteId) => payments.find(p => p.quote_id === quoteId);

  const getEntityName = (quote) => {
    if (quote.lead_id) {
      const lead = leads.find(l => l.id === quote.lead_id);
      return { name: lead?.full_name || lead?.phone || "ליד", type: "ליד" };
    }
    if (quote.customer_id) {
      const c = customers.find(c => c.id === quote.customer_id);
      return { name: c ? `${c.first_name} ${c.last_name}` : "לקוח", type: "לקוח" };
    }
    return { name: "—", type: "" };
  };

  const handleEditSubmit = async (data) => {
    if (data.amount !== editingQuote.amount) {
      logActivity({
        entity_type: "quote", entity_id: editingQuote.id, action: "amount_changed",
        summary: `סכום הצעה '${editingQuote.title || "ללא כותרת"}' שונה מ-₪${(editingQuote.amount || 0).toLocaleString()} ל-₪${(data.amount || 0).toLocaleString()}`,
        amount: data.amount,
      });
    }
    await base44.entities.Quote.update(editingQuote.id, data);
    setEditingQuote(null);
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    await base44.entities.Quote.delete(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  const handleCreateSubmit = async (data) => {
    await base44.entities.Quote.create({ ...data, status: "תבנית" });
    setCreatingDoc(false);
    await loadData();
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    const quote = quotes.find(q => q.id === quoteId);
    await base44.entities.Quote.update(quoteId, { status: newStatus });
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
    logActivity({
      entity_type: "quote", entity_id: quoteId, action: "status_changed",
      summary: `סטטוס הצעה '${quote?.title || "ללא כותרת"}' שונה מ-${quote?.status || "?"} ל-${newStatus}`,
      amount: quote?.amount,
    });
  };

  const isExpired = (q) => q.valid_until && new Date(q.valid_until) < new Date() && q.status !== "אושר" && q.status !== "בוטל";

  // הסכם חתום עם תוקף שמתקרב/עבר — זה לא "פג תוקף" של הצעה שלא נענתה,
  // אלא תזכורת לחדש הסכם שכבר בתוקף. שני מושגים שונים לגמרי על אותו שדה.
  const RENEWAL_WINDOW_DAYS = 14;
  const renewalStatus = (q) => {
    if (!q.client_signature || !q.valid_until) return null;
    const days = Math.ceil((new Date(q.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "overdue";
    if (days <= RENEWAL_WINDOW_DAYS) return "soon";
    return null;
  };

  const filtered = quotes.filter(q => {
    const entity = getEntityName(q);
    const matchSearch = !search ||
      entity.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (q.quote_number || "").includes(search);
    const matchStatus = filterStatus === "הכל" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === "טיוטה").length,
    sent: quotes.filter(q => q.status === "נשלח").length,
    approved: quotes.filter(q => q.status === "אושר").length,
    totalApproved: quotes.filter(q => q.status === "אושר").reduce((s, q) => s + (q.amount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-brand-600" />
              מסמכים
            </h1>
            <p className="text-gray-500 mt-1">{filtered.length} מסמכים מוצגים</p>
          </div>
          <Button
            onClick={() => setCreatingDoc(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> צור מסמך חדש
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Files className="w-3.5 h-3.5" /> סה"כ מסמכים
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-gray-400">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> טיוטות
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-brand-400">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-brand-600">{stats.sent}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> נשלחו
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> אושרו
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-emerald-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-emerald-700">₪{stats.totalApproved.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> סה"כ אושר
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם, כותרת..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="הכל">כל הסטטוסים</SelectItem>
            <SelectItem value="טיוטה">טיוטה</SelectItem>
            <SelectItem value="נשלח">נשלח</SelectItem>
            <SelectItem value="אושר">אושר</SelectItem>
            <SelectItem value="בוטל">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quote Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center shadow-sm">
          <FileText className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">אין מסמכים</h3>
          <p className="text-gray-500 text-sm">צור מסמך מדף הלידים</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(quote => {
            const entity = getEntityName(quote);
            const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG["טיוטה"];
            const expired = isExpired(quote);
            const renewal = renewalStatus(quote);

            return (
              <div
                key={quote.id}
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${expired || renewal ? "border-orange-200" : ""}`}
              >
                <div className="p-3.5">
                  <div className="flex flex-col gap-2">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm truncate">
                          {quote.title || "ללא כותרת"}
                        </span>
                        {expired && (
                          <Badge className="bg-orange-100 text-orange-700 text-[10px]">פג תוקף</Badge>
                        )}
                        {quote.client_signature && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] flex items-center gap-1">
                            <PenLine className="w-3 h-3" /> נחתם
                          </Badge>
                        )}
                        {renewal === "overdue" && (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">פג — לחדש</Badge>
                        )}
                        {renewal === "soon" && (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">מתקרב לחידוש</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="font-medium text-gray-700">{entity.name}</span>
                        {entity.type && (
                          <Badge variant="outline" className="text-[10px]">{entity.type}</Badge>
                        )}
                        {quote.created_date && (
                          <span>• {format(new Date(quote.created_date), "dd/MM/yyyy", { locale: he })}</span>
                        )}
                        {quote.valid_until && (
                          <span>• תוקף עד {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}</span>
                        )}
                      </div>
                      {/* Items preview */}
                      {quote.items && quote.items.length > 0 && (
                        <div className="mt-1.5 text-[11px] text-gray-400 truncate">
                          {quote.items.slice(0, 2).map((item, i) => (
                            <span key={i}>{item.description}{i < Math.min(quote.items.length, 2) - 1 ? " · " : ""}</span>
                          ))}
                          {quote.items.length > 2 && <span> +{quote.items.length - 2} נוספים</span>}
                        </div>
                      )}
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t">
                      <Badge className={`${cfg.color} text-[10px]`}>{cfg.label}</Badge>

                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setPreviewQuote(quote)} title="צפה"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingDoc(quote)} title="עריכה"
                          className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(quote)} title="מחיקה"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {quote.status === "אושר" && (() => {
                          const linkedPayment = getLinkedPayment(quote.id);
                          if (linkedPayment) {
                            return (
                              <Link to={createPageUrl("Payments")} title={`חשבונית: ${linkedPayment.status}`}>
                                <span className="flex p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                                  <Receipt className="w-4 h-4" />
                                </span>
                              </Link>
                            );
                          }
                          if (!quote.customer_id) {
                            return (
                              <span title="יש להמיר לליד ללקוח כדי להפיק חשבונית" className="p-1.5 text-gray-300">
                                <Receipt className="w-4 h-4" />
                              </span>
                            );
                          }
                          return (
                            <Link to={`${createPageUrl("Payments")}?quote=${quote.id}`} title="צור חשבונית">
                              <span className="flex p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                                <Receipt className="w-4 h-4" />
                              </span>
                            </Link>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div className="mt-2 pt-2 border-t text-xs text-gray-500 line-clamp-1">
                      {quote.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingQuote && (
        <QuoteEditModal
          quote={editingQuote}
          leadName={editingQuote.lead_id ? (leads.find(l => l.id === editingQuote.lead_id)?.full_name || null) : null}
          customerName={editingQuote.customer_id ? (() => { const c = customers.find(c => c.id === editingQuote.customer_id); return c ? `${c.first_name} ${c.last_name}` : null; })() : null}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingQuote(null)}
        />
      )}

      {previewQuote && (
        <QuoteDocument
          quote={previewQuote}
          lead={leads.find(l => l.id === previewQuote.lead_id) || null}
          onClose={() => setPreviewQuote(null)}
          onDelete={() => { setDeleteTarget(previewQuote); setPreviewQuote(null); }}
        />
      )}

      {creatingDoc && (
        <DocumentModal
          onSubmit={handleCreateSubmit}
          onClose={() => setCreatingDoc(false)}
        />
      )}

      {editingDoc && (
        <DocumentModal
          doc={editingDoc}
          lead={leads.find(l => l.id === editingDoc.lead_id) || null}
          onSubmit={async (data) => {
            await base44.entities.Quote.update(editingDoc.id, data);
            setEditingDoc(null);
            await loadData();
          }}
          onClose={() => setEditingDoc(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מסמך</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המסמך "{deleteTarget?.title || "ללא כותרת"}"? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
