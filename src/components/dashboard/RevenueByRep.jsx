import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#84cc16"];

export default function RevenueByRep({ data }) {
  const chartData = (data || []).filter(d => d.amount > 0);

  return (
    <div className="bg-white rounded-2xl border shadow-sm px-6 py-5">
      <h2 className="font-bold text-gray-800 text-sm mb-4">הכנסות החודש לפי נציג</h2>
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">אין עדיין הכנסות ששולמו החודש</p>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => (v >= 1000 ? `₪${Math.round(v / 1000)}k` : `₪${v}`)}
              />
              <Tooltip
                formatter={(value) => [`₪${Number(value).toLocaleString()}`, "הכנסות"]}
                cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13, direction: "rtl" }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}