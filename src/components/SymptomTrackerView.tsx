import { useState, FormEvent } from "react";
import { 
  FileText, 
  Calendar, 
  Activity, 
  CheckSquare, 
  Square, 
  Save, 
  Check, 
  Smile, 
  Frown, 
  AlertCircle 
} from "lucide-react";
import { SymptomLog } from "../types.js";

interface SymptomTrackerViewProps {
  symptomLogs: SymptomLog[];
  onSymptomSubmit: (data: Omit<SymptomLog, "id" | "userId" | "createdAt">) => Promise<SymptomLog>;
  token: string;
}

export function SymptomTrackerView({ symptomLogs, onSymptomSubmit }: SymptomTrackerViewProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [itchiness, setItchiness] = useState(3);
  const [pain, setPain] = useState(1);
  const [scaling, setScaling] = useState(2);
  const [redness, setRedness] = useState(2);
  const [sleepQuality, setSleepQuality] = useState(8);
  const [notes, setNotes] = useState("");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const triggerOptions = [
    "Stress",
    "Cold/Dry Weather",
    "Infection/Illness",
    "Skin Trauma (Koebner)",
    "Alcohol/Smoking",
    "Dietary Flares",
    "Medications",
    "Lack of Sleep",
    "Dehydration"
  ];

  const handleToggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await onSymptomSubmit({
        date,
        itchiness,
        pain,
        scaling,
        redness,
        sleepQuality,
        triggers: selectedTriggers,
        notes: notes.trim()
      });

      setSuccessMsg("Symptom log recorded successfully!");
      setNotes("");
      setSelectedTriggers([]);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit symptom record.");
    } finally {
      setSaving(false);
    }
  };

  const sortedLogs = [...symptomLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getSymptomVibe = (score: number) => {
    if (score <= 2) return { text: "Mild/Comfortable", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (score <= 5) return { text: "Moderate discomfort", color: "text-amber-600 bg-amber-50 border-amber-100" };
    return { text: "Severe flare-up", color: "text-red-600 bg-red-50 border-red-100" };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Logging Form */}
      <div className="lg:col-span-7">
        <form onSubmit={handleFormSubmit} className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2 space-y-6">
          <div>
            <h2 className="font-display text-sm font-bold text-gray-900">
              Record Today's Skin Condition
            </h2>
            <p className="text-xs text-gray-400">
              Chronicle daily itchiness, pain, scaling, sleep, and environmental triggers to discover patterns.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Date Selection */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Logging Date</label>
              <div className="relative rounded-xl border border-teal-50 bg-teal-50/20 px-3.5 py-2.5 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-xs text-teal-950 font-semibold focus:outline-none w-full"
                  required
                />
              </div>
            </div>

            {/* Itchiness slider */}
            <div className="space-y-1.5 p-4 rounded-xl bg-teal-50/10 border border-teal-50/50">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Itch Intensity</span>
                <span className="font-mono font-bold text-teal-700">{itchiness} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={itchiness}
                onChange={(e) => setItchiness(parseInt(e.target.value))}
                className="w-full accent-teal-600 h-1 bg-gray-100 rounded-full cursor-pointer"
              />
              <span className="block text-[9px] text-gray-400 font-medium">0: No itch at all • 10: Constant, distressing</span>
            </div>

            {/* Pain Slider */}
            <div className="space-y-1.5 p-4 rounded-xl bg-teal-50/10 border border-teal-50/50">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Skin Pain / Burning</span>
                <span className="font-mono font-bold text-teal-700">{pain} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={pain}
                onChange={(e) => setPain(parseInt(e.target.value))}
                className="w-full accent-teal-600 h-1 bg-gray-100 rounded-full cursor-pointer"
              />
              <span className="block text-[9px] text-gray-400 font-medium">0: No pain • 10: Intolerable soreness</span>
            </div>

            {/* Scaling slider */}
            <div className="space-y-1.5 p-4 rounded-xl bg-teal-50/10 border border-teal-50/50">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Dry Scaling Density</span>
                <span className="font-mono font-bold text-teal-700">{scaling} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={scaling}
                onChange={(e) => setScaling(parseInt(e.target.value))}
                className="w-full accent-teal-600 h-1 bg-gray-100 rounded-full cursor-pointer"
              />
              <span className="block text-[9px] text-gray-400 font-medium">0: Smooth skin • 10: Deep silvery plaque flaking</span>
            </div>

            {/* Redness slider */}
            <div className="space-y-1.5 p-4 rounded-xl bg-teal-50/10 border border-teal-50/50">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Inflammation / Redness</span>
                <span className="font-mono font-bold text-teal-700">{redness} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={redness}
                onChange={(e) => setRedness(parseInt(e.target.value))}
                className="w-full accent-teal-600 h-1 bg-gray-100 rounded-full cursor-pointer"
              />
              <span className="block text-[9px] text-gray-400 font-medium">0: Normal skin tone • 10: Highly angry crimson</span>
            </div>

            {/* Sleep Quality slider */}
            <div className="space-y-1.5 p-4 rounded-xl bg-teal-50/10 border border-teal-50/50 sm:col-span-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Sleep Quality (due to discomfort)</span>
                <span className="font-mono font-bold text-teal-700">{sleepQuality} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                className="w-full accent-teal-600 h-1 bg-gray-100 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                <span className="flex items-center gap-0.5"><Frown className="h-3 w-3" /> 0: Interrupted constantly</span>
                <span className="flex items-center gap-0.5">10: Fully restful, deep <Smile className="h-3 w-3" /></span>
              </div>
            </div>
          </div>

          {/* Trigger list checkboxes */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-teal-600" />
              Environmental Triggers Observed
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {triggerOptions.map((trigger) => {
                const isSelected = selectedTriggers.includes(trigger);
                return (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => handleToggleTrigger(trigger)}
                    className={`flex items-center gap-2 border rounded-xl p-2.5 text-left text-xs transition active:scale-95 ${
                      isSelected 
                        ? "border-teal-500 bg-teal-50/50 text-teal-950 font-bold" 
                        : "border-teal-50 bg-white hover:border-teal-100 text-gray-500"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-teal-600 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-300 shrink-0" />
                    )}
                    <span className="truncate">{trigger}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Qualitative Clinical Notes</label>
            <textarea
              placeholder="e.g. Cleared scaling with coal-tar ointment. Applied topical steroid on elbow patches. Feeling slightly anxious today."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-teal-100/60 bg-teal-50/5 p-3 text-xs text-teal-950 placeholder-gray-400 focus:outline-none focus:border-teal-500 min-h-[100px] leading-relaxed"
            />
          </div>

          {/* Error and Success message */}
          {successMsg && (
            <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700 font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider py-3 transition disabled:opacity-50 shadow-md shadow-teal-600/10"
          >
            <Save className="h-4 w-4" />
            {saving ? "Recording Daily Logs..." : "Submit Daily Logs"}
          </button>
        </form>
      </div>

      {/* Right Column: Historical Logs */}
      <div className="lg:col-span-5">
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2 space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold text-gray-900">
              Symptom History Feed
            </h3>
            <p className="text-xs text-gray-400">
              Timeline of logged skin conditions and comfort levels.
            </p>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {sortedLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-teal-50 p-4 space-y-3 hover:border-teal-200 transition bg-teal-50/5">
                <div className="flex justify-between items-center border-b border-teal-50/40 pb-2">
                  <span className="font-bold text-xs text-teal-950 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-teal-500" />
                    {new Date(log.date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase font-mono border ${getSymptomVibe(log.itchiness).color}`}>
                    {getSymptomVibe(log.itchiness).text}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 font-medium">
                  <div>Itch Intensity: <strong className="text-teal-950 font-bold">{log.itchiness} / 10</strong></div>
                  <div>Symptom Pain: <strong className="text-teal-950 font-bold">{log.pain} / 10</strong></div>
                  <div>Scaling Plaque: <strong className="text-teal-950 font-bold">{log.scaling} / 10</strong></div>
                  <div>Inflammation: <strong className="text-teal-950 font-bold">{log.redness} / 10</strong></div>
                  <div className="col-span-2">Sleep Comfort Quality: <strong className="text-teal-950 font-bold">{log.sleepQuality} / 10</strong></div>
                </div>

                {log.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {log.triggers.map((t) => (
                      <span key={t} className="inline-block rounded bg-red-50 text-red-700 font-bold px-1.5 py-0.5 text-[8px] uppercase border border-red-100">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {log.notes && (
                  <p className="text-[10px] text-gray-500 italic bg-white border border-teal-50 rounded-lg p-2.5 leading-relaxed">
                    "{log.notes}"
                  </p>
                )}
              </div>
            ))}
            {sortedLogs.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-12 font-medium">No previous daily logs cataloged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
