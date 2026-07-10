/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { PhysiologicalData, FullDiagnosticReport, ChatMessage, DailyReport } from "./types";
import MetricCard from "./components/MetricCard";
import RealTimeCharts from "./components/RealTimeCharts";
import DiagnosticReportView from "./components/DiagnosticReportView";
import MicroChallengeBoard from "./components/MicroChallengeBoard";
import DailyTrendsCompiler from "./components/DailyTrendsCompiler";
import HistoryGraph from "./components/HistoryGraph";
import LiveStressAnalysis from "./components/LiveStressAnalysis";
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  Send, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Trophy, 
  Compass, 
  FileHeart, 
  Database, 
  UsersRound, 
  Sparkle,
  History,
  LifeBuoy,
  LayoutDashboard,
  HeartPulse,
  MonitorSmartphone,
  Bell,
  Wifi,
  Settings,
  LogOut,
  Droplets,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initialize with realistic demographic biometric logs to let the clinical trend model operate instantly
const INITIAL_HISTORY: PhysiologicalData[] = [
  {
    heartRate: 65,
    stressScore: 12.5,
    lightLevel: 3000,
    temperature: 22.5,
    humidity: 45,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24h ago
  },
  {
    heartRate: 85,
    stressScore: 59.2,
    lightLevel: 500,
    temperature: 23.1,
    humidity: 50,
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString() // 16h ago
  },
  {
    heartRate: 72,
    stressScore: 35.8,
    lightLevel: 1500,
    temperature: 22.8,
    humidity: 48,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8h ago
  }
];

