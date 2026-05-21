"use client";

// src/components/sell/ImeiVerificationInput.tsx
// ─────────────────────────────────────────────────────────────────
// Reusable IMEI / Serial verification input with inline result badge
//
// Features:
//  • Real-time format validation as user types (no server call)
//  • "Check Now" button triggers server-side blacklist mock
//  • Animated status badge: clean ✓ / flagged ⚠ / invalid ✗
//  • Helpful examples and format hints
//  • Exposes result to parent via onResult callback
//
// Usage (Sell Device form):
//   <ImeiVerificationInput
//     type="imei"
//     label="IMEI Number"
//     onResult={(r) => setImeiStatus(r.status)}
//   />
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ArrowPathIcon,
    QuestionMarkCircleIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckSolid } from "@heroicons/react/24/solid";
import {
    normalizeIMEI,
    isValidIMEIFormat,
    isValidSerialFormat,
} from "@/lib/imeiValidator";
import { actionVerifyIMEI, actionVerifySerial } from "@/actions/verification";
import type { VerificationResult } from "@/lib/imeiValidator";

// ── Props ─────────────────────────────────────────────────────────
interface ImeiVerificationInputProps {
    type: "imei" | "serial";
    label?: string;
    placeholder?: string;
    hint?: string;
    required?: boolean;
    /** Called when verification completes (or input is cleared) */
    onResult?: (result: VerificationResult | null) => void;
    className?: string;
}

// ── Status display config ─────────────────────────────────────────
const STATUS_CONFIG = {
    clean: {
        icon: CheckSolid,
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        iconColor: "text-emerald-500",
        label: "Clean",
    },
    flagged: {
        icon: ExclamationTriangleIcon,
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        iconColor: "text-red-500",
        label: "Flagged",
    },
    invalid_format: {
        icon: XCircleIcon,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        iconColor: "text-amber-500",
        label: "Invalid Format",
    },
    unverified: {
        icon: QuestionMarkCircleIcon,
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-600",
        iconColor: "text-gray-400",
        label: "Not Verified",
    },
};

