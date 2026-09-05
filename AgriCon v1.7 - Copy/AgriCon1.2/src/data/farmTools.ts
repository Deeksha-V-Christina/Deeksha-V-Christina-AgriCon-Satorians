import React from 'react';
import { FlaskConical, Droplets, Scale, Camera } from 'lucide-react';

export type FarmToolId = 'fertilizer' | 'pesticide' | 'yield' | 'diagnosis';

export interface FarmToolDef {
  id: FarmToolId;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  badgeColor: string;
  titleKey: string;
  subtitleKey: string;
  badgeKey: string;
  tagKey: string;
}

// Text is resolved at render time via t(titleKey) etc. so the same definition
// drives both the compact Home quick-launch cards and the full Farm Tools page.
export const FARM_TOOLS: FarmToolDef[] = [
  {
    id: 'fertilizer',
    icon: FlaskConical,
    iconBg: 'bg-[#d8f3dc] text-[#1b4332]',
    badgeColor: 'bg-[#d8f3dc] text-[#1b4332] border-[#a7e3b8]',
    titleKey: 'tools.fertilizerTitle',
    subtitleKey: 'tools.fertilizerSubtitle',
    badgeKey: 'tools.fertilizerBadge',
    tagKey: 'tools.fertilizerTag',
  },
  {
    id: 'pesticide',
    icon: Droplets,
    iconBg: 'bg-emerald-100 text-emerald-800',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    titleKey: 'tools.pesticideTitle',
    subtitleKey: 'tools.pesticideSubtitle',
    badgeKey: 'tools.pesticideBadge',
    tagKey: 'tools.pesticideTag',
  },
  {
    id: 'yield',
    icon: Scale,
    iconBg: 'bg-amber-100 text-amber-800',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    titleKey: 'tools.yieldTitle',
    subtitleKey: 'tools.yieldSubtitle',
    badgeKey: 'tools.yieldBadge',
    tagKey: 'tools.yieldTag',
  },
  {
    id: 'diagnosis',
    icon: Camera,
    iconBg: 'bg-teal-100 text-teal-800',
    badgeColor: 'bg-teal-50 text-teal-900 border-teal-200',
    titleKey: 'tools.diagnosisTitle',
    subtitleKey: 'tools.diagnosisSubtitle',
    badgeKey: 'tools.diagnosisBadge',
    tagKey: 'tools.diagnosisTag',
  },
];
