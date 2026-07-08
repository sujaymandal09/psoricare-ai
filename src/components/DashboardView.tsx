import { useState } from "react";
import { 
  Camera, 
  Calculator, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  Heart, 
  Activity, 
  Plus, 
  Sparkles,
  Calendar,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { SkinAnalysis, PasiScore, SymptomLog } from "../types.js";

interface DashboardViewProps {
  analyses: SkinAnalysis[];
  pasiScores: PasiScore[];
  symptomLogs: SymptomLog[];
  onNavigate: (view: string) => void;
}

export function DashboardView({ analyses, pasiScores, symptomLogs, onNavigate }: DashboardViewProps) {
  // Sort history by date descending
  const sortedAnalyses = [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedPasi = [...pasiScores].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedSymptoms = [...symptomLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get current status items
  const latestPasi = sortedPasi[0];
  const latestAnalysis = sortedAnalyses[0];
  const latestSymptom = sortedSymptoms[0];

  // Calculate average symptom itchiness
  const avgItchiness = symptomLogs.length > 0 
    ? (symptomLogs.reduce((sum, log) => sum + log.itchiness, 0) / symptomLogs.length).toFixed(1) 
    : "0.0";

  // Check PASI change (latest vs previous)
  const pasiChange = pasiScores.length >= 2 
    ? (pasiScores[0].score - pasiScores[1].score).toFixed(1)
    : null;

  // Prepare PASI chart data (reverse chronological for chronological charts)
  const pasiChartData = [...pasiScores]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(p => ({
      date: new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      Score: p.score
    }));

  // Prepare symptoms chart data
  const symptomsChartData = [...symptomLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7) // Last 7 logs
    .map(log => ({
      date: new Date(log.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      Itchiness: log.itchiness,
      Redness: log.redness,
      Scaling: log.scaling,
      Pain: log.pain
    }));

  // Common triggers count in historical logs
  const triggersMap: { [key: string]: number } = {};
  symptomLogs.forEach(log => {
    log.triggers.forEach(t => {
      triggersMap[t] = (triggersMap[t] || 0) + 1;
    });
  });
  const commonTriggers = Object.entries(triggersMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Clinician Welcome Banner */}
      <div className="rounded-3xl bg-teal-900 text-white p-6 md:p-8 relative overflow-hidden shadow-xl shadow-teal-950/10 border border-teal-800">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none mr-4">
          <Heart className="h-64 w-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200">
            <Activity className="h-3 w-3" />
            Clinical Status: Active
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Your Psoriasis Management Dashboard
          </h1>
          <p className="text-teal-100/90 text-sm leading-relaxed">
            Track visual lesion clearing progress, calculate PASI severity logs, record environmental flares, and chat with PsoriCare AI specialists.
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("analysis")}
              className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 transition duration-150 active:scale-95 shadow-md shadow-teal-500/10"
            >
              <Camera className="h-4 w-4" />
              Screen Skin Lesion
            </button>
            <button
              onClick={() => onNavigate("symptoms")}
              className="flex items-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white border border-teal-700 font-bold text-xs uppercase tracking-wider py-3 px-5 transition duration-150 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Log Daily Symptoms
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Latest PASI score */}
        <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest PASI Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Calculator className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <p className="font-display text-3xl font-extrabold text-gray-900 tracking-tight">
                {latestPasi ? latestPasi.score : "N/A"}
              </p>
              {latestPasi && (
                <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  latestPasi.score < 10 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : latestPasi.score < 20 
                    ? "bg-amber-50 text-amber-700 border border-amber-100" 
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  {latestPasi.score < 10 ? "Mild" : latestPasi.score < 20 ? "Moderate" : "Severe"}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {latestPasi ? (
                <>
                  Assessed on {new Date(latestPasi.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {pasiChange !== null && (
                    <span className={`inline-flex items-center gap-0.5 ml-2 font-bold ${Number(pasiChange) <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {Number(pasiChange) <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {Math.abs(Number(pasiChange))}
                    </span>
                  )}
                </>
              ) : (
                "No calculator entries yet"
              )}
            </p>
          </div>
        </div>

        {/* Latest AI Screening */}
        <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Classification</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display text-lg font-black text-teal-900 tracking-tight truncate" title={latestAnalysis?.result?.diagnosis}>
              {latestAnalysis?.result ? latestAnalysis.result.diagnosis : "None Screened"}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {latestAnalysis?.result ? (
                <>
                  Confidence: <strong className="text-teal-600">{latestAnalysis.result.confidence}%</strong> ({latestAnalysis.result.severity} severity)
                </>
              ) : (
                "Upload a skin patch to analyze"
              )}
            </p>
          </div>
        </div>

        {/* Average Itchiness */}
        <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Itch Intensity</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-extrabold text-gray-900 tracking-tight">
              {avgItchiness} <span className="text-xs text-gray-400 font-medium font-sans">/ 10</span>
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {latestSymptom ? (
                <>
                  Latest: Itch {latestSymptom.itchiness}/10, Pain {latestSymptom.pain}/10
                </>
              ) : (
                "No symptom entries logged"
              )}
            </p>
          </div>
        </div>

        {/* Active Triggers */}
        <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Flare Triggers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            {commonTriggers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {commonTriggers.map(([trigger, count]) => (
                  <span key={trigger} className="inline-block rounded bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 text-[9px] uppercase border border-teal-100">
                    {trigger} ({count}x)
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Log symptoms to discover active flare triggers.
              </p>
            )}
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Total logs: {symptomLogs.length} days recorded
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Progress Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* PASI Index Progression Trend */}
        <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-sm font-bold text-gray-900">PASI Severity Trend</h3>
              <p className="text-[11px] text-gray-400">Progression of PASI index score over time</p>
            </div>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 font-mono text-[9px] font-bold text-teal-600 border border-teal-100">
              Score History
            </span>
          </div>
          <div className="h-64 w-full">
            {pasiChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pasiChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "11px" }}
                    itemStyle={{ color: "#ffffff", fontSize: "12px" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Score" 
                    stroke="#0d9488" 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#0d9488" }} 
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-teal-100 rounded-xl bg-teal-50/10">
                <Calculator className="h-8 w-8 text-teal-300 mb-2" />
                <p className="text-xs font-bold text-teal-800">No PASI Record Found</p>
                <p className="text-[10px] text-gray-400 mt-1">Complete a clinical area calculation in the PASI tab to render this trend graph.</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Symptom Intensity chart */}
        <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-sm font-bold text-gray-900">Symptom Intensity Tracking</h3>
              <p className="text-[11px] text-gray-400">Severity metrics for itching, scaling, and inflammation</p>
            </div>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 font-mono text-[9px] font-bold text-teal-600 border border-teal-100">
              Weekly Logs
            </span>
          </div>
          <div className="h-64 w-full">
            {symptomsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={symptomsChartData}>
                  <defs>
                    <linearGradient id="colorItch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRedness" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "11px" }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                  <Area type="monotone" dataKey="Itchiness" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorItch)" />
                  <Area type="monotone" dataKey="Redness" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRedness)" />
                  <Area type="monotone" dataKey="Scaling" stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-teal-100 rounded-xl bg-teal-50/10">
                <FileText className="h-8 w-8 text-teal-300 mb-2" />
                <p className="text-xs font-bold text-teal-800">No Daily Symptom Logs</p>
                <p className="text-[10px] text-gray-400 mt-1">Record your daily skin condition in the Symptom Logger to construct this intensity map.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent AI Lesion Screenings History */}
      <div className="rounded-2xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-sm font-bold text-gray-900">Recent Skin Screenings</h3>
            <p className="text-[11px] text-gray-400">Your latest AI-assisted dermatological visual classifications</p>
          </div>
          <button
            onClick={() => onNavigate("analysis")}
            className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
          >
            Open Screen Panel
            <Camera className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-teal-50 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">AI Diagnosis</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Visual Severity</th>
                <th className="py-3 px-4">Psoriasis Indicators (0-4)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnalyses.slice(0, 3).map((anl) => (
                <tr key={anl.id} className="border-b border-teal-50/50 hover:bg-teal-50/10 transition">
                  <td className="py-3.5 px-4 font-medium text-gray-600">
                    {new Date(anl.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-teal-950">{anl.result?.diagnosis}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-teal-600">{anl.result?.confidence}%</span>
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${anl.result?.confidence}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block rounded px-2 py-0.5 font-bold uppercase tracking-wider text-[9px] ${
                      anl.result?.severity === 'mild' || anl.result?.severity === 'none'
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : anl.result?.severity === 'moderate'
                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {anl.result?.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <span>Redness: <strong>{anl.result?.erythema}</strong></span>
                      <span>Thickness: <strong>{anl.result?.induration}</strong></span>
                      <span>Scaling: <strong>{anl.result?.desquamation}</strong></span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-700 border border-emerald-100">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
              {sortedAnalyses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                    No skin screening logs found. Snap your first picture to start!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
