import { useState } from "react";
import { 
  Calculator, 
  Layers, 
  Sparkles, 
  TrendingDown, 
  Heart, 
  HelpCircle, 
  Save, 
  Check, 
  Trash,
  Calendar,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PasiScore } from "../types.js";

interface PasiCalculatorViewProps {
  pasiScores: PasiScore[];
  onCalculateSubmit: (score: number, breakdown: any) => Promise<PasiScore>;
  token: string;
}

interface RegionValues {
  erythema: number;
  induration: number;
  desquamation: number;
  area: number;
}

export function PasiCalculatorView({ pasiScores, onCalculateSubmit }: PasiCalculatorViewProps) {
  // Region values state
  const [regions, setRegions] = useState<{ [key: string]: RegionValues }>({
    head: { erythema: 0, induration: 0, desquamation: 0, area: 0 },
    arms: { erythema: 0, induration: 0, desquamation: 0, area: 0 },
    trunk: { erythema: 0, induration: 0, desquamation: 0, area: 0 },
    legs: { erythema: 0, induration: 0, desquamation: 0, area: 0 }
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  const regionNames: { [key: string]: string } = {
    head: "Head & Neck (10% weight)",
    arms: "Upper Extremities (20% weight)",
    trunk: "Trunk / Torso (30% weight)",
    legs: "Lower Extremities (40% weight)"
  };

  const regionWeights: { [key: string]: number } = {
    head: 0.1,
    arms: 0.2,
    trunk: 0.3,
    legs: 0.4
  };

  const areaLabels = [
    "0: 0% involvement",
    "1: <10% area",
    "2: 10% - 29% area",
    "3: 30% - 49% area",
    "4: 50% - 69% area",
    "5: 70% - 89% area",
    "6: 90% - 100% area"
  ];

  const symptomLabels = [
    "0: None",
    "1: Mild",
    "2: Moderate",
    "3: Severe",
    "4: Very Severe"
  ];

  // Calculations
  const headSubtotal = (regions.head.erythema + regions.head.induration + regions.head.desquamation) * regions.head.area * regionWeights.head;
  const armsSubtotal = (regions.arms.erythema + regions.arms.induration + regions.arms.desquamation) * regions.arms.area * regionWeights.arms;
  const trunkSubtotal = (regions.trunk.erythema + regions.trunk.induration + regions.trunk.desquamation) * regions.trunk.area * regionWeights.trunk;
  const legsSubtotal = (regions.legs.erythema + regions.legs.induration + regions.legs.desquamation) * regions.legs.area * regionWeights.legs;

  const totalScore = parseFloat((headSubtotal + armsSubtotal + trunkSubtotal + legsSubtotal).toFixed(1));

  const handleSliderChange = (regionKey: string, symptomKey: keyof RegionValues, value: number) => {
    setRegions(prev => ({
      ...prev,
      [regionKey]: {
        ...prev[regionKey],
        [symptomKey]: value
      }
    }));
  };

  const handleSaveScore = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const breakdown = {
      head: { ...regions.head, subtotal: parseFloat(headSubtotal.toFixed(2)) },
      arms: { ...regions.arms, subtotal: parseFloat(armsSubtotal.toFixed(2)) },
      trunk: { ...regions.trunk, subtotal: parseFloat(trunkSubtotal.toFixed(2)) },
      legs: { ...regions.legs, subtotal: parseFloat(legsSubtotal.toFixed(2)) }
    };

    try {
      await onCalculateSubmit(totalScore, breakdown);
      setSuccessMsg("PASI Score saved successfully to clinical history!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to persist score to database.");
    } finally {
      setSaving(false);
    }
  };

  const sortedHistory = [...pasiScores].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getPasiSeverity = (score: number) => {
    if (score === 0) return { label: "Clear", color: "bg-teal-50 text-teal-700 border-teal-100" };
    if (score < 10) return { label: "Mild Severity", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    if (score < 20) return { label: "Moderate Severity", color: "bg-amber-50 text-amber-700 border-amber-100" };
    return { label: "Severe Psoriasis", color: "bg-red-50 text-red-700 border border-red-100" };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Input Panel */}
      <div className="lg:col-span-8 space-y-6">
        {/* Region Calculators */}
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h2 className="font-display text-sm font-bold text-gray-900">
                Plaque Character Grading Panel
              </h2>
              <p className="text-xs text-gray-400">
                Grade the erythema (redness), induration (thickness), scaling, and area of involvement for each anatomical zone.
              </p>
            </div>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1.5 text-xs text-teal-600 font-bold hover:text-teal-700 transition"
            >
              <HelpCircle className="h-4 w-4" />
              What is PASI?
            </button>
          </div>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4 rounded-xl border border-teal-100 bg-teal-50/20 p-4 text-xs text-teal-900 leading-relaxed space-y-2"
              >
                <p>
                  The <strong>Psoriasis Area and Severity Index (PASI)</strong> is the standard clinical tool used by dermatologists globally to record the severity and coverage of psoriasis plaques.
                </p>
                <p>
                  For each of the four physical zones (Head, Arms, Trunk, Legs), plaques are scored from <strong>0 (none) to 4 (very severe)</strong> on three diagnostic attributes:
                </p>
                <ul className="list-disc list-inside space-y-1 font-semibold pl-2">
                  <li>Erythema: The severity of the skin redness.</li>
                  <li>Induration: Plaque thickness or elevated skin layers.</li>
                  <li>Desquamation: The density of silvery dry scaling.</li>
                </ul>
                <p>
                  Then, the area of psoriasis plaque coverage in that specific zone is graded from <strong>0 (0%) to 6 (90-100%)</strong>. The final score ranges from <strong>0.0 to 72.0</strong>, tracking your clinical baseline over time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Region Tabs */}
          <div className="space-y-6">
            {Object.keys(regionNames).map((key) => (
              <div key={key} className="p-4 rounded-2xl bg-teal-50/10 border border-teal-50/50 space-y-4">
                <div className="flex justify-between items-center border-b border-teal-50/60 pb-2">
                  <span className="font-display text-xs font-bold text-teal-950 capitalize">{key} Region</span>
                  <span className="font-mono text-[10px] font-bold text-teal-600 bg-teal-50/50 px-2 py-0.5 rounded">
                    Weight multiplier: {regionWeights[key] * 100}%
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Left elements: Symptom Scores */}
                  <div className="space-y-4">
                    {/* Erythema */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">Erythema (Redness)</span>
                        <span className="font-mono font-bold text-teal-800">{symptomLabels[regions[key].erythema]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={regions[key].erythema}
                        onChange={(e) => handleSliderChange(key, "erythema", parseInt(e.target.value))}
                        className="w-full accent-teal-600 h-1.5 bg-gray-100 rounded-full cursor-pointer"
                      />
                    </div>

                    {/* Induration */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">Induration (Thickness)</span>
                        <span className="font-mono font-bold text-teal-800">{symptomLabels[regions[key].induration]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={regions[key].induration}
                        onChange={(e) => handleSliderChange(key, "induration", parseInt(e.target.value))}
                        className="w-full accent-teal-600 h-1.5 bg-gray-100 rounded-full cursor-pointer"
                      />
                    </div>

                    {/* Desquamation */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">Desquamation (Scaling)</span>
                        <span className="font-mono font-bold text-teal-800">{symptomLabels[regions[key].desquamation]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={regions[key].desquamation}
                        onChange={(e) => handleSliderChange(key, "desquamation", parseInt(e.target.value))}
                        className="w-full accent-teal-600 h-1.5 bg-gray-100 rounded-full cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Right elements: Area Percentage */}
                  <div className="flex flex-col justify-center bg-white p-3 rounded-xl border border-teal-50">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-700 font-bold">Plaque Coverage Area</span>
                      <span className="font-mono font-black text-teal-700">{areaLabels[regions[key].area]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={regions[key].area}
                      onChange={(e) => handleSliderChange(key, "area", parseInt(e.target.value))}
                      className="w-full accent-teal-600 h-1.5 bg-teal-50 rounded-full cursor-pointer"
                    />
                    <div className="grid grid-cols-7 text-[8px] font-mono text-gray-400 mt-2 text-center font-bold">
                      <span>0%</span>
                      <span>&lt;10%</span>
                      <span>10-29%</span>
                      <span>30-49%</span>
                      <span>50-69%</span>
                      <span>70-89%</span>
                      <span>90%+</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Live Calculated Breakdown Score and History */}
      <div className="lg:col-span-4 space-y-6">
        {/* Live Indicator Score */}
        <div className="rounded-3xl border border-teal-50 bg-teal-950 text-white p-6 shadow-xl shadow-teal-950/10 space-y-6 relative overflow-hidden">
          {/* Subtle background overlay */}
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-teal-900/30 -mr-4 -mt-4 pointer-events-none" />

          <div>
            <p className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest">Calculated Realtime PASI Score</p>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="font-display text-5xl font-black tracking-tight">{totalScore.toFixed(1)}</span>
              <span className="text-xs text-teal-300 font-semibold font-mono">/ 72.0 max</span>
            </div>
          </div>

          {/* Regional subtotals list */}
          <div className="space-y-2 border-t border-teal-800/60 pt-4 text-xs font-mono">
            <div className="flex justify-between text-teal-300/80">
              <span>Head subtotal:</span>
              <span className="font-bold text-white">{headSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-teal-300/80">
              <span>Arms subtotal:</span>
              <span className="font-bold text-white">{armsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-teal-300/80">
              <span>Trunk subtotal:</span>
              <span className="font-bold text-white">{trunkSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-teal-300/80">
              <span>Legs subtotal:</span>
              <span className="font-bold text-white">{legsSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Severity indicator block */}
          <div className="rounded-xl bg-teal-900/40 border border-teal-800/80 p-3 flex justify-between items-center">
            <span className="text-[10px] font-semibold text-teal-200">Severity Assessment:</span>
            <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase font-mono ${getPasiSeverity(totalScore).color}`}>
              {getPasiSeverity(totalScore).label}
            </span>
          </div>

          {/* Save trigger */}
          <div className="space-y-3">
            {successMsg && (
              <div className="rounded-lg bg-teal-900 border border-teal-700 p-3 text-xs text-teal-200 font-semibold">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-red-900 border border-red-700 p-3 text-xs text-red-200 font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleSaveScore}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-white font-bold text-xs uppercase tracking-wider py-3 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving Log..." : "Save Calculation to Logs"}
            </button>
          </div>
        </div>

        {/* History Panel */}
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2">
          <h3 className="font-display text-sm font-bold text-gray-900 mb-1.5">
            Calculation Archive
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Track historical index calculations over the course of your therapy.
          </p>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {sortedHistory.map((h) => (
              <div key={h.id} className="rounded-xl border border-teal-50 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-teal-950 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-teal-500" />
                    {new Date(h.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${getPasiSeverity(h.score).color}`}>
                    {getPasiSeverity(h.score).label}
                  </span>
                </div>
                <div className="flex justify-between items-baseline font-mono">
                  <span className="text-[10px] text-gray-400">PASI Total Index:</span>
                  <span className="text-sm font-black text-teal-900">{h.score.toFixed(1)}</span>
                </div>
              </div>
            ))}
            {sortedHistory.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-6">No historical records on file.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
