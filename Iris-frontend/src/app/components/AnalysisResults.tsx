import { motion } from "motion/react";
import { AlertCircle, CheckCircle, FileDown, RotateCcw, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { IrisAnalysisResult } from "../utils/api";

interface AnalysisResultsProps {
  mlResult: IrisAnalysisResult;
  onNewAnalysis?: () => void;
  onExportPDF?: () => void;
}

// Human-friendly colour labels + tailwind colour classes
const COLOUR_META: Record<string, { label: string; swatch: string }> = {
  dark_brown: { label: "Dark Brown", swatch: "bg-amber-950" },
  brown: { label: "Brown", swatch: "bg-amber-800" },
  light_brown: { label: "Light Brown", swatch: "bg-amber-500" },
  hazel: { label: "Hazel", swatch: "bg-lime-700" },
};

export function AnalysisResults({ mlResult, onNewAnalysis, onExportPDF }: AnalysisResultsProps) {
  const { iris_colour, abnormality } = mlResult;

  const colourMeta = COLOUR_META[iris_colour.predicted_class] ?? {
    label: iris_colour.predicted_class,
    swatch: "bg-slate-400",
  };

  // Build probability rows (sorted highest first)
  const colourProbs = Object.entries(iris_colour.probabilities).sort(
    ([, a], [, b]) => b - a
  );

  const colourConfPct = Math.round(iris_colour.confidence * 100);
  const abnConfPct = Math.round(abnormality.confidence * 100);
  const isAbnormal = abnormality.is_abnormal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ─── Main Result Card ───────────────────────────────────────────── */}
      <Card className={`border-2 ${isAbnormal ? "border-red-500 bg-gradient-to-br from-red-50 to-white" : "border-blue-500 bg-gradient-to-br from-blue-50 to-white"}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Prediction Results</CardTitle>
              <CardDescription>AI-powered iris colour &amp; abnormality analysis</CardDescription>
            </div>
            <div className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${isAbnormal ? "bg-red-500" : "bg-blue-500"}`}>
              Analysis Complete
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Iris Colour Result */}
            <div className="flex items-center justify-between p-6 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Iris Colour</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-4 h-4 rounded-full ${colourMeta.swatch} inline-block`} />
                    <h3 className="text-2xl font-bold text-slate-900">{colourMeta.label}</h3>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 font-medium">Confidence</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-bold text-blue-500">{colourConfPct}</span>
                  <span className="text-xl text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Abnormality Result */}
            <div className={`flex items-center justify-between p-6 bg-white rounded-lg border-2 ${isAbnormal ? "border-red-200" : "border-green-200"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isAbnormal ? "bg-red-100" : "bg-green-100"}`}>
                  {isAbnormal
                    ? <AlertCircle className="w-8 h-8 text-red-500" />
                    : <CheckCircle className="w-8 h-8 text-green-500" />}
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Eye Status</p>
                  <h3 className={`text-2xl font-bold mt-1 ${isAbnormal ? "text-red-700" : "text-green-700"}`}>
                    {isAbnormal ? "⚠ Abnormal" : "✓ Normal"}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 font-medium">Confidence</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-4xl font-bold ${isAbnormal ? "text-red-500" : "text-green-500"}`}>{abnConfPct}</span>
                  <span className="text-xl text-slate-400">%</span>
                </div>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${isAbnormal ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                  {isAbnormal ? "High Risk" : "Low Risk"}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              <span className="font-bold">Summary: </span>{mlResult.summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Colour Probabilities ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Iris Colour Probabilities</CardTitle>
          <CardDescription>Confidence scores for each colour class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {colourProbs.map(([cls, prob], index) => {
            const pct = Math.round(prob * 100);
            const meta = COLOUR_META[cls] ?? { label: cls, swatch: "bg-slate-400" };
            const isTop = cls === iris_colour.predicted_class;
            return (
              <motion.div
                key={cls}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${meta.swatch}`} />
                    <span className={`text-sm font-medium ${isTop ? "text-slate-900" : "text-slate-600"}`}>
                      {meta.label}
                    </span>
                    {isTop && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        Predicted
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{pct}%</span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full ${isTop ? "bg-blue-500" : "bg-slate-300"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: index * 0.08 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* ─── Abnormality Breakdown ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Abnormality Detection Breakdown</CardTitle>
          <CardDescription>Normal vs abnormal classification scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(abnormality.probabilities).map(([cls, prob], index) => {
            const pct = Math.round(prob * 100);
            const isAbn = cls.toLowerCase() === "abnormal";
            return (
              <motion.div
                key={cls}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 capitalize">{cls}</span>
                  <span className="text-sm font-bold text-slate-900">{pct}%</span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full ${isAbn ? "bg-red-500" : "bg-green-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Verdict */}
          <div className={`mt-4 p-4 rounded-lg border ${isAbnormal ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <p className={`text-sm font-medium ${isAbnormal ? "text-red-900" : "text-green-900"}`}>
              {isAbnormal
                ? `⚠️ Eye appears abnormal with ${abnConfPct}% confidence. Please consult an ophthalmologist.`
                : `✓ Eye appears normal with ${abnConfPct}% confidence.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Action Buttons ──────────────────────────────────────────────── */}
      <div className="flex gap-4">
        <button
          className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          onClick={onExportPDF}
        >
          <FileDown className="w-5 h-5" />
          Export as PDF
        </button>
        <button
          className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          onClick={onNewAnalysis}
        >
          <RotateCcw className="w-5 h-5" />
          New Analysis
        </button>
      </div>
    </motion.div>
  );
}