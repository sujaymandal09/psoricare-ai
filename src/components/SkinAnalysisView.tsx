import { useState, DragEvent, ChangeEvent } from "react";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SkinAnalysis } from "../types.js";

interface SkinAnalysisViewProps {
  analyses: SkinAnalysis[];
  onAnalysisSubmit: (imageBase64: string) => Promise<SkinAnalysis>;
  token: string;
}

const compressAndResizeImage = (base64Str: string, maxDim = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export function SkinAnalysisView({ analyses, onAnalysisSubmit }: SkinAnalysisViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  // Sorting analyses to show latest first
  const sortedHistory = [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeAnalysis = selectedAnalysisId 
    ? analyses.find(a => a.id === selectedAnalysisId) 
    : sortedHistory[0];

  const handleImageConversion = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Invalid file type. Please select a JPEG or PNG image.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 8MB. Please compress the file and retry.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressed = await compressAndResizeImage(rawBase64);
        setSelectedImage(compressed);
        setErrorMsg("");
      } catch (e) {
        setSelectedImage(rawBase64);
        setErrorMsg("");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageConversion(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageConversion(e.target.files[0]);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setErrorMsg("");
  };

  const triggerStepInterval = (intervalId: NodeJS.Timeout | null = null) => {
    let step = 0;
    const steps = [
      "Contacting secure clinical endpoint...",
      "Preprocessing skin tissue pixels...",
      "Detecting plaque boundaries & scaling layers...",
      "Grading erythema redness intensity...",
      "Evaluating plaque induration thickness...",
      "Formulating medical recommendations..."
    ];

    const timer = setInterval(() => {
      step++;
      if (step < steps.length) {
        setLoadingStep(step);
      } else {
        clearInterval(timer);
      }
    }, 1200);

    return timer;
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setLoadingStep(0);
    setErrorMsg("");

    const stepTimer = triggerStepInterval();

    try {
      const result = await onAnalysisSubmit(selectedImage);
      setSelectedAnalysisId(result.id);
      setSelectedImage(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Skin screening failed. Please verify your internet connection and make sure your server API key is configured.");
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  };

  const renderRatingBar = (label: string, value: number | null | undefined, colorClass: string) => {
    if (value === null || value === undefined) {
      return (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-700">{label}</span>
            <span className="font-mono font-bold text-gray-400">Not scored by this model</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-100" />
        </div>
      );
    }

    const ticks = [0, 1, 2, 3, 4];
    const labels = ["None", "Mild", "Moderate", "Severe", "Very Severe"];

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-gray-700">{label}</span>
          <span className="font-mono font-bold text-teal-700">{value} / 4 ({labels[value]})</span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden border border-gray-100 p-0.5">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} 
              style={{ width: `${(value / 4) * 100}%` }} 
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono font-bold text-gray-400 mt-1 px-1">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        </div>
      </div>
    );
  };

  const loadingSteps = [
    "Contacting secure clinical endpoint...",
    "Preprocessing skin tissue pixels...",
    "Detecting plaque boundaries & scaling layers...",
    "Grading erythema redness intensity...",
    "Evaluating plaque induration thickness...",
    "Formulating medical recommendations..."
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Image Selection and Previous Screening Archives */}
      <div className="lg:col-span-5 space-y-6">
        {/* Upload Container */}
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2">
          <h2 className="font-display text-sm font-bold text-gray-900 mb-1.5">
            Submit New Skin Assessment
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Upload a clear, high-resolution photo of the active skin patch in neutral lighting.
          </p>

          <AnimatePresence mode="wait">
            {!selectedImage ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("skin-file-input")?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  isDragging 
                    ? "border-teal-500 bg-teal-50/30" 
                    : "border-teal-100 bg-teal-50/5 hover:border-teal-400 hover:bg-teal-50/20"
                }`}
              >
                <input 
                  type="file" 
                  id="skin-file-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={onFileChange} 
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-950">Drag & drop your skin photo here</p>
                    <p className="text-[10px] text-gray-400 mt-1">or click to browse local files (PNG, JPG up to 8MB)</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative rounded-2xl overflow-hidden border border-teal-100 max-h-[250px] flex items-center justify-center bg-slate-50">
                  <img 
                    src={selectedImage} 
                    alt="Skin patch preview" 
                    className="w-full h-full object-cover max-h-[250px]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                </div>

                {errorMsg && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleClearImage}
                    disabled={loading}
                    className="rounded-xl border border-teal-100 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-50 active:scale-95 transition disabled:opacity-50"
                  >
                    Clear Photo
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-teal-600/10 hover:bg-teal-700 active:scale-95 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Screening...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze AI
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading details */}
          {loading && (
            <div className="mt-4 rounded-xl bg-teal-50 border border-teal-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-widest animate-pulse">Running Skin AI Analyzer</span>
                <span className="font-mono text-[10px] font-bold text-teal-700">{Math.round(((loadingStep + 1) / 6) * 100)}%</span>
              </div>
              <div className="w-full bg-teal-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${((loadingStep + 1) / 6) * 100}%` }} 
                />
              </div>
              <p className="text-[10px] text-teal-900 font-bold font-mono">
                → {loadingSteps[loadingStep]}
              </p>
            </div>
          )}
        </div>

        {/* Screening History List */}
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2">
          <h2 className="font-display text-sm font-bold text-gray-900 mb-1.5">
            Assessed Skin Logs
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Browse through your previous AI screenings to inspect historical clearing rates.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {sortedHistory.map((anl) => {
              const isActive = activeAnalysis?.id === anl.id;
              return (
                <button
                  key={anl.id}
                  onClick={() => setSelectedAnalysisId(anl.id)}
                  className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition ${
                    isActive 
                      ? "border-teal-500 bg-teal-50/30" 
                      : "border-teal-50 hover:border-teal-200 hover:bg-teal-50/10"
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-teal-50 flex items-center justify-center">
                    {anl.imageUrl.startsWith("data:") ? (
                      <img src={anl.imageUrl} alt="lesion" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-4.5 w-4.5 text-teal-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{anl.result?.diagnosis}</p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                      <span>{new Date(anl.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      <span>•</span>
                      <span className="font-bold text-teal-600">Conf: {anl.result?.confidence}%</span>
                    </p>
                  </div>
                  <div className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                    anl.result?.severity?.includes("severe")
                      ? "bg-red-50 text-red-700 border border-red-100" 
                      : anl.result?.severity?.includes("moderate")
                      ? "bg-amber-50 text-amber-700 border border-amber-100" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {anl.result?.severity}
                  </div>
                </button>
              );
            })}
            {sortedHistory.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-8 font-medium">No previous screenings on record.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Active Assessment Detailed Reports */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {activeAnalysis ? (
            <motion.div
              key={activeAnalysis.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Report Header Card */}
              <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-50 pb-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-widest">Visual Assessment Report</p>
                    <h1 className="font-display text-xl font-black text-teal-950 mt-1">
                      {activeAnalysis.result?.diagnosis}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3 text-teal-500" />
                        Screened: {new Date(activeAnalysis.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-teal-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" />
                        AI Confidence: {activeAnalysis.result?.confidence}%
                      </span>
                    </div>
                  </div>

                  <span className={`rounded-xl px-3 py-1 font-extrabold uppercase text-xs border tracking-wider shadow-sm ${
                    activeAnalysis.result?.severity?.includes('severe')
                      ? "bg-red-50 text-red-700 border-red-100"
                      : activeAnalysis.result?.severity?.includes('moderate')
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}>
                    {activeAnalysis.result?.severity} severity
                  </span>
                </div>

                {/* Sub Lesion Image Preview */}
                {activeAnalysis.imageUrl && activeAnalysis.imageUrl.startsWith("data:") && (
                  <div className="mt-5 rounded-2xl overflow-hidden border border-teal-50/50 max-h-[220px] flex items-center justify-center bg-slate-50">
                    <img src={activeAnalysis.imageUrl} alt="Report original" className="w-full object-cover max-h-[220px]" />
                  </div>
                )}

                {/* Severity Breakdown ratings */}
                <div className="mt-6 space-y-4">
                  <h3 className="font-display text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-teal-600" />
                    Physical Psoriasis Severity Markers
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {activeAnalysis.result && renderRatingBar("Erythema (Redness)", activeAnalysis.result.erythema, "bg-red-500")}
                    {activeAnalysis.result && renderRatingBar("Induration (Thickness)", activeAnalysis.result.induration, "bg-amber-500")}
                    {activeAnalysis.result && renderRatingBar("Desquamation (Scaling)", activeAnalysis.result.desquamation, "bg-sky-500")}
                  </div>
                </div>

                {/* Visual description */}
                <div className="mt-8 pt-5 border-t border-teal-50 space-y-2">
                  <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Clinical Visual Inspection</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {activeAnalysis.result?.description}
                  </p>
                </div>
              </div>

              {/* Suggestions Card */}
              <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2 space-y-4">
                <h3 className="font-display text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-teal-500 fill-teal-50" />
                  Dermatological Care Suggestions
                </h3>
                <ul className="grid gap-3 text-xs text-gray-600 sm:grid-cols-2">
                  {activeAnalysis.result?.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-teal-50/20 rounded-xl p-3 border border-teal-50/50">
                      <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5 text-teal-700 font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer Alert Box */}
              <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/10 p-5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-teal-950">AI Automated Screener Disclaimer</p>
                  <p className="text-[10px] text-teal-800 leading-relaxed">
                    {activeAnalysis.result?.disclaimer}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/5 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-500 mb-4 shadow-sm">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-teal-950">Select or Submit a Skin Screening</p>
              <p className="text-xs text-gray-400 mt-1.5 max-w-sm leading-relaxed">
                Click on a historical screening record from the sidebar, or snap a new image to let the Gemini model analyze visual psoriasis characteristics.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
