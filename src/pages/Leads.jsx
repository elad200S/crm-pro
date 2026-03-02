import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus } from "lucide-react";

import LeadStatsCards from "../components/leads/LeadStatsCards";
import LeadFilters from "../components/leads/LeadFilters";
import LeadTable from "../components/leads/LeadTable";
import LeadForm from "../components/leads/LeadForm";
import QuoteModal from "../components/leads/QuoteModal";
import AddTaskModal from "../components/leads/AddTaskModal";
import DuplicateWarningModal from "../components/leads/DuplicateWarningModal";
import ConvertToCustomerModal from "../components/leads/ConvertToCustomerModal";

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
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [taskTarget, setTaskTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [existingCustomerForConvert, setExistingCustomerForConvert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const accountId = currentUser?.id || "default";
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
          user_id: saved.agent_id,
          type: "LEAD_ASSIGNED",
          title: "ליד חדש הוקצה אליך",
          body: `ליד חדש: ${saved.full_name || saved.phone}`,
          is_read: false,
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
    await OUTBOUND_EVENT(webhookUrl, {
      event_name: "quote_created",
      account_id: accountId,
      lead_id: quoteTarget.id,
      changed_fields: [],
      timestamp: new Date().toISOString()
    });
    // notify
    await base44.entities.Notification.create({
      user_id: currentUser.id,
      type: "QUOTE_SENT",
      title: "הצעת מחיר נוצרה",
      body: `הצעת מחיר נוצרה עבור ${quoteTarget.full_name || quoteTarget.phone}`,
      is_read: false,
      account_id: accountId
    }).catch(() => {});
    setQuoteTarget(null);
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
    const customer = await base44.entities.Customer.create({
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      company_name: lead.company_name,
      notes: lead.notes,
      agent_id: lead.agent_id,
      source_from_lead_id: lead.id,
      account_id: accountId
    });
    await base44.entities.Lead.update(lead.id, { is_converted: true, converted_customer_id: customer.id, status: "נסגר בהצלחה (שולם)" });

    // notifications to admin + agent
    const adminUsers = users.filter(u => u.role === "admin");
    const notifyIds = [...new Set([lead.agent_id, ...adminUsers.map(u => u.id)].filter(Boolean))];
    for (const uid of notifyIds) {
      await base44.entities.Notification.create({
        user_id: uid,
        type: "LEAD_CONVERTED",
        title: "ליד הומר ללקוח",
        body: `${lead.full_name || lead.phone} הומר ללקוח חדש`,
        is_read: false,
        account_id: accountId
      }).catch(() => {});
    }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-blue-600" />
              ניהול לידים
            </h1>
            <p className="text-gray-500 mt-1">{filtered.length} לידים מוצגים</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
            onClick={() => { setEditingLead(null); setShowForm(true); }}
          >
            <UserPlus className="w-4 h-4 ml-2" />
            ליד חדש
          </Button>
        </div>
      </div>

      {/* Stats */}
      <LeadStatsCards leads={leads} />

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
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

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <LeadTable
          leads={filtered}
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onWhatsApp={handleWhatsApp}
          onQuote={setQuoteTarget}
          onTask={setTaskTarget}
          onConvert={handleConvertClick}
        />
      </div>

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
          onSubmit={handleQuoteSubmit}
          onClose={() => setQuoteTarget(null)}
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