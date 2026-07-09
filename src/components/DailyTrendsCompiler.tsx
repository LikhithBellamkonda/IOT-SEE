/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DailyReport, PhysiologicalData } from "../types";
import { FileHeart, ClipboardCheck, AlertTriangle, Lightbulb, HelpCircle, FileText } from "lucide-react";
import { motion } from "motion/react";

interface DailyTrendsCompilerProps {
  history: PhysiologicalData[];
}

export default function DailyTrendsCompiler({ history }: DailyTrendsCompilerProps) {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDailyReport = async () => {
    if (history.length === 0) return;
    try {
      setLoading(true);
      setReport(null);

      const res = await fetch("/api/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setReport(data);
      } else {
        setReport({
          date: new Date().toLocaleDateString(),
          summary: "API KEY ERROR - Please update your Gemini API key in Settings -> Secrets panel. The API key may be reported as leaked.",
          pros: ["Diagnostic system offline"],
          cons: ["AI Backend failed to synthesize data due to a revoked or leaked API key."],
          suggestions: ["Verify your API Keys in AI Studio's sidebar."],
          activityLevel: "moderate"
        });
      }
    } catch (err) {
      console.error("Failed to compile 24h metrics trend report:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityBadge = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case "highly active": return "bg-teal-950/40 text-teal-400 border-teal-500/20";
      case "active": return "bg-cyan-950/40 text-cyan-400 border-cyan-500/20";
      case "moderate": return "bg-amber-950/40 text-amber-400 border-amber-500/20";
      default: return "bg-slate-950/40 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileHeart className="w-5 h-5 text-teal-400" />
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-100">
              Wellness Trend Analyzer (Daily)
            </h4>
          </div>
          
          <button
            onClick={fetchDailyReport}
            disabled={history.length === 0 || loading}
            className="text-[10px] items-center gap-1 bg-slate-800 hover:bg-slate-700 hover:text-white disabled:opacity-40 border border-slate-700/50 px-2.5 py-1.5 rounded-xl text-slate-300 font-mono transition-all duration-300 flex"
          >
            {loading ? "Analyzing..." : "Synthesize Daily Report"}
          </button>
        </div>

        {/* Dynamic empty state */}
        {!report && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <ClipboardCheck className="w-10 h-10 text-slate-700 mb-2.5" />
            <p className="text-xs text-slate-400 max-w-xs font-sans leading-relaxed">
              {history.length === 0 
                ? "Wait for your ThingSpeak sensor telemetry logs to populate or log them manually to give the compiler raw data trends." 
                : "Your telemetry index holds data. Compile clinical bio-trend notes for an overview of today's vagal nerve activity, circadian dips, & stressors."}
            </p>
            {history.length > 0 && (
              <span className="text-[9px] text-teal-500 font-mono mt-1 animate-pulse">
                ({history.length} data point logs ready inside index buffer)
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-slate-800 border-t-teal-500 rounded-full animate-spin mb-3.5" />
            <p className="text-xs text-slate-400 font-sans max-w-sm text-center">
              Aggregating biometric timeseries, calculating systolic/diastolic trend charts, and generating medical guidance logs...
            </p>
          </div>
        )}

        {report && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Activity badge */}
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Trend Window:</span>
              <span className={`text-[9px] font-bold font-mono uppercase px-2.5 py-1 rounded border ${getIntensityBadge(report.activityLevel)}`}>
                Activity Rate: {report.activityLevel}
              </span>
            </div>

            {/* Quick narrative */}
            <div className="text-slate-300 text-xs font-sans leading-relaxed border-b border-slate-800/60 pb-3">
              {report.summary}
            </div>

            {/* Pros vs Cons layout */}
            <div className="grid md:grid-cols-2 gap-3 pb-1">
              <div>
                <h5 className="text-[9px] font-bold text-teal-400 uppercase tracking-wide font-display mb-1.5 flex items-center gap-1">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Positive Indicators
                </h5>
                <ul className="space-y-1.5 text-[10px] text-slate-300 font-sans">
                  {report.pros.map((p, i) => (
                    <li key={i} className="flex gap-1.5 leading-normal">
                      <span className="text-teal-400 shrink-0">✔</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-[9px] font-bold text-rose-400 uppercase tracking-wide font-display mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Physiological Vulnerabilities
                </h5>
                <ul className="space-y-1.5 text-[10px] text-slate-300 font-sans">
                  {report.cons.map((c, i) => (
                    <li key={i} className="flex gap-1.5 leading-normal">
                      <span className="text-rose-400 shrink-0">⚠</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tech hacks suggestions */}
            <div className="bg-slate-900/30 p-3.5 border border-slate-800/80 rounded-xl">
              <h5 className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-display mb-2 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Recommended Clinical Lifestyle Adjustments
              </h5>
              <div className="space-y-2 text-[10px] text-slate-300">
                {report.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1" />
                    <p className="leading-relaxed font-sans">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
