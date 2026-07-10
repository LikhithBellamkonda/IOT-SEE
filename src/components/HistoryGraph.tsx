import React, { useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface HistoryGraphProps {
  data: any[];
}

export default function HistoryGraph({ data }: HistoryGraphProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">
          No History Data Available
        </span>
      </div>
    );
  }

  // Calculate Averages
  const averages = useMemo(() => {
    if (data.length === 0) return { hr: 0, light: 0, stress: 0, temperature: 0, humidity: 0 };
    const sum = data.reduce((acc, curr) => ({
      hr: acc.hr + (curr.hr || 0),
      light: acc.light + (curr.light || 0),
      stress: acc.stress + (curr.stressScore || 0),
      temperature: acc.temperature + (curr.temperature || 0),
      humidity: acc.humidity + (curr.humidity || 0)
    }), { hr: 0, light: 0, stress: 0, temperature: 0, humidity: 0 });
    return {
      hr: Math.round(sum.hr / data.length),
      light: Math.round(sum.light / data.length),
      stress: Math.round((sum.stress / data.length) * 10) / 10,
      temperature: Math.round((sum.temperature / data.length) * 10) / 10,
      humidity: Math.round(sum.humidity / data.length)
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap justify-center mb-6">
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Avg HR</span>
          <span className="text-sm text-cyan-400 font-bold">{averages.hr} bpm</span>
        </div>
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Avg LDR</span>
          <span className="text-sm text-amber-400 font-bold">{averages.light}</span>
        </div>
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Avg Stress</span>
          <span className="text-sm text-purple-400 font-bold">{averages.stress}</span>
        </div>
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Avg Temp</span>
          <span className="text-sm text-red-400 font-bold">{averages.temperature} °C</span>
        </div>
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Avg Humidity</span>
          <span className="text-sm text-blue-400 font-bold">{averages.humidity} %</span>
        </div>
      </div>
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-4 text-center">
          Combined Timeseries (HR, LDR, Stress, Temp, Hum)
        </h4>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} />
              {/* Primary Y-Axis for scaled metrics (HR, Stress, Humidity) */}
              <YAxis yAxisId="left" stroke="#475569" fontSize={10} />
              {/* Secondary Y-Axis for Light Level and Temp */}
              <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" name="Heart Rate" dataKey="hr" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" name="Light (LDR)" dataKey="light" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="left" type="monotone" name="Stress Score" dataKey="stressScore" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" name="Temperature" dataKey="temperature" stroke="#f87171" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="left" type="monotone" name="Humidity" dataKey="humidity" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