export default function App() {
  // Biometrics State Simulator
  const [heartRate, setHeartRate] = useState<number>(0);
  const [lightLevel, setLightLevel] = useState<number>(0);
  const [stressScore, setStressScore] = useState<number>(0);
  const [stressCategory, setStressCategory] = useState<string>("Calculating...");

  // DHT Sensor State (via ThingSpeak)
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);

  // ThingSpeak Polling
  const [timeseries, setTimeseries] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const CHANNEL_ID = "3397706";
    const READ_API_KEY = "OMSG4XBQ1WY507SE";

    const fetchThingSpeak = async () => {
      try {
        const res = await fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=30`);
        const data = await res.json();
        
        if (data.feeds && data.feeds.length > 0 && isMounted) {
          // Keep timeseries for charts
          const mappedSeries = data.feeds.map((f: any) => {
            const hr = parseInt(f.field1) || 0;
            const ldr = parseInt(f.field2) || 0;
            const temp = parseFloat(f.field3) || 0;
            const hum = parseFloat(f.field4) || 0;
            const intercept = 12.154236778439078;
            const w_hr = 0.5493432547412623;
            const w_light = -0.009671112002358886;
            const rawScore = intercept + (w_hr * hr) + (w_light * ldr);
            const score = Math.round(Math.max(0, Math.min(100, rawScore)) * 10) / 10;
            return {
              time: new Date(f.created_at).toLocaleTimeString([], {hour12:false}),
              hr: hr,
              light: ldr,
              temperature: temp,
              humidity: hum,
              stressScore: score
            };
          });
          setTimeseries(mappedSeries);

          const feed = data.feeds[data.feeds.length - 1]; // latest
          
          let latestHr = 0;
          let latestLight = 0;
          let latestTemp = 0;
          let latestHum = 0;
          if (feed.field1 && !isNaN(parseFloat(feed.field1))) latestHr = Math.round(parseFloat(feed.field1));
          if (feed.field2 && !isNaN(parseFloat(feed.field2))) latestLight = parseFloat(feed.field2);
          if (feed.field3 && !isNaN(parseFloat(feed.field3))) latestTemp = parseFloat(feed.field3);
          if (feed.field4 && !isNaN(parseFloat(feed.field4))) latestHum = parseFloat(feed.field4);
          
          setHeartRate(latestHr);
          setLightLevel(latestLight);
          setTemperature(latestTemp);
          setHumidity(latestHum);

          const intercept = 12.154236778439078;
          const w_hr = 0.5493432547412623;
          const w_light = -0.009671112002358886;
          const rawScore = intercept + (w_hr * latestHr) + (w_light * latestLight);
          const score = Math.round(Math.max(0, Math.min(100, rawScore)) * 10) / 10;
          setStressScore(score);

          if (score >= 70.59) {
            setStressCategory("High Stress");
          } else if (score >= 52.94) {
            setStressCategory("Moderate Stress");
          } else if (score >= 35.29) {
            setStressCategory("Mild Stress");
          } else {
            setStressCategory("Low Stress");
          }
        }
      } catch (err) {
        console.error("ThingSpeak fetch error:", err);
      }
    };

    fetchThingSpeak(); // initial fetch
    const interval = setInterval(fetchThingSpeak, 15000); // Poll every 15s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Gamification & User levels
  const [xpPoints, setXpPoints] = useState<number>(150);
  const [loggedCount, setLoggedCount] = useState<number>(3); // Matches history logs

  // Diagnostic Report Data
  const [diagnosticReport, setDiagnosticReport] = useState<FullDiagnosticReport | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  // History ledger
  const [history, setHistory] = useState<PhysiologicalData[]>(INITIAL_HISTORY);

  // Navigation Panel Views
  const [activeTab, setActiveTab] = useState<"diagnose" | "chat" | "trends" | "history">("diagnose");

  // Chatbot State
  const [chatPersona, setChatPersona] = useState<"health_therapist" | "friend">("health_therapist");
  const [linkBiometrics, setLinkBiometrics] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Greetings, I am your Mindwave AI Clinical Assistant. Together with PulseIQ sensors, I analyze cardiac loads, blood pressure indices, metabolic trends, and autonomic stress scales in real-time. How can I guide your physiological wellness today?",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Crisis / Emergency Panic States
  const [isCrisisActive, setIsCrisisActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<string>("Inhale");
  const [breathingSeconds, setBreathingSeconds] = useState<number>(4);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom dynamically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  // Breathing Coach ticker during Crisis Mode
  useEffect(() => {
    if (!isCrisisActive) return;
    
    const interval = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev <= 1) {
          if (breathingPhase === "Inhale") {
            setBreathingPhase("Hold");
            return 4;
          } else if (breathingPhase === "Hold") {
            setBreathingPhase("Exhale");
            return 8;
          } else {
            setBreathingPhase("Inhale");
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCrisisActive, breathingPhase]);

  // Handle XP increments
  const handlePointsEarned = (pts: number) => {
    setXpPoints((prev) => prev + pts);
  };

  // Get current state packet
  const getCurrentTelemetry = (): PhysiologicalData => ({
    heartRate,
    stressScore,
    lightLevel,
    temperature,
    humidity,
    timestamp: new Date().toISOString()
  });

  // Log current data manually to historical timeseries database
  const logCurrentTelemetry = () => {
    const packet = getCurrentTelemetry();
    setHistory((prev) => [...prev, packet]);
    setLoggedCount((prev) => prev + 1);
    handlePointsEarned(30); // XP reward for active logging
  };

  // Trigger Clinical AI Diagnostics calculation
  const runDiagnostics = async () => {
    try {
      setReportLoading(true);
      const telemetry = getCurrentTelemetry();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: telemetry, history })
      });
      const data = await response.json();
      if (response.ok && !data.error) {
        setDiagnosticReport(data);
        handlePointsEarned(50);
      } else {
        setDiagnosticReport({
          overallHealthScore: 0,
          overallStatus: "critical",
          timeRecorded: new Date().toISOString(),
          urgencyAction: "API KEY LEAKED - Please update your Gemini API key in Settings -> Secrets panel.",
          clinicalNotes: `Diagnostic Service unavailable. Your current Gemini API key was reported as leaked, or the platform is missing a valid API key. Error: ${data.error || 'Unknown'}`,
          riskAssessments: {},
          metrics: {},
          recommendations: ["Navigate to settings", "Update API Keys"]
        } as unknown as FullDiagnosticReport);
      }
    } catch (err) {
      console.error("Clinical diagnostics run failed:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Send message to Intelligent Chatbot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setChatLoading(true);

    try {
      const telemetry = linkBiometrics ? getCurrentTelemetry() : null;
      // We pass last 8 messages to maintain rich dialog context
      const payloadMessages = [...messages, userMsg].slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          persona: chatPersona,
          currentTelemetry: telemetry
        })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            role: "model",
            text: "🚨 Mindwave AI Core Offline. I experienced difficulty communicating with the language models. Please verify your Gemini API key in the platform settings (Secrets panel). Key might be revoked or leaked.",
            timestamp: new Date().toLocaleTimeString(),
          }
        ]);
        return;
      }

      const modelMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        isCrisis: data.isCrisis
      };

      setMessages((prev) => [...prev, modelMsg]);

      if (data.isCrisis) {
        setIsCrisisActive(true);
      }
    } catch (err) {
      console.error("Chat modules dispatch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "model",
          text: "I experienced difficulty reaching my core analytical neurons. Please verify that your clinical workspace Gemini API key is configured in the Secrets pane.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Determine current telemetry warning labels to pass down to cards
  const getHRStatus = () => {
    if (heartRate > 100) return "Tachycardia Spike";
    if (heartRate < 50) return "Bradycardia";
    return "Optimal Active Pulse";
  };

  return (
    <div className="flex bg-[#0f172a] text-slate-100 min-h-screen font-sans selection:bg-teal-500 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">My PulseIQ</h2>
              <p className="text-[10px] text-slate-400">Personal Wellness · v2.4</p>
            </div>
          </div>

          <div className="px-4 space-y-6 mt-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Monitor</p>
              <nav className="space-y-1">
                <button onClick={() => setActiveTab("diagnose")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'diagnose' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button onClick={() => setActiveTab("trends")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'trends' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                  <HeartPulse className="w-4 h-4" />
                  My Vitals
                </button>
                <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-slate-200`}>
                  <MonitorSmartphone className="w-4 h-4" />
                  My Devices
                </button>
                <button onClick={() => setActiveTab("history")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'history' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                  <Bell className="w-4 h-4" />
                  Alerts & History
                </button>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">System</p>
              <nav className="space-y-1">
                <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-slate-200`}>
                  <Wifi className="w-4 h-4" />
                  Network
                </button>
                <button onClick={() => setActiveTab("chat")} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'chat' ? 'bg-teal-900/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    Settings & AI
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                M.E
              </div>
              <div>
                <p className="text-xs font-bold text-white">User</p>
                <p className="text-[10px] text-teal-400">Premium Plan</p>
              </div>
            </div>
            <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

        <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col z-10 w-full max-w-7xl mx-auto">
          {/* HEADER ROW */}
          <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/60 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="text-xs font-bold text-teal-400 tracking-wide uppercase">LIVE - My ESP32 Sensors</span>
            </div>

            

            <div className="flex items-center justify-end gap-3 w-full md:w-auto">
              <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700">MY-ESP32</span>
              <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700">SIG 96%</span>
              <span className="text-xs text-slate-400 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </header>

          <div className="mb-6">
            <p className="text-[10px] text-slate-500 font-mono mb-2">Sensor Stream - Device: ESP32 + Pulse + LDR + DHT11 + Firmware 2.1.0 • Last sync 1.5s ago • All systems nominal ✓</p>
            <h1 className="text-2xl font-bold font-display text-white">My Personal Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Sensors: ESP32 (HR + LDR + DHT11)</p>
          </div>

      {/* PANIC MODAL BANNER ON CRISIS DETECTED */}
      <AnimatePresence>
        {isCrisisActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl w-full mx-auto mb-6 overflow-hidden"
          >
            <div className="bg-rose-950/60 border border-rose-500/40 p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
              {/* background animate glow */}
              <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl animate-bounce">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-rose-200 uppercase tracking-wide">
                    Mindwave Crisis Mode Engaged
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 font-sans max-w-xl leading-relaxed">
                    Severe cardiovascular metrics or anxiety indicators detected. Remain seated and calm. If experiencing direct physical agony, severe shortness of breath, or cardiac chest constriction, telephone emergency medical services (911) immediately.
                  </p>
                </div>
              </div>

              {/* AUTONOMIC CALMING REGULATOR (Breathing coach) */}
              <div className="flex items-center gap-5 bg-slate-950/40 border border-rose-500/20 p-3.5 rounded-xl min-w-[260px] self-stretch md:self-auto justify-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  {/* Glowing expanding breathing circle */}
                  <motion.div 
                    animate={{ 
                      scale: breathingPhase === "Inhale" ? [1, 2] : breathingPhase === "Hold" ? 2 : [2, 1] 
                    }}
                    transition={{ 
                      duration: breathingPhase === "Inhale" ? 4 : breathingPhase === "Hold" ? 4 : 8,
                      ease: "easeInOut"
                    }}
                    className="absolute w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/60"
                  />
                  <span className="font-mono text-[10px] text-white font-bold tracking-tight">{breathingSeconds}s</span>
                </div>

                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase font-mono">Relaxation Coach</span>
                  <span className="text-xs font-black text-teal-400 block font-display uppercase tracking-widest">{breathingPhase}</span>
                  <span className="text-[10px] text-slate-400 font-sans">Simulating calming pacing...</span>
                </div>
              </div>

              <button
                onClick={() => setIsCrisisActive(false)}
                className="text-[10px] font-bold tracking-wider uppercase border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white px-3.5 py-2 rounded-xl transition-all duration-300 mt-2 md:mt-0 font-display shrink-0"
              >
                Dismiss Regulator
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE APPLICATION GRID - Only show if not in History mode */}
      {activeTab !== 'history' && (
      <main className="w-full mx-auto flex-1 flex flex-col gap-6 items-start pb-8">
        
        {/* TOP DECK: 4 CARDS (HR, LDR, Temp, Humidity) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <MetricCard
            id="heartRate"
            title="Heart Rate"
            value={heartRate}
            unit="bpm"
            icon={Heart}
            colorClass="text-cyan-400"
            statusText={getHRStatus() === "Optimal Active Pulse" ? "NORMAL" : getHRStatus().toUpperCase()}
            optimalRange=""
          />
          <MetricCard
            id="lightLevel"
            title="Ambient Light"
            value={lightLevel}
            unit="ADC"
            icon={Compass}
            colorClass="text-amber-400"
            statusText={lightLevel > 2500 ? "HIGH" : lightLevel < 500 ? "LOW" : "NORMAL"}
            optimalRange=""
          />
          <MetricCard
            id="temperature"
            title="Temperature"
            value={temperature}
            unit="°C"
            icon={Thermometer}
            colorClass="text-teal-400"
            statusText="NORMAL"
            optimalRange=""
          />
          <MetricCard
            id="humidity"
            title="Humidity"
            value={humidity}
            unit="%"
            icon={Droplets}
            colorClass="text-blue-400"
            statusText="NORMAL"
            optimalRange=""
          />
        </div>

        {/* Charts */}
        <div className="w-full">
          <RealTimeCharts data={timeseries} />
        </div>

        {/* OTHER SECTIONS BASED ON TAB */}
        <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Context Area (Left) */}
          <div className="lg:col-span-8 flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-2xl p-5 w-full flex flex-col gap-6">
            
            {/* AI Action */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
               <div className="text-sm">
                  <span className="font-bold font-display text-white block">Diagnostic AI Engine</span>
                  <span className="text-[10px] text-slate-400">Generate real-time physiological report</span>
               </div>
               <button
                  onClick={runDiagnostics}
                  disabled={reportLoading}
                  className="font-display uppercase tracking-widest text-xs font-bold bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black px-6 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.25)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] cursor-pointer"
                >
                  {reportLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkle className="w-4 h-4 text-black animate-pulse" />
                      Synthesize Report
                    </>
                  )}
                </button>
            </div>

            {/* TAB HEADERS NAVIGATION */}
            <div className="bg-slate-900/30 p-1.5 border border-slate-900 rounded-2xl flex gap-1 items-center">
              <button
                onClick={() => setActiveTab("diagnose")}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 font-display ${
                  activeTab === "diagnose" 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-700/20 border border-teal-500/10" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Activity className="w-4 h-4" />
                Clinical Diagnostics
              </button>
              
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 font-display ${
                  activeTab === "chat" 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-700/20 border border-teal-500/10" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Mindwave AI Chatbot
              </button>

              <button
                onClick={() => setActiveTab("trends")}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 font-display ${
                  activeTab === "trends" 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-700/20 border border-teal-500/10" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <FileHeart className="w-4 h-4" />
                Weekly Optimizer
              </button>
            </div>

            {/* DYNAMIC VIEWPORTS DISPLAY */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === "diagnose" && (
                  <motion.div
                    key="diagnose"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DiagnosticReportView report={diagnosticReport} loading={reportLoading} />
                  </motion.div>
                )}

                {activeTab === "trends" && (
                  <motion.div
                    key="trends"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DailyTrendsCompiler history={history} />
                  </motion.div>
                )}

                {activeTab === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl flex flex-col justify-between h-[645px] overflow-hidden relative"
                  >
                  {/* Chat Panel Headers */}
                  <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UsersRound className="w-4 h-4 text-teal-400" />
                        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                          Mindwave Multi-Agent Pool
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Choose clinical agent behavioral setting depending on desired therapy guidance
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:pt-0 size-full sm:w-auto justify-between sm:justify-start">
                      {/* Persona Switchers */}
                      <div className="bg-slate-950 p-1 border border-slate-850 rounded-xl flex gap-1">
                        <button
                          onClick={() => setChatPersona("health_therapist")}
                          className={`text-[9px] font-bold font-mono uppercase px-2.5 py-1 rounded-lg transition-all duration-350 ${
                            chatPersona === "health_therapist" 
                              ? "bg-teal-600 text-white" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Health Analyst
                        </button>
                        <button
                          onClick={() => setChatPersona("friend")}
                          className={`text-[9px] font-bold font-mono uppercase px-2.5 py-1 rounded-lg transition-all duration-350 ${
                            chatPersona === "friend" 
                              ? "bg-teal-600 text-white" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Empathetic Friend
                        </button>
                      </div>

                      {/* Biometric Link Toggler */}
                      <button
                        onClick={() => setLinkBiometrics(!linkBiometrics)}
                        className={`p-1.5 rounded-xl border transition-all duration-350 flex items-center gap-1 text-[9px] font-bold font-mono tracking-wider uppercase ${
                          linkBiometrics 
                            ? "border-teal-500/30 text-teal-400 bg-teal-950/20" 
                            : "border-slate-800 text-slate-500 hover:bg-slate-900"
                        }`}
                        title={linkBiometrics ? "Disengage continuous telemetry feeding" : "Engage live metrics mirroring"}
                      >
                        <Activity className={`w-3.5 h-3.5 ${linkBiometrics ? "animate-pulse" : ""}`} />
                        {linkBiometrics ? "Vitals Synced" : "Vitals Decoupled"}
                      </button>
                    </div>
                  </div>

                  {/* Messages Stream list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
                    {messages.map((m) => {
                      const isModel = m.role === "model";
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isModel ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl p-4.5 text-xs inline-block shadow-md ${
                            isModel 
                              ? "bg-slate-900 bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80 text-slate-300 rounded-tl-sm" 
                              : "bg-teal-600/90 border border-teal-500/40 text-white rounded-tr-sm"
                          }`}>
                            <div className="flex items-center gap-2 mb-1.5 opacity-60 text-[9px] font-mono leading-none">
                              <span>{isModel ? (chatPersona === "friend" ? "EMPATHETIC COMPANION" : "HEALTH DIAGNOSTICIAN") : "PATIENT PORTAL"}</span>
                              <span>·</span>
                              <span>{m.timestamp}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap antialiased">
                              {m.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl rounded-tl-sm p-4 text-xs max-w-[80%] inline-block">
                          <span className="text-[10px] font-mono text-slate-500 tracking-wider block mb-2 uppercase animate-pulse">Running analysis inference...</span>
                          <div className="flex gap-1 items-center h-4 pt-1">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input box */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/80 border-t border-slate-800 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-300 placeholder-slate-600 text-xs focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 transition-all duration-300"
                      placeholder="Ask the clinical agent about symptoms, cardio load, stress mitigation..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !inputText.trim()}
                      className="p-3 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl transition-all duration-350 cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

          {/* Right Sidebar (Challenges & Stress Diagnostics) */}
          <div className="lg:col-span-4 w-full space-y-6">
            <LiveStressAnalysis 
              currentStress={stressScore} 
              heartRate={heartRate} 
              lightLevel={lightLevel} 
              temperature={temperature} 
              humidity={humidity} 
              timeseries={timeseries} 
            />
            <MicroChallengeBoard currentTelemetry={getCurrentTelemetry()} onPointsEarned={handlePointsEarned} />
          </div>
        </section>
      </main>
      )}

      {/* HISTORY GRAPH VIEW */}
      {activeTab === 'history' && (
        <main className="w-full mx-auto flex-1 flex flex-col gap-6 items-start pb-8">
           <div className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-2xl p-5">
             <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-900/80">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-100">
                  Historical Log Analytics
                </h3>
              </div>
            </div>
             <HistoryGraph data={timeseries} />
           </div>
        </main>
      )}

      {/* FOOTER SYSTEM */}
      <footer className="max-w-7xl w-full mx-auto text-center pt-8 border-t border-slate-900 text-[10px] text-slate-500 font-mono flex flex-col md:flex-row justify-between gap-4 items-center mt-6">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          <span>Local Vault Encrypted · HIPAA-Aligned Processing Layer</span>
        </div>
        <div className="flex gap-4">
          <span>Mindwave AI Core v2.4</span>
          <span>PulseIQ Tracker v1.2</span>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
}
