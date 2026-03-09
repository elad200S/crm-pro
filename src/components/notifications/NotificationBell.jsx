import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const { Notification, Task, Payment } = base44.entities;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, X, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const notificationIcons = {
  task_overdue: "🔴",
  payment_due: "💰", 
  new_customer: "👤",
  reminder: "⏰",
  system: "ℹ️"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800", 
  urgent: "bg-red-100 text-red-800"
};

export default function NotificationBell({ onOpenChange, isOpen: externalIsOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // אם קיבלנו prop חיצוני של isOpen, נשתמש בו
  const actualIsOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen;

  useEffect(() => {
    loadNotifications();
    checkAndCreateNotifications();
    
    // רענון כל 60 שניות
    const interval = setInterval(() => {
      loadNotifications();
      checkAndCreateNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await Notification.list('-created_date', 50);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      // תעלם משגיאות בשקט
    }
  };

  const checkAndCreateNotifications = async () => {
    try {
      // בדיקת משימות שעבר זמנן או קרובות ל-24 שעות
      const tasks = await Task.list('-due_date', 100);
      const now = new Date();
      
      for (const task of tasks) {
        if (task.status !== "הושלם") {
          const dueDate = new Date(task.due_date);
          const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
          const isOverdue = dueDate < now;
          const isDueSoon = hoursUntilDue >= 0 && hoursUntilDue <= 24;

          if (isOverdue || isDueSoon) {
            try {
              const notifType = isOverdue ? "task_overdue" : "reminder";
              const existingNotifications = await Notification.filter({
                related_id: task.id,
                related_type: "task",
                type: notifType
              });
              
              if (existingNotifications.length === 0) {
                await Notification.create({
                  title: isOverdue ? "משימה עברה את המועד" : "משימה מתקרבת למועד",
                  message: isOverdue
                    ? `המשימה "${task.title}" עברה את מועד הביצוע`
                    : `המשימה "${task.title}" צריכה להסתיים בתוך פחות מ-24 שעות`,
                  type: notifType,
                  related_id: task.id,
                  related_type: "task",
                  priority: task.priority === "קריטית" ? "urgent" : isOverdue ? "high" : "medium"
                });
              }
            } catch (err) {
              // תעלם משגיאות ביצירת התראה בודדת
            }
          }
        }
      }

      // בדיקת לידים עם מעקב שמגיע תוך 15 דקות
      const leads = await base44.entities.Lead.list('-created_date', 100);
      for (const lead of leads) {
        if (lead.next_followup_at && lead.status !== "נסגר בהצלחה (שולם)" && lead.status !== "לא רלוונטי") {
          const followupTime = new Date(lead.next_followup_at);
          const minutesUntil = (followupTime - now) / (1000 * 60);
          if (minutesUntil >= 0 && minutesUntil <= 15) {
            try {
              const existing = await Notification.filter({
                related_id: lead.id,
                related_type: "lead",
                type: "follow_up"
              });
              if (existing.length === 0) {
                await Notification.create({
                  title: "תזכורת מעקב",
                  message: `מעקב עם ${lead.full_name || lead.phone} בעוד ${Math.round(minutesUntil)} דקות`,
                  type: "follow_up",
                  related_id: lead.id,
                  related_type: "lead",
                  priority: "high",
                  is_read: false
                });
              }
            } catch (err) {}
          }
        }
      }

      // בדיקת תשלומים שמתקרבים למועד או עברו אותו
      const payments = await Payment.list('-due_date', 100);
      
      for (const payment of payments) {
        if (payment.status !== "שולם") {
          const dueDate = new Date(payment.due_date);
          const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
          
          // אם נשאר פחות משבוע או שכבר עבר המועד
          if (daysUntilDue <= 7 && daysUntilDue >= -30) {
            try {
              const existingNotifications = await Notification.filter({
                related_id: payment.id,
                related_type: "payment",
                type: "payment_due"
              });
              
              if (existingNotifications.length === 0) {
                const message = daysUntilDue < 0 
                  ? `תשלום בסך ₪${payment.amount} עבר את מועד התשלום ב-${Math.abs(daysUntilDue)} ימים`
                  : `תשלום בסך ₪${payment.amount} מגיע תוך ${daysUntilDue} ימים`;
                
                await Notification.create({
                  title: daysUntilDue < 0 ? "תשלום באיחור" : "תשלום מתקרב",
                  message: message,
                  type: "payment_due",
                  related_id: payment.id,
                  related_type: "payment",
                  priority: daysUntilDue < 0 ? "urgent" : "high"
                });
              }
            } catch (err) {
              // תעלם משגיאות ביצירת התראה בודדת
            }
          }
        }
      }

      // טעינה מחדש של ההתראות לאחר יצירת התראות חדשות
      await loadNotifications();
    } catch (error) {
      // תעלם משגיאות בשקט
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      await loadNotifications();
    } catch (error) {
      // אם ההתראה לא קיימת, פשוט נרענן את הרשימה
      await loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // סימון כל ההתראות שלא נקראו בנפרד
      for (const notification of unreadNotifications) {
        try {
          await Notification.update(notification.id, { is_read: true });
        } catch (error) {
          // אם אחת נכשלה, ממשיכים לאחרות
        }
      }
      
      await loadNotifications();
    } catch (error) {
      // גם אם הייתה שגיאה, נרענן את הרשימה
      await loadNotifications();
    }
  };

  const deleteNotification = async (notificationId, event) => {
    // עצירת התפשטות האירוע כדי שלא יסמן כנקרא
    if (event) {
      event.stopPropagation();
    }
    
    try {
      // מחיקה מיידית מהמצב המקומי
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // ניסיון למחיקה מהשרת
      await Notification.delete(notificationId);
    } catch (error) {
      // אם נכשל, פשוט נרענן את הרשימה מהשרת
      await loadNotifications();
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <Popover open={actualIsOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">התראות</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 ml-1" />
                סמן הכל כנקרא
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                אין התראות
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{notificationIcons[notification.type]}</span>
                        <span className="font-medium text-sm">{notification.title}</span>
                        <Badge className={priorityColors[notification.priority]} size="sm">
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="text-xs text-gray-500">
                        {format(new Date(notification.created_date), "dd/MM HH:mm", { locale: he })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}