// ─────────────────────────────────────────────────────────────────
export default function ImeiVerificationInput({
    type,
    label,
    placeholder,
    hint,
    required = false,
    onResult,
    className = "",
}: ImeiVerificationInputProps) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    // Live format check (client-side, no server call)
    const formatOk =
        type === "imei"
            ? isValidIMEIFormat(normalizeIMEI(value))
            : isValidSerialFormat(value);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setValue(raw);
            // Clear previous result when user edits
            if (result) {
                setResult(null);
                onResult?.(null);
            }
        },
        [result, onResult],
    );

    // Paste from clipboard — normalize automatically
    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            if (type !== "imei") return;
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            const normalized = normalizeIMEI(pasted);
            setValue(normalized);
            if (result) {
                setResult(null);
                onResult?.(null);
            }
        },
        [type, result, onResult],
    );

    // Trigger server verification
    const handleVerify = useCallback(async () => {
        if (!value.trim() || loading) return;
        setLoading(true);

        const res =
            type === "imei"
                ? await actionVerifyIMEI(value)
                : await actionVerifySerial(value);

        setResult(res);
        onResult?.(res);
        setLoading(false);
    }, [value, type, loading, onResult]);

    const config = result ? STATUS_CONFIG[result.status] : null;
    const StatusIcon = config?.icon;

    // Decide input border color based on state
    const inputBorder = result
        ? result.status === "clean"
            ? "border-emerald-400 ring-1 ring-emerald-100"
            : result.status === "flagged"
                ? "border-red-400 ring-1 ring-red-100"
                : "border-amber-400 ring-1 ring-amber-100"
        : "border-gray-200 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-100";

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {/* ── Label row ── */}
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {label}
                        {required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    {/* Info toggle */}
                    <button
                        type="button"
                        onClick={() => setShowInfo((s) => !s)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-teal-600
              transition-colors"
                    >
                        <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                        {type === "imei" ? "Where to find IMEI?" : "Where to find Serial?"}
                    </button>
                </div>
            )}

            {/* ── Info panel (collapsible) ── */}
            {showInfo && (
                <div
                    className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-xs
          text-teal-700 leading-relaxed animate-[fadeDown_.15s_ease_both]"
                >
                    {type === "imei" ? (
                        <>
                            <p className="font-bold mb-1">How to find your IMEI:</p>
                            <ul className="flex flex-col gap-1 list-disc list-inside text-teal-600">
                                <li>
                                    Dial{" "}
                                    <code className="font-mono bg-teal-100 px-1 rounded">
                                        *#06#
                                    </code>{" "}
                                    on the phone
                                </li>
                                <li>Settings → General → About (iPhone)</li>
                                <li>Settings → About Phone (Android)</li>
                                <li>On the device box or SIM tray label</li>
                            </ul>
                            <p className="mt-2 text-teal-500">
                                Format: 15 digits. Dashes and spaces are stripped automatically.
                            </p>
                            <p className="mt-1 text-teal-500">
                                Test flagged:{" "}
                                <code className="font-mono bg-teal-100 px-1 rounded">
                                    352099001761481
                                </code>
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold mb-1">How to find your Serial Number:</p>
                            <ul className="flex flex-col gap-1 list-disc list-inside text-teal-600">
                                <li>Apple: Settings → General → About, or bottom of device</li>
                                <li>Samsung: Settings → About → Status</li>
                                <li>Laptop: Label on the bottom, or BIOS/UEFI</li>
                            </ul>
                            <p className="mt-2 text-teal-500">
                                Format: 8–20 alphanumeric characters.
                            </p>
                            <p className="mt-1 text-teal-500">
                                Test flagged:{" "}
                                <code className="font-mono bg-teal-100 px-1 rounded">
                                    STOLEN123456
                                </code>
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* ── Input + button row ── */}
            <div
                className={`flex items-center gap-0 border rounded-xl overflow-hidden
        transition-all duration-200 ${inputBorder}`}
            >
                {/* Input */}
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} // don't submit form
                    placeholder={
                        placeholder ??
                        (type === "imei" ? "490154203237518 (15 digits)" : "C02XN0AFJG5M")
                    }
                    className="flex-1 px-4 py-3 text-sm text-gray-800 bg-white outline-none
            placeholder:text-gray-400 font-mono"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={type === "imei" ? 20 : 25} // allow some separators before normalize
                />

                {/* Live format indicator (subtle) */}
                {value.length > 3 && (
                    <div className="px-2">
                        {formatOk ? (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <XCircleIcon className="w-4 h-4 text-gray-300" />
                        )}
                    </div>
                )}

                {/* Verify button */}
                <button
                    type="button"
                    onClick={handleVerify}
                    disabled={!value.trim() || loading}
                    className={`shrink-0 px-5 py-3 text-xs font-bold transition-all duration-200
            border-l border-gray-100
            ${loading
                            ? "bg-gray-50 text-gray-400 cursor-wait"
                            : !value.trim()
                                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                                : "bg-teal-800 hover:bg-teal-700 text-white cursor-pointer"
                        }`}
                >
                    {loading ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                        "Check"
                    )}
                </button>
            </div>

            {/* ── Format hint ── */}
            {hint && !result && <p className="text-[11px] text-gray-400">{hint}</p>}

            {/* ── Verification result badge ── */}
            {result && config && StatusIcon && (
                <div
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3
          ${config.bg} ${config.border}
          animate-[fadeUp_.25s_ease_both]`}
                >
                    <StatusIcon
                        className={`w-4 h-4 shrink-0 mt-0.5 ${config.iconColor}`}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-bold ${config.text}`}>
                                {config.label}
                            </span>
                            {result.checkedAt && (
                                <span className="text-[10px] text-gray-400">
                                    Checked {new Date(result.checkedAt).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <p
                            className={`text-[11px] leading-relaxed ${config.text} opacity-80`}
                        >
                            {result.message}
                        </p>
                    </div>

                    {/* Re-check button */}
                    <button
                        type="button"
                        onClick={() => {
                            setResult(null);
                            onResult?.(null);
                        }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                        title="Clear and re-check"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
