/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure process.cwd() is used properly for locating build directories
const projectRoot = process.cwd();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.api_key;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or api_key environment variable is required. Please add it to your Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Wrapper for generateContent to handle 503 High Demand errors
async function generateContentWithRetry(ai: GoogleGenAI, config: any, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(config);
    } catch (error: any) {
      const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("High demand");
      const is429 = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("Quota");
      if ((is503 || is429) && i < retries - 1) {
        console.warn(`[Gemini API] Engine is busy (${is503 ? '503' : '429'}). Retrying ${i + 1}/${retries} in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 1.5; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate content after max retries.");
}

// Structured output schema for Physiological Diagnostic Analysis
const diagnosticResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallHealthScore: {
      type: Type.INTEGER,
      description: "Overall clinical health score from 1 (severe danger) to 100 (peak optimum condition) based on vital trends.",
    },
    overallStatus: {
      type: Type.STRING,
      description: "Must be exactly one of: 'optimal', 'normal', 'caution', 'warning', or 'critical'.",
    },
    timeRecorded: {
      type: Type.STRING,
      description: "The time of analysis."
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        heartRate: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING, description: "Format: 'X bpm'" },
            status: { type: Type.STRING, description: "optimal, normal, caution, warning, or critical" },
            feedback: { type: Type.STRING, description: "Clinically relevant short statement about heart biological load, rate, or arrhythmia risk." },
            idealRange: { type: Type.STRING, description: "Typical resting range based on patient metrics (e.g. '60-80 bpm')" }
          },
          required: ["value", "status", "feedback", "idealRange"]
        },
        lightLevel: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING, description: "Format: 'X Lux'" },
            status: { type: Type.STRING, description: "optimal, normal, caution, warning, or critical" },
            feedback: { type: Type.STRING, description: "Statement outlining environmental brightness or digital screen strain." },
            idealRange: { type: Type.STRING, description: "e.g., '500 - 2000 Lux'" }
          },
          required: ["value", "status", "feedback", "idealRange"]
        },
        stressScore: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING, description: "Format: 'X/100'" },
            status: { type: Type.STRING, description: "optimal, normal, caution, warning, or critical" },
            feedback: { type: Type.STRING, description: "Assessment of autonomic nerve activation, sympathetic/parasympathetic balance based on score." },
            idealRange: { type: Type.STRING, description: "e.g., '< 50'" }
          },
          required: ["value", "status", "feedback", "idealRange"]
        }
      },
      required: ["heartRate", "lightLevel", "stressScore"]
    },
    riskAssessments: {
      type: Type.OBJECT,
      properties: {
        cardiovascular: {
          type: Type.OBJECT,
          properties: {
            risk: { type: Type.STRING, description: "low, moderate, or high" },
            note: { type: Type.STRING, description: "Clinical risk factors mapped to risk levels." }
          },
          required: ["risk", "note"]
        },
        stressAndLoad: {
          type: Type.OBJECT,
          properties: {
            risk: { type: Type.STRING, description: "low, moderate, or high" },
            note: { type: Type.STRING, description: "Cortisol stress, mental burnout levels, psychological load." }
          },
          required: ["risk", "note"]
        },
        environmental: {
          type: Type.OBJECT,
          properties: {
            risk: { type: Type.STRING, description: "low, moderate, or high" },
            note: { type: Type.STRING, description: "Environmental factors like lighting conditions and their impact." }
          },
          required: ["risk", "note"]
        }
      },
      required: ["cardiovascular", "stressAndLoad", "environmental"]
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Detailed list of personalized clinical lifestyle recommendations (vagal exercises, breathing pacing, water/electrolyte adjustment, activity corrections)."
    },
    clinicalNotes: {
      type: Type.STRING,
      description: "An overarching clinical diagnostic view synthesizing all biological inputs (vitals + activity levels)."
    },
    urgencyAction: {
      type: Type.STRING,
      description: "If values denote critical medical failure (e.g., severe bradycardia/tachycardia, hypoxic crash, hypertensive crisis), state emergency action steps immediately. Fill with descriptive string. If perfectly safe/normal, present as null (empty string / 'null' text / not present)."
    }
  },
  required: [
    "overallHealthScore", 
    "overallStatus", 
    "timeRecorded", 
    "metrics", 
    "riskAssessments", 
    "recommendations", 
    "clinicalNotes", 
    "urgencyAction"
  ]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Health Diagnostic Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      engine: "PulseIQ-MindwaveAI Fullstack Engine",
      vitalsSupported: ["Heart Rate", "Blood Pressure", "Oxygen Saturation", "Body Temp", "Mental Stress"]
    });
  });

  // API 2: Analyze real-time physiological vitals and output clinical report
  app.post("/api/analyze", async (req, res) => {
    try {
      const { current, history = [] } = req.body;
      if (!current) {
        res.status(400).json({ error: "Missing current physiological metrics data." });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `
You are the PulseIQ Clinical AI Diagnostic Engine, fully integrated with MindwaveAI's Health Agent.
Analyze the user's current physiological biometric state and recent medical logging history to construct a highly accurate, professional clinical health report.

[CURRENT TELEMETRY DATA]:
- Heart Rate: ${current.heartRate} bpm
- Environmental Load (Light Level): ${current.lightLevel} lux
- ML-Derived Stress Score: ${current.stressScore}/100

[HISTORICAL CONTEXT] (recent previous metrics logs if any):
${JSON.stringify(history.slice(-5))}

Analyze normal physiological thresholds:
- Heart Rate resting normal: 60-100 bpm. Elevated: >100 bpm (tachycardia). Low: <60 bpm (bradycardia, unless athletic).
- Light Level ambient normal: 500-2000 lux. Suboptimal: <500 lux (Seasonal Affective risks). Harsh strain: >2500 lux.
- Stress ML Score normal/relaxed: 0-35. Mild Stress: 35-52. Moderate Load: 53-70. High Stress: >70.

Determine overall score, severity, risk profiles, clinical notes, and recommendations. If vitals are critical, make sure "urgencyAction" is highly prominent detailing medical instruction. Otherwise set "urgencyAction" to null.
`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional board-certified family clinical physician. You analyze real-time bio-telemetry with high clinical precision, supplying objective health diagnostics, warning levels, metabolic scores, and practical physiological advice. Do not mention that you are an AI model.",
          responseMimeType: "application/json",
          responseSchema: diagnosticResponseSchema,
        },
      });

      const responseText = response.text || "{}";
      const report = JSON.parse(responseText.trim());
      res.json(report);
    } catch (err: any) {
      console.error("Clinical analysis error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Failed to process physiological analytics" });
    }
  });

  // API 3: Context-aware Intelligent Chat (Mindwave multi-agent assistant)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages = [], persona = 'health_therapist', currentTelemetry = null } = req.body;
      const ai = getGeminiClient();

      let systemPrompt = "";
      if (persona === 'friend') {
        systemPrompt = `
You are the "Mindwave Friendly Companion" from the MindwaveAI project, integrated into the PulseIQ health suite.
Your persona is extremely empathetic, warm, friendly, informal, and deeply supportive.
You want to make the user feel comfortable, emotionally grounded, and validated, while encouraging healthy habits.

Your responses should feel casual and warm. Always refer to their current vitals if they are being recorded.
`;
      } else {
        // Clinical therapist / Health advisor agent
        systemPrompt = `
You are the "Mindwave Clinical Health Analyst" from the MindwaveAI team, integrated inside the PulseIQ diagnostic platform.
Your persona is professional, scientific, extremely informative, factual, and medically rigorous, but remaining warm and empathetic.
You translate complex bio-sensor metrics, symptoms, and physiological stress states into highly clear, evidence-based health/mindfulness guidance.

Avoid vague responses. Give specific physiological/neurological explanations when appropriate (e.g. vagal nerve activation, blood sugar levels, blood pressure dynamics).
`;
      }

      // Append real-time sensor context to guide the conversation
      let biometricContext = "";
      if (currentTelemetry) {
        biometricContext = `
[REAL-TIME BIO-SENSOR TELEMETRY INJECTED FROM PULSEIQ TRACKER]:
- Heart Rate: ${currentTelemetry.heartRate} bpm (Normal: 60-100)
- Environmental Load (Light Level): ${currentTelemetry.lightLevel} lux (Normal: 500-2000)
- Stress Score: ${currentTelemetry.stressScore}/100 (Normal: 0-35)
`;
      }

      // Crisis analysis subsystem: Detect psychological or physical crisis states
      const systemInstruction = `
${systemPrompt}
${biometricContext}

CRITICAL DIRECTIVE (Crisis Subsystem):
- Continuously monitor conversations for severe clinical distress, signs of hyper-ventilation, coronary failure sensations (severe chest tightness + high heart rate), panic attacks, or self-harm/suicidal ideation.
- If detected, you MUST trigger an active Crisis Mode. Gently urge the user to call 911 (or local emergency lines), offer immediate calming breathing counts (4-7-8 breathing), advise sitting down immediately, and provide a clear, supportive safety statement. Keep safety as your absolute highest priority.
`;

      // Map chat messages for standard Gemini API form
      // We convert local ChatMessage array to the contents structure requested by @google/genai
      const chatContents = messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await generateContentWithRetry(ai, {
        model: "gemini-1.5-flash",
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "I was unable to formulate a diagnostic reply. Let's look at your PulseIQ vitals together.";
      
      // Determine if a crisis is indicated (both by text analysis and severe vitals)
      let isCrisis = false;
      const lowerText = text.toLowerCase() + " " + (messages.length > 0 ? messages[messages.length - 1].text.toLowerCase() : "");
      if (
        lowerText.includes("emergency") || 
        lowerText.includes("hospital") || 
        lowerText.includes("suicide") || 
        lowerText.includes("die") || 
        lowerText.includes("panic attack") || 
        lowerText.includes("chest pain") || 
        lowerText.includes("kill myself") ||
        (currentTelemetry && (currentTelemetry.stressScore >= 95 || currentTelemetry.heartRate >= 140))
      ) {
        isCrisis = true;
      }

      res.json({ text, isCrisis });
    } catch (err: any) {
      console.error("Clinical Chat Error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Brain module processing error" });
    }
  });

  // API 4: Generate a Wellness Clinical report summarising trends of historical data
  app.post("/api/daily-report", async (req, res) => {
    try {
      const { history = [] } = req.body;
      
      const ai = getGeminiClient();
      const prompt = `
You are the clinical bio-statistician assistant of PulseIQ.
Analyze the following physiological record of multiple biometric readings logged by the user:
${JSON.stringify(history)}

Generate a highly-structured clinical summary of their metrics over time:
1. Identify high/low biological patterns (e.g., circadian dips in heart rate, peaks in stress during day).
2. Highlight POSITIVE habits/streaks (pros).
3. Warn about negative physiological triggers, signs of dehydration, elevated blood pressure, hypoxia, sleep loss, or excessive sedentary states (cons).
4. Give 3 actionable clinical hacks.
5. Determine general activityLevel rating ('low', 'moderate', 'active', 'highly active').

Output exact JSON matching this schema:
{
  "date": "Today's assessment",
  "summary": "Full clinical trend synthesis...",
  "pros": ["Pro point 1", "Pro point 2"],
  "cons": ["Risk point 1", "Risk point 2"],
  "suggestions": ["clinical action 1", "clinical action 2"],
  "activityLevel": "moderate"
}
`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert sports medicine doctor and longevity biostatistician. Offer precise, engaging, data-driven summaries.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              summary: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              activityLevel: { type: Type.STRING, description: "low, moderate, active, or highly active" }
            },
            required: ["date", "summary", "pros", "cons", "suggestions", "activityLevel"]
          }
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text.trim()));
    } catch (err: any) {
      console.error("Daily report synthesis error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Failed to compile custom medical trends report" });
    }
  });

  // API 5: Personalised engagement and wellness challenge generation
  app.post("/api/suggest-challenge", async (req, res) => {
    try {
      const { telemetry } = req.body;
      const ai = getGeminiClient();

      const prompt = `
Generate a single tailored microscopic physiological wellness challenge based on these biomeasures:
${JSON.stringify(telemetry)}

For example:
- High ML stress score -> Deep breathing (Box breathing for 3 minutes)
- Heart rate elevation -> Vagal nerve simulation (splash cold water on face)
- High light level -> Retreat to ambient or dark room (Eye strain relief)
- Low light level -> Open windows or turn on bright lights (Circadian reset)

Define:
- Title
- Description
- Difficulty (easy, medium, hard)
- Duration (minutes/duration)
- points rewarded (integer, e.g. 50, 100)
- metricType (heartRate, steps, stressLevel, sleepHours)
- Target goal value
`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a health gamification physician creating small, achievable biometric micro-challenges to lower load and increase user adherence.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, description: "easy, medium, or hard" },
              duration: { type: Type.STRING },
              points: { type: Type.INTEGER },
              metricType: { type: Type.STRING, description: "heartRate, lightLevel, stressScore" },
              target: { type: Type.NUMBER }
            },
            required: ["title", "description", "difficulty", "duration", "points", "metricType", "target"]
          }
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text.trim()));
    } catch (err: any) {
      console.error("Challenge suggest error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Failed to generate AI health engagement challenge" });
    }
  });

  // Vite middleware for dev or Static delivery for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // production static directory mapping
    const distPath = path.join(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PulseIQ Express-Vite Fullstack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
