"use client";

import { Download, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { FilterState, MatchResult } from "../_lib/resume-filters";
import { PRESETS } from "../_lib/resume-presets";
import type { SectionKey } from "../_lib/resume-types";

const SECTION_LABELS: Record<SectionKey, string> = {
  work: "Work Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  interests: "Interests",
  awards: "Awards",
  references: "References",
};

interface FilterPanelProps {
  filters: FilterState;
  allTags: string[];
  workMatches: Map<number, MatchResult>;
  projectMatches: Map<number, MatchResult>;
  totalWork: number;
  totalProjects: number;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
  onClose?: () => void;
}

export function FilterPanel({
  filters,
  allTags,
  workMatches,
  projectMatches,
  totalWork,
  totalProjects,
  onFiltersChange,
  onExport,
  onClose,
}: FilterPanelProps) {
  const matchedWork = Array.from(workMatches.values()).filter((m) => m.matched).length;
  const matchedProjects = Array.from(projectMatches.values()).filter((m) => m.matched).length;

  const setPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onFiltersChange({
      ...filters,
      activePreset: presetId,
      selectedTags: preset.tags,
      sections: preset.sections,
    });
  };

  const toggleTag = (tag: string) => {
    const next = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ ...filters, selectedTags: next, activePreset: null });
  };

  const toggleSection = (key: SectionKey) => {
    onFiltersChange({
      ...filters,
      sections: { ...filters.sections, [key]: !filters.sections[key] },
      activePreset: null,
    });
  };

  const reset = () => {
    setPreset("all");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold">Filters</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-2 text-xs text-muted-foreground">
        Showing {matchedWork}/{totalWork} jobs, {matchedProjects}/{totalProjects} projects
      </div>

      <Separator />

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-3">
        {/* Preset */}
        <div>
          <Label className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Preset
          </Label>
          <Select value={filters.activePreset ?? ""} onValueChange={setPreset}>
            <SelectTrigger className="mt-1.5 h-8 text-xs">
              <SelectValue placeholder="Custom" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sections */}
        <div>
          <Label className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Sections
          </Label>
          <div className="mt-2 space-y-2">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`section-${key}`} className="text-xs">
                  {SECTION_LABELS[key]}
                </Label>
                <Switch
                  id={`section-${key}`}
                  checked={filters.sections[key]}
                  onCheckedChange={() => toggleSection(key)}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Match mode */}
        <div>
          <Label className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Tag Matching
          </Label>
          <Select
            value={filters.tagMatchMode}
            onValueChange={(v) =>
              onFiltersChange({
                ...filters,
                tagMatchMode: v as "any" | "all",
                activePreset: null,
              })
            }
          >
            <SelectTrigger className="mt-1.5 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any" className="text-xs">
                Match any tag
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                Match all tags
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Technologies
            </Label>
            {filters.selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    selectedTags: [],
                    activePreset: null,
                  })
                }
              >
                Clear
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const selected = filters.selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer text-xs transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      <Separator />

      {/* Export */}
      <div className="p-4">
        <Button onClick={onExport} className="w-full gap-2" size="sm">
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
