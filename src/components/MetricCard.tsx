/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  statusText: string;
  optimalRange: string;
}

export default function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  colorClass,
  statusText,
  optimalRange,
}: MetricCardProps) {
  // Determine if it is optimal
  const isOptimal = statusText.toLowerCase().includes("optimal") || statusText.toLowerCase().includes("normal");

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/50 transition-all duration-300 relative overflow-hidden group">
      {/* Background radial glow */}
      <div className={`absolute -right-12 -top-12 w-24 h-24 rounded-full ${colorClass} opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-300`} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-slate-800 border border-slate-700/50 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</h4>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-xl font-bold text-white tracking-tight">{value}</span>
              <span className="text-xs text-slate-400 font-medium">{unit}</span>
            </div>
          </div>
        </div>

        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border tracking-wide font-mono ${
          isOptimal 
            ? "text-teal-400 bg-teal-950/30 border-teal-500/20" 
            : "text-amber-400 bg-amber-950/30 border-amber-500/20"
        }`}>
          {statusText}
        </span>
      </div>

      <div className="flex justify-between text-[10px] text-slate-400/80 font-mono pt-2 border-t border-slate-800">
        <span>Clinical Target:</span>
        <span className="text-slate-300 font-medium">{optimalRange}</span>
      </div>
    </div>
  );
}
