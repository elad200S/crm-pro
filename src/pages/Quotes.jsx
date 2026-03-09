import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Edit } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import QuoteEditModal from "../components/quotes/QuoteEditModal";

const statusColors = {
  "טיוטה": "bg-gray-100 text-gray-700",
  "נשלח": "bg-blue-100 text-blue-800",
  "שולם": "bg-green-100 text-green-800",
  "בוטל": "bg-red-100 text-red-700"
};

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState(null);

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

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? (lead.full_name || lead.phone || "ליד") : null;
  };

  const getCustomerName = (customerId) => {
    const c = customers.find(c => c.id === customerId);
    return c ? `${c.first_name} ${c.last_name}` : null;
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    await base44.entities.Quote.update(quoteId, { status: newStatus });
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
  };

  const handleEditSubmit = async (data) => {
    await base44.entities.Quote.update(editingQuote.id, data);
    setEditingQuote(null);
    await loadData();
  };

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === "טיוטה").length,
    sent: quotes.filter(q => q.status === "נשלח").length,
    paid: quotes.filter(q => q.status === "שולם").length,
    totalPaid: quotes.filter(q => q.status === "שולם").reduce((s, q) => s + (q.amount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              הצעות מחיר
            </h1>
            <p className="text-gray-500 mt-1">{quotes.length} הצעות מחיר סה"כ</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
            <div className="text-sm text-gray-500 mt-1">טיוטות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-500 mt-1">נשלחו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-sm text-gray-500 mt-1">שולמו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold text-green-700">₪{stats.totalPaid.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">סה"כ שולם</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">לקוח / ליד</TableHead>
              <TableHead className="text-right">סכום</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">הערות</TableHead>
              <TableHead className="text-right">תאריך יצירה</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">טוען...</TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  אין הצעות מחיר — צור הצעה מדף הלידים
                </TableCell>
              </TableRow>
            ) : (
              quotes.map(quote => {
                const leadName = quote.lead_id ? getLeadName(quote.lead_id) : null;
                const customerName = quote.customer_id ? getCustomerName(quote.customer_id) : null;
                return (
                  <TableRow key={quote.id} className="hover:bg-gray-50">
                    <TableCell className="text-right font-medium">
                      {leadName ? (
                        <div>
                          <span className="text-blue-700">{leadName}</span>
                          <span className="text-xs text-gray-400 block">ליד</span>
                        </div>
                      ) : customerName ? (
                        <div>
                          <span>{customerName}</span>
                          <span className="text-xs text-gray-400 block">לקוח</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {quote.amount ? (
                        <span className="font-semibold">
                          {quote.amount.toLocaleString()} {quote.currency === "ILS" ? "₪" : quote.currency}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select value={quote.status} onValueChange={(v) => handleStatusChange(quote.id, v)}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="טיוטה">טיוטה</SelectItem>
                          <SelectItem value="נשלח">נשלח</SelectItem>
                          <SelectItem value="שולם">שולם</SelectItem>
                          <SelectItem value="בוטל">בוטל</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500 max-w-xs">
                      <span className="line-clamp-1">{quote.notes || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {quote.created_date ? format(new Date(quote.created_date), "dd/MM/yyyy", { locale: he }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuote(quote)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        עריכה
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editingQuote && (
        <QuoteEditModal
          quote={editingQuote}
          leadName={editingQuote.lead_id ? getLeadName(editingQuote.lead_id) : null}
          customerName={editingQuote.customer_id ? getCustomerName(editingQuote.customer_id) : null}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingQuote(null)}
        />
      )}
    </div>
  );
}