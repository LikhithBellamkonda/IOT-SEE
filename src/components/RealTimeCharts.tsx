/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface RealTimeChartsProps {
  data: any[];
}

export default function RealTimeCharts({ data }: RealTimeChartsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-teal-500 rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">
          Awaiting ThingSpeak Handshake...
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Heart Rate Chart */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="text-rose-400">♥</span> Heart Rate Trend <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">BPM</span>
            </h4>
            <p className="text-[10px] text-slate-500">Live ECG/Pulse-derived rate</p>
          </div>
          <span className="text-[8px] bg-teal-900/30 text-teal-400 px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 border border-teal-500/20">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            Syncing
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={20} />
              <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', color: '#f8fafc' }}
                itemStyle={{ color: '#06b6d4' }}
              />
              <Area type="stepAfter" dataKey="hr" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Light Level Chart */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="text-amber-400">☼</span> Ambient Light (LDR) <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-amber-400">ADC Value</span>
            </h4>
            <p className="text-[10px] text-slate-500">Environment illumination feed</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={20} />
              <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', color: '#f8fafc' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Line type="stepAfter" dataKey="light" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temperature Chart */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="text-red-400">🌡️</span> Temperature <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-red-400">°C</span>
            </h4>
            <p className="text-[10px] text-slate-500">DHT sensor cabin temperature</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={20} />
              <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', color: '#f8fafc' }}
                itemStyle={{ color: '#f87171' }}
              />
              <Line type="monotone" dataKey="temperature" stroke="#f87171" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity Chart */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="text-blue-400">💧</span> Humidity <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-blue-400">%RH</span>
            </h4>
            <p className="text-[10px] text-slate-500">DHT sensor relative humidity</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={20} />
              <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', color: '#f8fafc' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line type="monotone" dataKey="humidity" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress Chart */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="text-purple-400">⚠</span> Autonomic Stress <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-purple-400">Score</span>
            </h4>
            <p className="text-[10px] text-slate-500">ML-derived physiological load</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={20} />
              <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', color: '#f8fafc' }}
                itemStyle={{ color: '#a855f7' }}
              />
              <Area type="monotone" dataKey="stressScore" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorStress)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
