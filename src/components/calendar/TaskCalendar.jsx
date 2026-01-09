import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { he } from "date-fns/locale";

// פונקציה להמרת מספר לגימטריה עברית
const numberToHebrewLetters = (num) => {
  if (num === 0) return '';
  
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
  
  // טיפול במקרים מיוחדים של 15 ו-16
  if (num === 15) return 'ט״ו';
  if (num === 16) return 'ט״ז';
  
  let result = '';
  
  // מאות
  if (num >= 100) {
    const hundredsDigit = Math.floor(num / 100);
    if (hundredsDigit <= 4) {
      result += hundreds[hundredsDigit];
      num = num % 100;
    }
  }
  
  // עשרות
  if (num >= 10) {
    const tensDigit = Math.floor(num / 10);
    result += tens[tensDigit];
    num = num % 10;
  }
  
  // יחידות
  if (num > 0) {
    result += ones[num];
  }
  
  // הוספת גרש או גרשיים
  if (result.length === 1) {
    return result + '׳';
  } else if (result.length > 1) {
    return result.slice(0, -1) + '״' + result.slice(-1);
  }
  
  return result;
};

// פונקציה להמרת תאריך לועזי לתאריך עברי מדויק עם אותיות
const getHebrewDate = (date) => {
  try {
    // שימוש ב-API מובנה של הדפדפן לחישוב תאריך עברי מדויק
    const hebrewDateFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const parts = hebrewDateFormatter.formatToParts(date);
    
    const dayNumber = parseInt(parts.find(part => part.type === 'day')?.value || '0');
    const month = parts.find(part => part.type === 'month')?.value;
    const year = parts.find(part => part.type === 'year')?.value;
    
    // המרת המספר לאותיות עבריות
    const dayLetters = numberToHebrewLetters(dayNumber);
    
    return {
      day: dayLetters,
      dayNumber: dayNumber,
      month: month,
      year: year
    };
  } catch (error) {
    return null;
  }
};

export default function TaskCalendar({ tasks, selectedDate, onDateSelect, onTaskClick }) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // התחלת השבוע ביום ראשון (כמו בישראל)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDate = (date) => {
    return tasks.filter(task => isSameDay(new Date(task.due_date), date));
  };

  const priorityColors = {
    "נמוכה": "bg-blue-200",
    "בינונית": "bg-yellow-200", 
    "גבוהה": "bg-orange-200",
    "קריטית": "bg-red-200"
  };

  const handlePreviousMonth = () => {
    onDateSelect(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateSelect(addMonths(selectedDate, 1));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            יומן משימות
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="text-lg font-semibold min-w-[150px] text-center">
              {format(selectedDate, "MMMM yyyy", { locale: he })}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* שמות הימים - מראשון עד שבת */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 p-2 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* הימים בלוח השנה */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hebrewDate = getHebrewDate(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-28 p-2 border rounded-lg cursor-pointer transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'}
                  ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : ''}
                  ${isToday && !isSelected ? 'border-blue-300 bg-blue-50/50' : ''}
                `}
                onClick={() => onDateSelect(day)}
              >
                {/* התאריך הלועזי */}
                <div className={`font-semibold text-sm mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, "d")}
                  {isToday && <span className="text-xs mr-1">•</span>}
                </div>
                
                {/* התאריך העברי באותיות */}
                {hebrewDate && isCurrentMonth && (
                  <div className="text-[10px] text-gray-500 mb-2 leading-tight font-medium">
                    {hebrewDate.day} {hebrewDate.month}
                  </div>
                )}
                
                {/* משימות */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`
                        text-xs p-1 rounded cursor-pointer truncate
                        ${priorityColors[task.priority]} hover:opacity-80 transition-opacity
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  
                  {dayTasks.length > 2 && (
                    <div className="text-[10px] text-gray-500 text-center font-medium">
                      +{dayTasks.length - 2} נוספות
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* מקרא */}
        <div className="flex justify-center gap-4 mt-6 pt-4 border-t flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span className="text-sm">נמוכה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span className="text-sm">בינונית</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-200 rounded"></div>
            <span className="text-sm">גבוהה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span className="text-sm">קריטית</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}