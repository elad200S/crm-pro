import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function PaymentChart({ payments }) {
  const getMonthlyData = () => {
    const monthlyData = {};
    const months = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];

    // אתחול 12 החודשים האחרונים
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      const key = `${monthName} ${year}`;
      monthlyData[key] = 0;
    }
    
    payments.forEach(payment => {
      if (payment.status === "שולם" && payment.paid_date) {
        const paymentDate = new Date(payment.paid_date);
        const monthName = months[paymentDate.getMonth()];
        const year = paymentDate.getFullYear();
        const key = `${monthName} ${year}`;
        
        if (monthlyData.hasOwnProperty(key)) {
          monthlyData[key] += (payment.amount || 0);
        }
      }
    });

    const dataArray = Object.entries(monthlyData).map(([month, amount]) => ({
      month: month.split(' ')[0], // רק החודש
      amount,
      fullMonth: month
    }));

    return dataArray;
  };

  const data = getMonthlyData();
  
  // חישוב טרנד
  const currentMonth = data[data.length - 1]?.amount || 0;
  const previousMonth = data[data.length - 2]?.amount || 0;
  const trend = currentMonth - previousMonth;
  const trendPercentage = previousMonth > 0 ? ((trend / previousMonth) * 100).toFixed(1) : 0;

  // מציאת הסכום המקסימלי לקביעת טווח הגרף
  const maxAmount = Math.max(...data.map(d => d.amount));
  const yAxisMax = Math.max(maxAmount * 1.2, 50000); // לפחות 50K או 120% מהמקסימום

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            הכנסות חודשיות
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={trend >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              {trend >= 0 ? "+" : ""}{trendPercentage}%
            </span>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          ₪{currentMonth.toLocaleString()}
        </div>
        <p className="text-sm text-gray-600">
          החודש הנוכחי • הטרנד החודשי: {trend >= 0 ? "עלייה" : "ירידה"} של ₪{Math.abs(trend).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                domain={[0, yAxisMax]}
                ticks={[0, yAxisMax * 0.25, yAxisMax * 0.5, yAxisMax * 0.75, yAxisMax]}
                tickFormatter={(value) => {
                  if (value === 0) return '₪0';
                  return `₪${(value/1000).toFixed(0)}K`;
                }}
              />
              <Tooltip 
                formatter={(value) => [`₪${value.toLocaleString()}`, "הכנסות"]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `חודש: ${item.fullMonth}` : label;
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#colorRevenue)"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* תצוגת נתונים נוספים */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600">ממוצע חודשי</p>
            <p className="text-lg font-bold text-gray-900">
              ₪{Math.round(data.reduce((sum, item) => sum + item.amount, 0) / data.length).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">הכנסה גבוהה ביותר</p>
            <p className="text-lg font-bold text-green-600">
              ₪{maxAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">סה"כ השנה</p>
            <p className="text-lg font-bold text-blue-600">
              ₪{data.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}