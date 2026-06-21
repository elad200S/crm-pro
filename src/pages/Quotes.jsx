import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Edit, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import QuoteEditModal from "../components/quotes/QuoteEditModal";

const STATUS_CONFIG = {
  "טיוטה":  { label: "טיוטה",  color: "bg-gray-100 text-gray-700",    icon: FileText },
  "נשלח":   { label: "נשלח",   color: "bg-blue-100 text-blue-800",    icon: Clock },
  "אושר":   { label: "אושר",   color: "bg-green-100 text-green-800",  icon: CheckCircle2 },
  "בוטל":   { label: "בוטל",   color: "bg-red-100 text-red-700",      icon: XCircle }
};

const CURRENCY_SYMBOL = { ILS: "₪", USD: "$", EUR: "€" };

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("הכל");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [quotesData, leadsData, customersData] = await Promise.all([
      base44.entities.Quote.list('-created_date', 200),
      base44.entities.Lead.list('-created_date', 200),
      base44.entities.Customer.list('-created_date', 200)
    ]);
    setQuotes(quotesData);
    setLeads(leadsData);
    setCustomers(customersData);
    setLoading(false);
  };

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
    await base44.entities.Quote.update(editingQuote.id, data);
    setEditingQuote(null);
    await loadData();
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    await base44.entities.Quote.update(quoteId, { status: newStatus });
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
  };

  const isExpired = (q) => q.valid_until && new Date(q.valid_until) < new Date() && q.status !== "אושר" && q.status !== "בוטל";

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
              <FileText className="w-8 h-8 text-blue-600" />
              מסמכים
            </h1>
            <p className="text-gray-500 mt-1">{filtered.length} מסמכים מוצגים</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> טיוטות
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> נשלחו
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> אושרו
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center shadow-sm">
          <FileText className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">אין מסמכים</h3>
          <p className="text-gray-500 text-sm">צור מסמך מדף הלידים</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(quote => {
            const entity = getEntityName(quote);
            const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG["טיוטה"];
            const currSymbol = CURRENCY_SYMBOL[quote.currency] || "₪";
            const expired = isExpired(quote);

            return (
              <div
                key={quote.id}
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${expired ? "border-orange-200" : ""}`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">
                          {quote.title || "ללא כותרת"}
                        </span>
                        {expired && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">פג תוקף</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                        <span className="font-medium text-gray-700">{entity.name}</span>
                        {entity.type && (
                          <Badge variant="outline" className="text-xs">{entity.type}</Badge>
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
                        <div className="mt-2 text-xs text-gray-400">
                          {quote.items.slice(0, 2).map((item, i) => (
                            <span key={i}>{item.description}{i < Math.min(quote.items.length, 2) - 1 ? " · " : ""}</span>
                          ))}
                          {quote.items.length > 2 && <span> +{quote.items.length - 2} נוספים</span>}
                        </div>
                      )}
                    </div>

                    {/* Right: amount + actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {currSymbol}{(quote.amount || 0).toLocaleString()}
                        </div>
                        {quote.vat_included && (
                          <div className="text-xs text-gray-400">כולל מע"מ</div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingQuote(quote)}
                          className="text-blue-600 hover:text-blue-800 border-blue-200"
                        >
                          <Edit className="w-3.5 h-3.5 ml-1" />
                          עריכה
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-500 line-clamp-1">
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
    </div>
  );
}
