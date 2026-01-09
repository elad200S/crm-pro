import React, { useState } from "react";
import { Interaction } from "@/entities/Interaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function InteractionForm({ customerId, onSaved, onCancel, interaction = null }) {
  const [formData, setFormData] = useState({
    customer_id: customerId,
    type: interaction?.type || "call",
    subject: interaction?.subject || "",
    description: interaction?.description || "",
    interaction_date: interaction?.interaction_date || new Date().toISOString().slice(0, 16),
    duration: interaction?.duration || "",
    outcome: interaction?.outcome || "neutral",
    next_action: interaction?.next_action || ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null
      };

      if (interaction) {
        await Interaction.update(interaction.id, dataToSave);
      } else {
        await Interaction.create(dataToSave);
      }
      
      if (onSaved) onSaved();
    } catch (error) {
      console.error("שגיאה בשמירת אינטראקציה:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{interaction ? "עריכת אינטראקציה" : "אינטראקציה חדשה"}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">סוג אינטראקציה *</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">שיחת טלפון</SelectItem>
                  <SelectItem value="meeting">פגישה</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem>
                  <SelectItem value="whatsapp">וואטסאפ</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interaction_date">תאריך ושעה *</Label>
              <Input
                id="interaction_date"
                type="datetime-local"
                value={formData.interaction_date}
                onChange={(e) => handleChange("interaction_date", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">נושא *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                required
                placeholder="נושא האינטראקציה"
              />
            </div>

            <div>
              <Label htmlFor="duration">משך זמן (דקות)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="משך זמן בדקות"
              />
            </div>

            <div>
              <Label htmlFor="outcome">תוצאה</Label>
              <Select value={formData.outcome} onValueChange={(value) => handleChange("outcome", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">חיובית</SelectItem>
                  <SelectItem value="negative">שלילית</SelectItem>
                  <SelectItem value="neutral">ניטרלית</SelectItem>
                  <SelectItem value="follow_up_needed">נדרש מעקב</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">תיאור מפורט *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              required
              placeholder="תיאור מפורט של האינטראקציה..."
            />
          </div>

          <div>
            <Label htmlFor="next_action">פעולת המשך</Label>
            <Textarea
              id="next_action"
              value={formData.next_action}
              onChange={(e) => handleChange("next_action", e.target.value)}
              rows={2}
              placeholder="מה צריך לעשות בהמשך?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 ml-2" />
              שמור
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}