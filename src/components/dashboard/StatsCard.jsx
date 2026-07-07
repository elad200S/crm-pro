import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

const COLOR_MAP = {
  blue:   { blob: "bg-blue-400",   icon: "bg-blue-50 text-blue-600",   bar: "bg-blue-500" },
  green:  { blob: "bg-green-400",  icon: "bg-green-50 text-green-600", bar: "bg-green-500" },
  orange: { blob: "bg-orange-400", icon: "bg-orange-50 text-orange-500", bar: "bg-orange-500" },
  red:    { blob: "bg-red-400",    icon: "bg-red-50 text-red-500",     bar: "bg-red-500" },
  purple: { blob: "bg-purple-400", icon: "bg-purple-50 text-purple-600", bar: "bg-purple-500" },
  gray:   { blob: "bg-gray-300",   icon: "bg-gray-50 text-gray-400",   bar: "bg-gray-300" },
};

export default function StatsCard({ title, value, icon: Icon, color = "blue", trend, trendUp, progress, linkTo }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  const inner = (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer border shadow-sm h-full">
      {/* background blob */}
      <div className={`absolute -top-6 -left-6 w-28 h-28 rounded-full opacity-[0.06] ${c.blob}`} />

      <CardHeader className="p-5 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
          </div>
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${c.icon.split(' ')[0]}`}>
            <Icon className={`w-5 h-5 ${c.icon.split(' ')[1]}`} />
          </div>
        </div>

        {/* Progress bar (optional) */}
        {progress !== undefined && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Trend line */}
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trendUp === true  && <TrendingUp  className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
            {trendUp === false && <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
            <span className={
              trendUp === true  ? "text-green-600 font-medium" :
              trendUp === false ? "text-red-500 font-medium" :
              "text-gray-400"
            }>
              {trend}
            </span>
          </div>
        )}
      </CardHeader>
    </Card>
  );

  return linkTo ? <Link to={linkTo} className="block h-full">{inner}</Link> : inner;
}
