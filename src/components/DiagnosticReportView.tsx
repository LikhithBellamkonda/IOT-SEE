/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FullDiagnosticReport } from "../types";
import { 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Brain, 
  Activity, 
  Heart, 
  BadgeAlert,
  Flame,
  Wind,
  Sun,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";

interface DiagnosticReportViewProps {
  report: FullDiagnosticReport | null;
  loading: boolean;
}

export default function DiagnosticReportView({ report, loading }: DiagnosticReportViewProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
        {/* Animated radar/scan lines to create complex high-tech diagnostic look */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
        <div className="w-16 h-16 border-4 border-slate-800 border-t-teal-500 rounded-full animate-spin mb-6" />
        <h3 className="font-display text-lg font-semibold text-slate-100 uppercase tracking-wider mb-2">
          Mindwave AI Processing
        </h3>
        <p className="text-slate-400 text-sm max-w-sm text-center font-sans">
          Running physiological telemetry analysis. Cross-referencing clinical cardiovascular indices, metabolic rates, & neural stress levels...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[460px] text-center">
        <div className="p-4 rounded-full bg-slate-800/80 text-teal-400 border border-slate-700/50 mb-6 animate-pulse">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-100 uppercase tracking-widest mb-2">
          Clinical Diagnostics Idle
        </h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
          Review your real-time ThingSpeak vitals in the telemetry deck, then click "Synthesize Mindwave AI Report" to perform clinical diagnostic calculations.
        </p>
      </div>
    );
  }

  // Helper colors for levels
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "optimal": return "text-teal-400 border-teal-500/20 bg-teal-950/20";
      case "normal": return "text-cyan-400 border-cyan-500/20 bg-cyan-950/20";
      case "caution": return "text-amber-400 border-amber-500/20 bg-amber-950/20";
      case "warning": return "text-orange-400 border-orange-500/20 bg-orange-950/20";
      case "critical": return "text-rose-400 border-rose-500/20 bg-rose-950/20 animate-pulse";
      default: return "text-slate-400 border-slate-500/20 bg-slate-950/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#0d9488"; // teal
    if (score >= 70) return "#06b6d4"; // cyan
    if (score >= 55) return "#d97706"; // amber
    return "#e11d48"; // rose
  };

  const getRiskIcon = (system: string) => {
    switch (system) {
      case "cardiovascular": return Heart;
      case "stressAndLoad": return Brain;
      case "environmental": return Sun;
      default: return AlertCircle;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "moderate": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "high": return "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-teal-500/20 via-cyan-500/60 to-rose-500/20" />

      {/* EMERGENCY URGENCY ACTION NOTICE BOARD */}
      {report.urgencyAction && (
        <div className="mb-6 p-4 bg-rose-950/50 border border-rose-500/40 rounded-xl flex gap-3.5 items-start">
          <BadgeAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-rose-200 font-display font-semibold text-xs uppercase tracking-wider">
              CRITICAL CARDIOVASCULAR DISRUPTION DETECTED
            </h4>
            <p className="text-rose-300 text-xs mt-1 font-sans font-medium">
              {report.urgencyAction}
            </p>
          </div>
        </div>
      )}

      {/* TOP HEADER SUMMARY */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-5">
          {/* Custom SVG Score Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={getScoreColor(report.overallHealthScore)}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * report.overallHealthScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold text-white tracking-widest">{report.overallHealthScore}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Biostatus</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Mindwave Core Status</span>
              <span className="text-[8px] font-mono text-slate-500">· ISO-{report.timeRecorded.substring(11,19)}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100 uppercase tracking-tight mt-0.5">
              Automated Clinical Bio-Audit
            </h3>
            <div className="flex gap-2 items-center mt-2">
              <span className={`text-[10px] font-bold tracking-wider font-mono rounded-full border px-3 py-0.5 uppercase ${getStatusColor(report.overallStatus)}`}>
                Severity: {report.overallStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/40 px-4 py-2 border border-slate-800 rounded-xl text-slate-300 font-sans text-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span className="font-medium">No system failures mapped</span>
        </div>
      </div>

      {/* CLINICAL SUMMARY NOTES */}
      <div className="py-5 font-sans">
        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Physician Synthesis</h4>
        <p className="text-slate-300 text-sm leading-relaxed antialiased">
          {report.clinicalNotes}
        </p>
      </div>

      {/* SYSTEMS CARDIO / RESP / METABOLIC RISKS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 py-4 border-y border-slate-800/60 mb-5">
        {Object.entries(report.riskAssessments || {}).map(([key, data]) => {
          const Icon = getRiskIcon(key);
          const riskColor = getRiskColor(data.risk);
          return (
            <div key={key} className="bg-slate-900/40 border border-slate-800/50 p-3.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider font-display">
                  {key}
                </span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>

              <div className="mt-1">
                <span className={`text-[9px] font-bold tracking-widest font-mono uppercase px-2 py-0.5 border rounded-full ${riskColor}`}>
                  Risk: {data.risk}
                </span>
                <p className="text-[10px] text-slate-400 mt-2 font-sans leading-relaxed">
                  {data.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* METRICS CLINICAL ANALYSIS DETAILS */}
      <div className="space-y-3.5 mb-5">
        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Metrics Diagnostics</h4>
        {Object.entries(report.metrics || {}).map(([key, metric]) => {
          return (
            <div key={key} className="bg-slate-900/30 border border-slate-800/30 p-3 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-1.5 h-8 bg-teal-500/40 rounded-full" />
                <div>
                  <h5 className="text-[10px] font-semibold uppercase text-slate-300 font-display">
                    {key.replace(/([A-Z])/g, " $1")}
                  </h5>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-mono font-bold text-white">{metric.value}</span>
                    <span className="text-[9px] text-slate-500">ideal: {metric.idealRange}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-1.5">
                <span className={`self-start md:self-auto text-[8px] font-bold font-mono uppercase px-2 py-0.5 rounded-full border ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
                <p className="text-[10px] text-slate-400 leading-normal max-w-md font-sans">
                  {metric.feedback}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PERSONALIZED RECOMMENDATIONS RECIPES */}
      <div className="space-y-3 pt-2">
        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          Mindwave Recommended Wellness Protocol
        </h4>
        <div className="grid md:grid-cols-2 gap-3">
          {report.recommendations.map((item, index) => (
            <div key={index} className="bg-slate-900/20 border border-slate-800/50 p-3 rounded-xl flex gap-3 text-slate-300 text-xs">
              <span className="font-mono text-teal-400 font-semibold">{String(index + 1).padStart(2, "0")}</span>
              <p className="font-sans leading-normal">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
