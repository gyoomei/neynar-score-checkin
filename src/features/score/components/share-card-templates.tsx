"use client";

import { NeynarScoreData } from "@/features/score/types";
import { useState } from "react";

interface ShareCardTemplatesProps {
  data: NeynarScoreData;
  onClose: () => void;
}

type Template = "minimal" | "gradient" | "neon" | "dark";

function formatScore(score: number): string {
  const safeScore = Number.isFinite(score) ? Math.min(Math.max(score, 0), 1) : 0;
  return safeScore.toFixed(2).replace(".", ",");
}

export function ShareCardTemplates({ data, onClose }: ShareCardTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>("gradient");
  const [isGenerating, setIsGenerating] = useState(false);

  const templates: { id: Template; name: string; preview: string }[] = [
    { id: "minimal", name: "Minimal", preview: "Clean & Simple" },
    { id: "gradient", name: "Gradient", preview: "Colorful & Modern" },
    { id: "neon", name: "Neon", preview: "Bold & Vibrant" },
    { id: "dark", name: "Dark", preview: "Sleek & Professional" },
  ];

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      // Generate image via API
      const response = await fetch(
        `/api/share/card?template=${selectedTemplate}&fid=${data.fid}&score=${data.score}&username=${data.username}`
      );
      
      if (!response.ok) throw new Error("Failed to generate card");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Download image
      const a = document.createElement("a");
      a.href = url;
      a.download = `neynar-score-${data.username}-${selectedTemplate}.png`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show success toast
      alert("Card downloaded! 🎉");
    } catch (error) {
      console.error("Failed to generate card:", error);
      alert("Failed to generate card. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 rounded-3xl shadow-2xl border border-blue-200/70 p-6 animate-[scale-in_0.3s_ease-out]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-md"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-1">
            Choose Template
          </h2>
          <p className="text-sm text-slate-600">
            Select a style for your score card
          </p>
        </div>

        {/* Preview */}
        <div className="mb-6 rounded-2xl overflow-hidden border-2 border-blue-200/70 shadow-lg">
          <TemplatePreview template={selectedTemplate} data={data} />
        </div>

        {/* Template selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedTemplate === template.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-blue-200/60 bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className="font-semibold text-sm text-slate-800">
                {template.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {template.preview}
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold text-sm bg-white hover:bg-slate-50 active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold text-sm active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Download Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ template, data }: { template: Template; data: NeynarScoreData }) {
  const score = formatScore(data.score);

  if (template === "minimal") {
    return (
      <div className="bg-white p-8 flex flex-col items-center justify-center aspect-square">
        <div className="text-6xl font-bold text-slate-900 mb-4">{score}</div>
        <div className="text-xs text-slate-400">@{data.username}</div>
        <div className="mt-6 text-xs text-slate-400">Neynar Score</div>
      </div>
    );
  }

  if (template === "gradient") {
    return (
      <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 flex flex-col items-center justify-center aspect-square relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative z-10 text-center">
          <div className="text-6xl font-bold text-white mb-4">{score}</div>
          <div className="text-xs text-white/80">@{data.username}</div>
          <div className="mt-6 text-xs text-white/70">Farcaster Reputation</div>
        </div>
      </div>
    );
  }

  if (template === "neon") {
    return (
      <div className="bg-black p-8 flex flex-col items-center justify-center aspect-square relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-pink-500/20" />
        <div className="relative z-10 text-center">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            {score}
          </div>
          <div className="text-xs text-pink-300">@{data.username}</div>
          <div className="mt-6 text-xs text-slate-400">NEYNAR SCORE</div>
        </div>
      </div>
    );
  }

  // dark template
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex flex-col items-center justify-center aspect-square border border-slate-700">
      <div className="text-6xl font-bold text-white mb-4">{score}</div>
      <div className="text-xs text-slate-400">@{data.username}</div>
      <div className="mt-6 text-xs text-slate-500 uppercase tracking-wider">Neynar Score</div>
    </div>
  );
}
