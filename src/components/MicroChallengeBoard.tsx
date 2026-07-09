/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Challenge, PhysiologicalData } from "../types";
import { Trophy, Zap, RefreshCw, CheckCircle2, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface MicroChallengeBoardProps {
  currentTelemetry: PhysiologicalData;
  onPointsEarned: (pts: number) => void;
}

export default function MicroChallengeBoard({ currentTelemetry, onPointsEarned }: MicroChallengeBoardProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  // Calls backend to suggest personalized wellness task
  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setChallenge(null);
      setHasCompleted(false);

      const res = await fetch("/api/suggest-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry: currentTelemetry })
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        setChallenge({
          id: "error",
          title: "API Key Error",
          description: "Please update your Gemini API key in the Settings -> Secrets panel.",
          duration: "N/A",
          difficulty: "easy",
          points: 0,
          metricType: "heartRate",
          target: 0,
          currentValue: 0,
          isCompleted: false
        });
        return;
      }
      
      const suggested: Challenge = {
        id: String(Date.now()),
        title: data.title || "Quick Sensory Break",
        description: data.description || "Inhale through your nose for 4 seconds, hold for 4 seconds, exhale for 8 seconds.",
        duration: data.duration || "3 mins",
        difficulty: data.difficulty || "easy",
        points: data.points || 50,
        metricType: data.metricType || "stressLevel",
        target: data.target || 3,
        currentValue: 0,
        isCompleted: false
      };

      setChallenge(suggested);
      setProgressValue(0);
    } catch (err) {
      console.error("Failed to fetch custom challenge:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePulseUpdate = () => {
    if (!challenge) return;
    
    // Increment challenge simulated progress
    const stepAmount = Math.ceil(challenge.target / 4);
    const newVal = Math.min(challenge.target, progressValue + stepAmount);
    setProgressValue(newVal);

    if (newVal >= challenge.target && !hasCompleted) {
      setHasCompleted(true);
      onPointsEarned(challenge.points);
    }
  };

  const difficultyColors = (diff: string) => {
    switch (diff) {
      case "easy": return "text-teal-400 bg-teal-950/20 border-teal-500/20";
      case "medium": return "text-amber-400 bg-amber-950/20 border-amber-500/20";
      default: return "text-rose-400 bg-rose-950/20 border-rose-500/20";
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-400" />
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-100">
            Biometric Engagement Arena
          </h4>
        </div>
        <button
          onClick={fetchChallenge}
          disabled={loading}
          className="text-[10px] items-center gap-1 bg-slate-800 border border-slate-700/50 hover:bg-slate-700/60 disabled:opacity-40 hover:text-white px-2.5 py-1 rounded-lg text-slate-400 font-mono transition-all duration-300 flex"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {challenge ? "Generate Another" : "Generate Microtask"}
        </button>
      </div>

      {!challenge && !loading && (
        <div className="flex flex-col items-center justify-center text-center flex-1">
          <Trophy className="w-8 h-8 text-slate-600 mb-2.5" />
          <p className="text-xs text-slate-400 max-w-xs font-sans leading-relaxed">
            Struggling to build habits? Let Mindwave AI gamify your biological trends! Get custom exercise recommendations tailored by your real-time ThingSpeak bio-scores.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 py-6">
          <div className="w-6 h-6 border-2 border-slate-800 border-t-teal-500 rounded-full animate-spin mb-2" />
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Generating engagement game module...</p>
        </div>
      )}

      {challenge && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 flex-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex gap-2 items-center mb-1.5 flex-wrap">
              <span className={`text-[8px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${difficultyColors(challenge.difficulty)}`}>
                {challenge.difficulty}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Duration: {challenge.duration}
              </span>
              <span className="text-[9px] text-teal-400 font-mono font-semibold ml-auto flex items-center gap-1">
                +{challenge.points} XP
              </span>
            </div>
            
            <h5 className="font-display text-sm font-bold text-white tracking-wide">
              {challenge.title}
            </h5>
            <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">
              {challenge.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Goal Progress:</span>
              <span className="font-bold text-slate-300">
                {progressValue} / {challenge.target} {challenge.metricType.replace("lightLevel", "lux").replace("stressScore", "/100 stress").replace("heartRate", "bpm")}
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 relative overflow-hidden">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                style={{ width: `${Math.min(100, (progressValue / challenge.target) * 100)}%` }}
              />
            </div>

            <div className="flex gap-2 mt-2 pt-1">
              {!hasCompleted ? (
                <button
                  onClick={handleSimulatePulseUpdate}
                  className="w-full text-[10px] font-bold tracking-wider uppercase bg-teal-600 hover:bg-teal-500 text-white font-display py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1 shadow-lg shadow-teal-500/20"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Perform Task Session
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-1.5 bg-teal-950/30 border border-teal-500/30 text-teal-400 py-1.5 rounded-xl text-[10px] uppercase font-mono font-bold animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Challenge Completed! Earned {challenge.points} XP
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
