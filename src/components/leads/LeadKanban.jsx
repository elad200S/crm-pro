import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Phone, MessageCircle, FileText, Plus, Edit, Trash2, UserCheck, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const COLUMNS = [
  { id: "התקבל",                label: "התקבל",        dot: "bg-blue-500",   headerBg: "bg-blue-50",   border: "border-blue-200",  countBg: "bg-blue-100",   countText: "text-blue-700"   },
  { id: "שיחה חוזרת",           label: "שיחה חוזרת",   dot: "bg-amber-500",  headerBg: "bg-amber-50",  border: "border-amber-200", countBg: "bg-amber-100",  countText: "text-amber-700"  },
  { id: "בוצע איפיון",          label: "בוצע איפיון",  dot: "bg-purple-500", headerBg: "bg-purple-50", border: "border-purple-200",countBg: "bg-purple-100", countText: "text-purple-700" },
  { id: "נשלחה הצעת מחיר",      label: "הצעה נשלחה",   dot: "bg-orange-500", headerBg: "bg-orange-50", border: "border-orange-200",countBg: "bg-orange-100", countText: "text-orange-700" },
  { id: "נסגר בהצלחה (שולם)",   label: "נסגר ✓",       dot: "bg-green-500",  headerBg: "bg-green-50",  border: "border-green-200", countBg: "bg-green-100",  countText: "text-green-700"  },
  { id: "לא רלוונטי",           label: "לא רלוונטי",   dot: "bg-gray-400",   headerBg: "bg-gray-50",   border: "border-gray-200",  countBg: "bg-gray-100",   countText: "text-gray-500"   },
];

const AVATAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const isUrgent = (lead) => {
  const now = new Date();
  if (lead.next_followup_at && new Date(lead.next_followup_at) < now) return true;
  if (lead.status === "התקבל" && lead.created_date) {
    return (now - new Date(lead.created_date)) / 36e5 > 24;
  }
  return false;
};

export default function LeadKanban({ leads, users, onEdit, onDelete, onWhatsApp, onQuote, onTask, onConvert, onRowClick, onStatusChange, loading }) {
  const getUserName = (id) => users.find(u => u.id === id)?.full_name || null;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const lead = leads.find(l => l.id === result.draggableId);
    if (!lead || lead.status === newStatus) return;
    onStatusChange(result.draggableId, newStatus);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      <span>טוען לידים...</span>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1" style={{ minHeight: "60vh" }}>
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => l.status === col.id);
          return (
            <div key={col.id} className="flex-shrink-0 w-60 flex flex-col">
              {/* Header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${col.headerBg} ${col.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countBg} ${col.countText}`}>{colLeads.length}</span>
              </div>

              {/* Drop zone */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-b-xl border-x border-b p-2 space-y-2 min-h-48 transition-colors ${col.border} ${
                      snapshot.isDraggingOver ? "bg-blue-50/70" : "bg-gray-50/60"
                    }`}
                  >
                    {colLeads.map((lead, index) => {
                      const urgent = isUrgent(lead);
                      const initials = (lead.full_name || lead.phone || "?").slice(0, 2).toUpperCase();
                      const agentName = getUserName(lead.agent_id);

                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              onClick={() => onRowClick(lead)}
                              className={`bg-white rounded-xl border cursor-pointer select-none transition-all duration-150
                                ${snap.isDragging ? "shadow-xl rotate-1 scale-[1.03] border-blue-300" : "shadow-sm hover:shadow-md"}
                                ${urgent ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"}`}
                            >
                              {urgent && (
                                <div className="flex items-center gap-1 px-3 pt-2 pb-0">
                                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                                  <span className="text-xs text-red-500 font-medium">דורש טיפול</span>
                                </div>
                              )}

                              <div className="p-3 flex items-start gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(lead.full_name)}`}>
                                  <span className="text-white text-xs font-bold">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                    {lead.full_name || lead.phone}
                                  </p>
                                  {lead.company_name && (
                                    <p className="text-xs text-gray-400 truncate">{lead.company_name}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {lead.lead_source && (
                                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{lead.lead_source}</span>
                                    )}
                                    {lead.next_followup_at && (
                                      <span className={`text-xs flex items-center gap-0.5 ${new Date(lead.next_followup_at) < new Date() ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(lead.next_followup_at), "dd/MM", { locale: he })}
                                      </span>
                                    )}
                                    {agentName && (
                                      <span className="text-xs text-gray-400 truncate">{agentName}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action bar */}
                              <div className="border-t border-gray-100 px-1.5 py-1.5 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                <button onClick={() => onWhatsApp(lead)} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="WhatsApp">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onQuote(lead)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="הצעת מחיר">
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onTask(lead)} className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors" title="משימה">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onConvert(lead)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors" title="המר ללקוח">
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex-1" />
                                <button onClick={() => onEdit(lead)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(lead)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {colLeads.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-16 text-xs text-gray-300">
                        גרור ליד לכאן
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
