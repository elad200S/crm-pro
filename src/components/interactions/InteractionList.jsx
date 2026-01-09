import React, { useState, useEffect, useCallback } from "react";
import { Interaction } from "@/entities/Interaction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Video, Mail, MessageCircle, MessageSquare, Clock, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import InteractionForm from "./InteractionForm";

const typeIcons = {
  call: Phone,
  meeting: Video,
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  other: Clock
};

const typeLabels = {
  call: "שיחת טלפון",
  meeting: "פגישה", 
  email: "אימייל",
  whatsapp: "וואטסאפ",
  sms: "SMS",
  other: "אחר"
};

const outcomeColors = {
  positive: "bg-green-100 text-green-800",
  negative: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-800",
  follow_up_needed: "bg-yellow-100 text-yellow-800"
};

const outcomeLabels = {
  positive: "חיובית",
  negative: "שלילית", 
  neutral: "ניטרלית",
  follow_up_needed: "נדרש מעקב"
};

export default function InteractionList({ customerId }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);

  const loadInteractions = useCallback(async () => {
    try {
      const data = await Interaction.filter({ customer_id: customerId }, '-interaction_date');
      setInteractions(data);
    } catch (error) {
      console.error("שגיאה בטעינת אינטראקציות:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      loadInteractions();
    }
  }, [customerId, loadInteractions]);

  const handleEdit = (interaction) => {
    setEditingInteraction(interaction);
    setShowForm(true);
  };

  const handleDelete = async (interactionId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את האינטראקציה?")) {
      try {
        await Interaction.delete(interactionId);
        loadInteractions();
      } catch (error) {
        console.error("שגיאה במחיקת אינטראקציה:", error);
      }
    }
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingInteraction(null);
    loadInteractions();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingInteraction(null);
  };

  if (loading) {
    return <div className="text-center py-4">טוען היסטוריית אינטראקציות...</div>;
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <InteractionForm
          customerId={customerId}
          interaction={editingInteraction}
          onSaved={handleFormSaved}
          onCancel={handleFormCancel}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              יומן אינטראקציות ({interactions.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              אינטראקציה חדשה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              אין אינטראקציות רשומות עדיין
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => {
                const TypeIcon = typeIcons[interaction.type];
                return (
                  <div key={interaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="w-6 h-6 text-gray-600" />
                        <div>
                          <h4 className="font-semibold">{interaction.subject}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{typeLabels[interaction.type]}</span>
                            {interaction.duration && (
                              <>
                                <span>•</span>
                                <span>{interaction.duration} דקות</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{format(new Date(interaction.interaction_date), "dd/MM/yyyy HH:mm", { locale: he })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={outcomeColors[interaction.outcome]}>
                          {outcomeLabels[interaction.outcome]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(interaction)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(interaction.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{interaction.description}</p>
                    
                    {interaction.next_action && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm font-medium text-yellow-800 mb-1">פעולת המשך:</p>
                        <p className="text-sm text-yellow-700">{interaction.next_action}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}