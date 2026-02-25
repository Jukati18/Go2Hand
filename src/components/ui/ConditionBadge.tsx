// ============================================
// CONDITION BADGE — Pill chip for device grade
// ============================================

import { ConditionLabel } from '@/types/device';

const STYLES: Record<ConditionLabel, string> = {
    Excellent: 'bg-emerald-50 text-emerald-700',
    Good: 'bg-cyan-50 text-cyan-800',
    Fair: 'bg-amber-50 text-amber-700',
};

interface ConditionBadgeProps {
    label: ConditionLabel;
    className?: string;
}

export default function ConditionBadge({ label, className = '' }: ConditionBadgeProps) {
    return (
        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${STYLES[label]} ${className}`}>
            {label}
        </span>
    );
}