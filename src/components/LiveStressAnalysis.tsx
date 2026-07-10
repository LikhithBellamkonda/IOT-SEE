import React, { useMemo } from "react";
import { Activity, ArrowUp, CheckCircle } from "lucide-react";

interface LiveStressAnalysisProps {
  currentStress: number;
  heartRate: number;
  lightLevel: number;
  temperature: number;
  humidity: number;
  timeseries: any[];
}

export default function LiveStressAnalysis({
  currentStress,
  heartRate,
  lightLevel,
  temperature,
  humidity,
  timeseries
}: LiveStressAnalysisProps) {
  const stats = useMemo(() => {
    if (!timeseries || timeseries.length === 0) {
      return { avgStress: 0, avgHr: 0, avgLight: 0, avgTemp: 0, avgHum: 0 };
    }
    const sum = timeseries.reduce(
      (acc, curr) => ({
        stress: acc.stress + (curr.stressScore || 0),
        hr: acc.hr + (curr.hr || 0),
        light: acc.light + (curr.light || 0),
        temp: acc.temp + (curr.temperature || 0),
        hum: acc.hum + (curr.humidity || 0),
      }),
      { stress: 0, hr: 0, light: 0, temp: 0, hum: 0 }
    );
    const len = timeseries.length;
    return {
      avgStress: Math.round((sum.stress / len) * 10) / 10,
      avgHr: Math.round(sum.hr / len),
      avgLight: Math.round(sum.light / len),
      avgTemp: Math.round((sum.temp / len) * 10) / 10,
      avgHum: Math.round(sum.hum / len),
    };
  }, [timeseries]);

  const isStressElevated = currentStress > stats.avgStress;

  // Identify contributing parameters
  const flaggedParameters = [];
  if (isStressElevated) {
    if (heartRate > stats.avgHr) {
      flaggedParameters.push({
        name: "Heart Rate",
        current: `${heartRate} bpm`,
        average: `${stats.avgHr} bpm`,
        reason: "Elevated heart rate contributes directly to higher biological stress scores."
      });
    }
    if (lightLevel < stats.avgLight) {
      flaggedParameters.push({
        name: "Ambient Light",
        current: `${lightLevel} lux`,
        average: `${stats.avgLight} lux`,
        reason: "Lower ambient light intensity stimulates higher sympathetic stress indicators."
      });
    }
    if (temperature > stats.avgTemp) {
      flaggedParameters.push({
        name: "Temperature",
        current: `${temperature} °C`,
        average: `${stats.avgTemp} °C`,
        reason: "Elevated room temperature acts as a physical environmental stressor."
      });
    }
    if (humidity > stats.avgHum) {
      flaggedParameters.push({
        name: "Humidity",
        current: `${humidity} %`,
        average: `${stats.avgHum} %`,
        reason: "Higher humidity indices elevate thermal strain and perceived bodily fatigue."
      });
    }
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-2xl p-5 w-full flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <h4 className="font-display text-xs font-bold text-slate-300 uppercase tracking-wider">
            Live Stress Analysis
          </h4>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Real-Time ML</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Current Score</span>
          <span className="text-3xl font-black text-purple-400 font-display">
            {currentStress}
            <span className="text-xs text-slate-500 font-normal"> /100</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Historical Avg</span>
          <span className="text-lg font-bold text-slate-300">
            {stats.avgStress}
            <span className="text-xs text-slate-500 font-normal"> /100</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-purple-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, currentStress))}%` }}
        />
      </div>

      {/* Flagged parameters list */}
      <div className="mt-2 space-y-3">
        {isStressElevated ? (
          <>
            <div className="flex items-center gap-2 text-amber-400 bg-amber-950/20 border border-amber-905/40 p-2.5 rounded-xl text-xs font-medium">
              <ArrowUp className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Stress is elevated above average by {Math.round((currentStress - stats.avgStress) * 10) / 10} points.</span>
            </div>
            
            {flaggedParameters.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Triggering Parameters</span>
                {flaggedParameters.map((p, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center font-bold text-slate-200">
                      <span>{p.name}</span>
                      <span className="text-amber-400 font-mono">{p.current} <span className="text-[9px] text-slate-500 font-normal font-sans">avg: {p.average}</span></span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{p.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic">
                Stress score is elevated, but individual telemetry parameters are currently close to average.
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-teal-400 bg-teal-950/20 border border-teal-900/40 p-2.5 rounded-xl text-xs font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Stress levels are within average range ({stats.avgStress}). All parameters nominal.</span>
          </div>
        )}
      </div>
    </div>
  );
}
