import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Download, LayoutGrid, Kanban, List } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import LeadStatsCards from "../components/leads/LeadStatsCards";
import LeadFilters from "../components/leads/LeadFilters";
import LeadCards from "../components/leads/LeadCards";
import LeadKanban from "../components/leads/LeadKanban";
import LeadForm from "../components/leads/LeadForm";
import QuoteModal from "../components/leads/QuoteModal";
import AddTaskModal from "../components/leads/AddTaskModal";
import DuplicateWarningModal from "../components/leads/DuplicateWarningModal";
import ConvertToCustomerModal from "../components/leads/ConvertToCustomerModal";
import LeadDetailModal from "../components/leads/LeadDetailModal";

const OUTBOUND_EVENT = async (accountWebhook, payload) => {
  if (!accountWebhook) return;
  fetch(accountWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "הכל", source: "הכל", agent: "הכל", followupDue: false });

  // modals
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { existingLead, pendingData }
  const [quoteTarget, setQuoteTarget] = useState(null); // { lead, template }
  const [quoteTemplate, setQuoteTemplate] = useState(null);
  const [taskTarget, setTaskTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [existingCustomerForConvert, setExistingCustomerForConvert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("leads_view") || "cards");

  const accountId = currentUser?.id || "default";

  const exportToCSV = () => {
    const headers = ["שם מלא", "טלפון", "אימייל", "חברה", "סטטוס", "מקור", "סוכן", "מעקב הבא", "תאריך יצירה"];
    const rows = filtered.map(l => [
      l.full_name || "", l.phone || "", l.email || "", l.company_name || "",
      l.status || "", l.lead_source || "",
      users.find(u => u.id === l.agent_id)?.full_name || "",
      l.next_followup_at || "", l.created_date || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "לידים.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const webhookUrl = currentUser?.make_webhook_url || null;

  useEffect(() => { init(); }, []);

  const init = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
    const [leadsData, usersData] = await Promise.all([
      base44.entities.Lead.list("-created_date", 200),
      base44.entities.User.list()
    ]);
    setLeads(leadsData);
    setUsers(usersData);
    setLoading(false);
  };

  const reload = async () => {
    const data = await base44.entities.Lead.list("-created_date", 200);
    setLeads(data);
  };

  const switchView = (mode) => {
    setViewMode(mode);
    localStorage.setItem("leads_view", mode);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await base44.entities.Lead.update(leadId, { status: newStatus });
      await OUTBOUND_EVENT(webhookUrl, {
        event_name: "lead_updated",
        account_id: accountId,
        lead_id: leadId,
        changed_fields: ["status"],
        timestamp: new Date().toISOString()
      });
    } catch {
      await reload();
    }
  };

  // filtered leads
  const filtered = leads.filter(lead => {
    const now = new Date();
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(lead.full_name?.toLowerCase().includes(q) || lead.email?.toLowerCase().includes(q) || lead.phone?.includes(q))) return false;
    }
    if (filters.status !== "הכל" && lead.status !== filters.status) return false;
    if (filters.source !== "הכל" && lead.lead_source !== filters.source) return false;
    if (filters.agent !== "הכל" && lead.agent_id !== filters.agent) return false;
    if (filters.followupDue && lead.next_followup_at) {
      if (new Date(lead.next_followup_at) > now) return false;
    } else if (filters.followupDue) return false;
    return true;
  });

  // check duplicates
  const checkDuplicate = (data) => {
    return leads.find(l =>
      l.id !== editingLead?.id &&
      ((data.phone && l.phone === data.phone) || (data.email && l.email && l.email === data.email))
    );
  };

  const handleFormSubmit = async (data) => {
    const dup = checkDuplicate(data);
    if (dup) {
      setDuplicateWarning({ existingLead: dup, pendingData: data });
      return;
    }
    await saveLeadData(data);
  };

  const saveLeadData = async (data, forceNew = false) => {
    const payload = { ...data, account_id: accountId };
    let saved;
    if (editingLead) {
      saved = await base44.entities.Lead.update(editingLead.id, payload);
      await OUTBOUND_EVENT(webhookUrl, {
        event_name: "lead_updated",
        account_id: accountId,
        lead_id: editingLead.id,
        changed_fields: Object.keys(data),
        timestamp: new Date().toISOString()
      });
    } else {
      saved = await base44.entities.Lead.create(payload);
      await OUTBOUND_EVENT(webhookUrl, {
        event_name: "lead_created",
        account_id: accountId,
        lead_id: saved.id,
        changed_fields: [],
        timestamp: new Date().toISOString()
      });
      // notify assigned agent
      if (saved.agent_id) {
        await base44.entities.Notification.create({
          type: "lead_assigned",
          title: "ליד חדש הוקצה אליך",
          message: `ליד חדש: ${saved.full_name || saved.phone}`,
          is_read: false,
          related_id: saved.id,
          related_type: "lead",
          priority: "medium",
          account_id: accountId
        }).catch(() => {});
      }
    }
    setShowForm(false);
    setEditingLead(null);
    setDuplicateWarning(null);
    await reload();
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await base44.entities.Lead.delete(deleteTarget.id);
    setDeleteTarget(null);
    await reload();
  };

  const handleWhatsApp = (lead) => {
    const phone = lead.phone?.replace(/[^0-9]/g, "");
    const name = encodeURIComponent(lead.full_name || "");
    window.open(`https://wa.me/${phone}?text=שלום ${name}`, "_blank");
  };

  const handleQuoteSubmit = async (data) => {
    const quote = await base44.entities.Quote.create(data);
    // עדכן סטטוס הליד ל"נשלחה הצעת מחיר" אם עדיין בשלב קודם
    const currentLead = leads.find(l => l.id === quoteTarget.id);
    const leadStatusesToUpgrade = ["התקבל", "שיחה חוזרת", "בוצע איפיון"];
    if (currentLead && leadStatusesToUpgrade.includes(currentLead.status)) {
      await base44.entities.Lead.update(quoteTarget.id, { status: "נשלחה הצעת מחיר" });
    }
    await OUTBOUND_EVENT(webhookUrl, {
      event_name: "quote_created",
      account_id: accountId,
      lead_id: quoteTarget.id,
      changed_fields: [],
      timestamp: new Date().toISOString()
    });
    // notify
    await base44.entities.Notification.create({
      type: "quote_created",
      title: "הצעת מחיר נוצרה",
      message: `הצעת מחיר נוצרה עבור ${quoteTarget.full_name || quoteTarget.phone}`,
      is_read: false,
      related_id: quote.id,
      related_type: "quote",
      priority: "low",
      account_id: accountId
    }).catch(() => {});
    setQuoteTarget(null);
    await reload();
  };

  const handleTaskSubmit = async (data) => {
    await base44.entities.Task.create(data);
    setTaskTarget(null);
  };

  const handleConvertClick = async (lead) => {
    // check existing customer
    const customers = await base44.entities.Customer.list();
    const existing = customers.find(c =>
      (lead.phone && c.phone === lead.phone) || (lead.email && c.email === lead.email)
    );
    setExistingCustomerForConvert(existing || null);
    setConvertTarget(lead);
  };

  const handleConvertConfirm = async () => {
    const lead = convertTarget;
    // Split full_name into first/last
    const nameParts = (lead.full_name || "").trim().split(" ");
    const firstName = nameParts[0] || "ליד";
    const lastName = nameParts.slice(1).join(" ") || "מומר";
    const customer = await base44.entities.Customer.create({
      first_name: firstName,
      last_name: lastName,
      phone: lead.phone || "",
      email: lead.email || "",
      company: lead.company_name || "",
      notes: lead.notes || "",
      source: "הפניה",
      status: "חדש",
      source_from_lead_id: lead.id,
      registration_date: new Date().toISOString().split("T")[0]
    });
    await base44.entities.Lead.update(lead.id, { is_converted: true, converted_customer_id: customer.id, status: "נסגר בהצלחה (שולם)" });

    // notifications to admin + agent
    await base44.entities.Notification.create({
      type: "lead_converted",
      title: "ליד הומר ללקוח",
      message: `${lead.full_name || lead.phone} הומר ללקוח חדש`,
      is_read: false,
      related_id: lead.id,
      related_type: "lead",
      priority: "medium",
      account_id: accountId
    }).catch(() => {});

    await OUTBOUND_EVENT(webhookUrl, {
      event_name: "lead_converted_to_customer",
      account_id: accountId,
      lead_id: lead.id,
      changed_fields: ["is_converted", "converted_customer_id", "status"],
      timestamp: new Date().toISOString()
    });

    setConvertTarget(null);
    setExistingCustomerForConvert(null);
    await reload();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לידים</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} מוצגים מתוך {leads.length}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => switchView("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "cards" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              כרטיסים
            </button>
            <button
              onClick={() => switchView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "kanban" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              קנבן
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 ml-1.5" />
            ייצוא
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => { setEditingLead(null); setShowForm(true); }}
          >
            <UserPlus className="w-4 h-4 ml-1.5" />
            ליד חדש
          </Button>
        </div>
      </div>

      {/* Stats */}
      <LeadStatsCards leads={leads} />

      {/* Filters */}
      <div className="bg-white rounded-xl border p-3 shadow-sm">
        <LeadFilters filters={filters} setFilters={setFilters} users={users} />
      </div>

      {/* Form */}
      {showForm && (
        <LeadForm
          lead={editingLead}
          users={users}
          currentUser={currentUser}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingLead(null); }}
        />
      )}

      {/* Cards / Kanban */}
      {viewMode === "kanban" ? (
        <LeadKanban
          leads={filtered}
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onWhatsApp={handleWhatsApp}
          onQuote={setQuoteTarget}
          onTask={setTaskTarget}
          onConvert={handleConvertClick}
          onRowClick={setSelectedLead}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <LeadCards
          leads={filtered}
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onWhatsApp={handleWhatsApp}
          onQuote={(lead, template) => { setQuoteTarget(lead); setQuoteTemplate(template || null); }}
          onTask={setTaskTarget}
          onConvert={handleConvertClick}
          onRowClick={setSelectedLead}
        />
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          users={users}
          onClose={() => setSelectedLead(null)}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onWhatsApp={handleWhatsApp}
          onQuote={setQuoteTarget}
          onConvert={handleConvertClick}
          onAddTask={setTaskTarget}
        />
      )}

      {/* Modals */}
      {duplicateWarning && (
        <DuplicateWarningModal
          existingLead={duplicateWarning.existingLead}
          onOpenExisting={() => { handleEdit(duplicateWarning.existingLead); setDuplicateWarning(null); }}
          onAddAnyway={() => saveLeadData(duplicateWarning.pendingData, true)}
          onClose={() => setDuplicateWarning(null)}
        />
      )}

      {quoteTarget && (
        <QuoteModal
          lead={quoteTarget}
          accountId={accountId}
          template={quoteTemplate}
          onSubmit={handleQuoteSubmit}
          onClose={() => { setQuoteTarget(null); setQuoteTemplate(null); }}
        />
      )}

      {taskTarget && (
        <AddTaskModal
          lead={taskTarget}
          users={users}
          currentUser={currentUser}
          accountId={accountId}
          onSubmit={handleTaskSubmit}
          onClose={() => setTaskTarget(null)}
        />
      )}

      {convertTarget && (
        <ConvertToCustomerModal
          lead={convertTarget}
          existingCustomer={existingCustomerForConvert}
          onConfirm={handleConvertConfirm}
          onClose={() => { setConvertTarget(null); setExistingCustomerForConvert(null); }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת ליד</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הליד "{deleteTarget?.full_name || deleteTarget?.phone}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}