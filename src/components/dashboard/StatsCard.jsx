import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const colorClasses = {
  blue: "bg-blue-500 text-blue-600",
  green: "bg-green-500 text-green-600", 
  orange: "bg-orange-500 text-orange-600",
  red: "bg-red-500 text-red-600"
};

export default function StatsCard({ title, value, icon: Icon, color, trend, linkTo }) {
  const CardContent = () => (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
      <div className={`absolute top-0 left-0 w-32 h-32 transform -translate-x-8 -translate-y-8 ${colorClasses[color].split(' ')[0]} rounded-full opacity-5`} />
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-opacity-10 ${colorClasses[color].split(' ')[0]}`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[1]}`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
            <span className="text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}