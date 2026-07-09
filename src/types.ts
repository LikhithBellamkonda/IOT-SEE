/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PhysiologicalData {
  heartRate: number;         // bpm
  stressScore: number;       // 0 - 100
  lightLevel: number;        // lux / LDR reading
  temperature: number;       // Celsius
  humidity: number;          // %
  timestamp: string;         // ISO string
}

export type DiagnosticSeverity = 'optimal' | 'normal' | 'caution' | 'warning' | 'critical';

export interface MetricDiagnostic {
  value: number | string;
  status: DiagnosticSeverity;
  feedback: string;
  idealRange: string;
}

export interface MetricDiagnosticsConfig {
  heartRate: MetricDiagnostic;
  lightLevel: MetricDiagnostic;
  stressScore: MetricDiagnostic;
}

export interface FullDiagnosticReport {
  overallHealthScore: number;
  overallStatus: DiagnosticSeverity;
  timeRecorded: string;
  metrics: MetricDiagnosticsConfig;
  riskAssessments: {
    cardiovascular: { risk: 'low' | 'moderate' | 'high'; note: string };
    stressAndLoad: { risk: 'low' | 'moderate' | 'high'; note: string };
    environmental: { risk: 'low' | 'moderate' | 'high'; note: string };
  };
  recommendations: string[];
  clinicalNotes: string;
  urgencyAction: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isCrisis?: boolean;
}

export type AgentType = 'friend' | 'health_therapist' | 'crisis_analyser';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  metricType: 'heartRate' | 'lightLevel' | 'stressScore' | 'water';
  target: number;
  currentValue: number;
  isCompleted: boolean;
}

export interface DailyReport {
  date: string;
  summary: string;
  pros: string[];
  cons: string[];
  suggestions: string[];
  activityLevel: 'low' | 'moderate' | 'active' | 'highly active';
}
