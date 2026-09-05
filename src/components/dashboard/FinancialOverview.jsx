import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, TrendingDown, Wallet, ChevronLeft } from "lucide-react";

export default function FinancialOverview({ monthlyRevenue, monthlyExpenses, netCashFlow, aging }) {
  const totalAging = aging["0-30"] + aging["31-60"] + aging["60+"];

  return (
    <div className="bg-white rounded-2xl border shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Wallet className="w-4 h-4 text-teal-600" />
          תמונת מצב פיננסית — החודש
        </h2>
        <Link to={createPageUrl("Expenses")}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
          ניהול הוצאות <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
          <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500">הכנסות</p>
            <p className="text-lg font-bold text-green-700">₪{monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
          <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500">הוצאות</p>
            <p className="text-lg font-bold text-red-700">₪{monthlyExpenses.toLocaleString()}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${netCashFlow >= 0 ? "bg-teal-50 border-teal-100" : "bg-orange-50 border-orange-100"}`}>
          <Wallet className={`w-5 h-5 flex-shrink-0 ${netCashFlow >= 0 ? "text-teal-600" : "text-orange-600"}`} />
          <div>
            <p className="text-[11px] text-gray-500">תזרים נטו</p>
            <p className={`text-lg font-bold ${netCashFlow >= 0 ? "text-teal-700" : "text-orange-700"}`}>
              {netCashFlow >= 0 ? "+" : ""}₪{netCashFlow.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {totalAging > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">חובות פתוחים לפי גיל</p>
          <div className="flex gap-2">
            {[
              { label: "0-30 יום", value: aging["0-30"], color: "bg-amber-400" },
              { label: "31-60 יום", value: aging["31-60"], color: "bg-orange-500" },
              { label: "60+ יום", value: aging["60+"], color: "bg-red-500" },
            ].map(b => (
              <div key={b.label} className="flex-1 text-center">
                <div className={`h-1.5 rounded-full mb-1.5 ${b.value > 0 ? b.color : "bg-gray-100"}`} />
                <p className="text-sm font-bold text-gray-800">₪{b.value.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
