'use client'

// src/components/admin/AnalyticsDashboard.tsx
// ─────────────────────────────────────────────────────────────────
// ANALYTICS DASHBOARD — Client Component
//
// Renders all charts, KPI cards, and tables for /admin/analytics.
// No data fetching here — everything comes from the server page.
//
// Sections:
//   1. KPI cards       — GMV, revenue, orders, users (with delta badges)
//   2. Revenue chart   — sparkline area chart (pure SVG, no lib needed)
//   3. Orders chart    — bar chart (last 30 days)
//   4. User growth     — line chart (last 30 days)
//   5. Category mix    — horizontal bar breakdown
//   6. Order funnel    — visual conversion funnel
//   7. IMEI donut      — clean vs flagged pie
//   8. Top sellers     — ranked table with earnings
//   9. Recent orders   — live activity feed
//
// Why no chart library?
//   Recharts/D3 add ~150KB. These are bespoke SVG charts that:
//   - match the Go2Hand teal palette exactly
//   - are <50 lines each
//   - render fast (no hydration bloat)
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    TagIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    StarIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import type {
    AnalyticsData,
    DailyStat,
    CategoryStat,
    FunnelStep,
    TopSeller,
    RecentOrder,
} from '@/app/admin/analytics/page'

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function fmtUSD(n: number, compact = false): string {
    if (compact && n >= 1000) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD',
            notation: 'compact', maximumFractionDigits: 1,
        }).format(n)
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

function fmtNum(n: number, compact = false): string {
    if (compact && n >= 1000) {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact', maximumFractionDigits: 1,
        }).format(n)
    }
    return n.toLocaleString()
}

function relDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
    if (diff < 1) return 'Just now'
    if (diff < 24) return `${diff}h ago`
    const days = Math.floor(diff / 24)
    return `${days}d ago`
}

// Format 'YYYY-MM-DD' → 'Jan 5'
function fmtDateShort(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
    })
}

// ─────────────────────────────────────────────────────────────────
// SVG SPARKLINE AREA CHART
// ─────────────────────────────────────────────────────────────────
function AreaChart({
    data,
    color = '#0f766e',
    height = 80,
    showGrid = false,
}: {
    data: DailyStat[]
    color?: string
    height?: number
    showGrid?: boolean
}) {
    const width = 800
    const padTop = 8
    const padBot = showGrid ? 24 : 4
    const h = height - padTop - padBot
    const w = width - 2

    const values = data.map(d => d.value)
    const max = Math.max(...values, 1)
    const min = 0

    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w + 1
        const y = padTop + h - ((v - min) / (max - min)) * h
        return `${x},${y}`
    })

    const pathD = `M ${pts.join(' L ')}`
    const areaD = `M 1,${padTop + h} L ${pts.join(' L ')} L ${w + 1},${padTop + h} Z`

    // Show label every ~7 days
    const labelEvery = Math.max(1, Math.floor(data.length / 5))

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ height }}
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {showGrid && [0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padTop + h - frac * h
                return (
                    <line
                        key={i}
                        x1="1" y1={y} x2={w + 1} y2={y}
                        stroke="#f3f4f6" strokeWidth="1"
                    />
                )
            })}

            {/* Area fill */}
            <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />

            {/* Line */}
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* X-axis labels */}
            {showGrid && data.map((d, i) => {
                if (i % labelEvery !== 0 && i !== data.length - 1) return null
                const x = (i / (values.length - 1)) * w + 1
                return (
                    <text
                        key={d.date}
                        x={x}
                        y={height - 4}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#9ca3af"
                        fontFamily="inherit"
                    >
                        {fmtDateShort(d.date)}
                    </text>
                )
            })}
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────────
function BarChart({
    data,
    color = '#0f766e',
    height = 100,
}: {
    data: DailyStat[]
    color?: string
    height?: number
}) {
    const max = Math.max(...data.map(d => d.value), 1)
    const barW = 100 / data.length

    return (
        <div className="relative w-full flex items-end gap-px" style={{ height }}>
            {data.map((d, i) => {
                const h = Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)
                return (
                    <div
                        key={d.date}
                        className="flex-1 relative group cursor-default"
                        style={{ height: '100%' }}
                    >
                        {/* Bar */}
                        <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-opacity
                                group-hover:opacity-80"
                            style={{
                                height: `${h}%`,
                                backgroundColor: color,
                                opacity: 0.7 + (d.value / max) * 0.3,
                            }}
                        />
                        {/* Tooltip on hover */}
                        {d.value > 0 && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
                                bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded
                                whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
                                pointer-events-none z-10">
                                {fmtDateShort(d.date)}: {d.value}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// DONUT CHART
// ─────────────────────────────────────────────────────────────────
function DonutChart({
    clean,
    flagged,
}: {
    clean: number
    flagged: number
}) {
    const total = clean + flagged || 1
    const cleanPct = clean / total
    const flaggedPct = flagged / total

    // SVG arc helper
    const R = 40
    const cx = 50
    const cy = 50
    const circumference = 2 * Math.PI * R

    // clean arc (teal)
    const cleanDash  = cleanPct * circumference
    const flaggedDash = flaggedPct * circumference

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background ring */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth="14" />

            {/* Flagged arc (red) — drawn first so teal overlaps it at start */}
            {flaggedPct > 0 && (
                <circle
                    cx={cx} cy={cy} r={R}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="14"
                    strokeDasharray={`${flaggedDash} ${circumference - flaggedDash}`}
                    strokeDashoffset={-cleanDash}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    strokeLinecap="round"
                />
            )}

            {/* Clean arc (teal) */}
            {cleanPct > 0 && (
                <circle
                    cx={cx} cy={cy} r={R}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="14"
                    strokeDasharray={`${cleanDash} ${circumference - cleanDash}`}
                    strokeDashoffset={0}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    strokeLinecap="round"
                />
            )}

            {/* Center label */}
            <text
                x={cx} y={cy - 4}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#111827"
                fontFamily="inherit"
            >
                {Math.round(cleanPct * 100)}%
            </text>
            <text
                x={cx} y={cy + 10}
                textAnchor="middle"
                fontSize="8"
                fill="#9ca3af"
                fontFamily="inherit"
            >
                CLEAN
            </text>
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
    label: string
    value: string
    delta: number          // percentage point change vs last week
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    sparkData?: DailyStat[]
    accentColor?: string
    subtext?: string
}

function KpiCard({ label, value, delta, icon: Icon, sparkData, accentColor = '#0f766e', subtext }: KpiCardProps) {
    const isPositive = delta >= 0
    const absDelta   = Math.abs(delta)

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
                    style={{ backgroundColor: `${accentColor}18` }}>
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                {/* Delta badge */}
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full
                    ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {isPositive
                        ? <ArrowTrendingUpIcon className="w-3 h-3" />
                        : <ArrowTrendingDownIcon className="w-3 h-3" />
                    }
                    {absDelta}% WoW
                </div>
            </div>

            {/* Value */}
            <div>
                <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {label}
                </p>
                {subtext && (
                    <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
                )}
            </div>

            {/* Sparkline */}
            {sparkData && (
                <div className="h-12 -mx-1">
                    <AreaChart data={sparkData} color={accentColor} height={48} />
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// STATUS PILL for order status
// ─────────────────────────────────────────────────────────────────
const ORDER_STATUS_STYLES: Record<string, string> = {
    pending:       'bg-gray-100 text-gray-600',
    paid:          'bg-emerald-100 text-emerald-700',
    shipped:       'bg-blue-100 text-blue-700',
    in_inspection: 'bg-amber-100 text-amber-700',
    completed:     'bg-teal-100 text-teal-700',
    disputed:      'bg-red-100 text-red-700',
    cancelled:     'bg-gray-100 text-gray-400',
    refunded:      'bg-purple-100 text-purple-700',
}
const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', paid: 'Escrowed', shipped: 'Shipped',
    in_inspection: 'Inspecting', completed: 'Done',
    disputed: 'Disputed', cancelled: 'Cancelled', refunded: 'Refunded',
}

// ─────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
    const { kpi, revenueSeries, ordersSeries, usersSeries, categoryMix,
            funnel, imeiStats, topSellers, recentOrders } = data

    // Chart tab: revenue / orders / users
    const [activeChart, setActiveChart] = useState<'revenue' | 'orders' | 'users'>('revenue')

    const chartData = activeChart === 'revenue' ? revenueSeries
        : activeChart === 'orders' ? ordersSeries
        : usersSeries

    const chartColor = activeChart === 'revenue' ? '#0f766e'
        : activeChart === 'orders' ? '#0891b2'
        : '#7c3aed'

    const chartMax = Math.max(...chartData.map(d => d.value), 1)
    const chartLabel = activeChart === 'revenue' ? 'Platform Revenue (USD)'
        : activeChart === 'orders' ? 'Daily Orders'
        : 'New Signups'

    // Category total for %
    const catTotal = categoryMix.reduce((s, c) => s + c.count, 0) || 1

    // IMEI total
    const imeiTotal = imeiStats.clean + imeiStats.flagged || 1

    return (
        <div className="flex flex-col gap-5">

            {/* ═══ 1. KPI CARDS ════════════════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                    label="Platform Revenue"
                    value={fmtUSD(kpi.totalRevenue, true)}
                    delta={kpi.revenueDeltaPct}
                    icon={CurrencyDollarIcon}
                    sparkData={revenueSeries}
                    accentColor="#0f766e"
                    subtext="5% of completed GMV"
                />
                <KpiCard
                    label="Gross Merch. Value"
                    value={fmtUSD(kpi.totalGMV, true)}
                    delta={kpi.gMVDeltaPct}
                    icon={ShoppingBagIcon}
                    sparkData={ordersSeries}
                    accentColor="#0891b2"
                    subtext={`Avg order ${fmtUSD(kpi.avgOrderValue)}`}
                />
                <KpiCard
                    label="Total Orders"
                    value={fmtNum(kpi.totalOrders, true)}
                    delta={kpi.ordersDeltaPct}
                    icon={ShoppingBagIcon}
                    sparkData={ordersSeries}
                    accentColor="#d97706"
                />
                <KpiCard
                    label="Registered Users"
                    value={fmtNum(kpi.totalUsers, true)}
                    delta={kpi.usersDeltaPct}
                    icon={UsersIcon}
                    sparkData={usersSeries}
                    accentColor="#7c3aed"
                    subtext={`${kpi.activeListings} active listings`}
                />
            </div>

            {/* ═══ 2. MAIN CHART ══════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Chart header + tab switcher */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">{chartLabel}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {(['revenue', 'orders', 'users'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveChart(tab)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                                    activeChart === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart + Y-axis labels */}
                <div className="px-5 sm:px-6 pt-4 pb-2">
                    {/* Y-axis labels */}
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                        <span>0</span>
                        <span>{activeChart === 'revenue' ? fmtUSD(chartMax * 0.5, true) : Math.round(chartMax * 0.5)}</span>
                        <span>{activeChart === 'revenue' ? fmtUSD(chartMax, true) : chartMax}</span>
                    </div>

                    {/* Area chart with grid */}
                    <AreaChart
                        data={chartData}
                        color={chartColor}
                        height={160}
                        showGrid
                    />
                </div>
            </div>

            {/* ═══ 3. THREE-COLUMN SECTION ═══════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

                {/* Category Mix */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Listings by Category</h3>
                    {categoryMix.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No listings yet</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {categoryMix.map(cat => {
                                const pct = Math.round((cat.count / catTotal) * 100)
                                return (
                                    <div key={cat.slug}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-700 capitalize">
                                                {cat.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{cat.count}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Order Funnel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Escrow Conversion Funnel</h3>
                    <div className="flex flex-col gap-2">
                        {funnel.map((step, i) => {
                            // Width shrinks as pct drops, minimum 30% for visibility
                            const barW = Math.max(step.pct, 8)
                            const colors = ['#0f766e', '#0891b2', '#d97706', '#059669']

                            return (
                                <div key={step.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-semibold text-gray-600">
                                            {i + 1}. {step.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-800">
                                                {fmtNum(step.count)}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                                ${step.pct >= 80 ? 'bg-teal-50 text-teal-700'
                                                : step.pct >= 50 ? 'bg-amber-50 text-amber-700'
                                                : 'bg-red-50 text-red-600'}`}>
                                                {step.pct}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
                                            style={{ width: `${barW}%`, backgroundColor: colors[i] }}
                                        >
                                            {barW > 20 && (
                                                <span className="text-[9px] text-white font-bold">
                                                    {fmtNum(step.count)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Drop-off indicator between steps */}
                                    {i < funnel.length - 1 && funnel[i + 1].pct < step.pct && (
                                        <p className="text-[10px] text-gray-400 mt-0.5 ml-1">
                                            ↓ {step.pct - funnel[i + 1].pct}% drop-off
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* IMEI Verification */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">IMEI Verification Stats</h3>
                    <div className="w-32 h-32 mx-auto mb-5">
                        <DonutChart clean={imeiStats.clean} flagged={imeiStats.flagged} />
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {[
                            {
                                label: 'Clean — Not Blacklisted',
                                count: imeiStats.clean,
                                pct:   Math.round((imeiStats.clean / imeiTotal) * 100),
                                color: '#0f766e',
                                icon: ShieldCheckIcon,
                                bg: 'bg-teal-50',
                            },
                            {
                                label: 'Flagged — Reported Stolen',
                                count: imeiStats.flagged,
                                pct:   Math.round((imeiStats.flagged / imeiTotal) * 100),
                                color: '#dc2626',
                                icon: ShieldExclamationIcon,
                                bg: 'bg-red-50',
                            },
                        ].map(row => (
                            <div key={row.label} className={`flex items-center gap-3 ${row.bg} rounded-xl px-3 py-2.5`}>
                                <row.icon className="w-4 h-4 shrink-0" style={{ color: row.color }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">{row.label}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{row.pct}% of total checks</p>
                                </div>
                                <span className="text-sm font-black" style={{ color: row.color }}>
                                    {fmtNum(row.count)}
                                </span>
                            </div>
                        ))}
                        {imeiStats.clean + imeiStats.flagged === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                                No verifications logged yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ 4. TOP SELLERS + RECENT ORDERS ════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

                {/* Top Sellers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Top Sellers by Earnings</h3>
                        <Link href="/admin/users"
                            className="text-xs text-teal-600 hover:text-teal-800 font-semibold
                                flex items-center gap-1 transition-colors">
                            All users <ChevronRightIcon className="w-3 h-3" />
                        </Link>
                    </div>

                    {topSellers.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-400">
                            No completed sales yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {topSellers.map((seller, i) => {
                                // Initials fallback
                                const displayName = seller.fullName ?? seller.username
                                const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                                const gradients = [
                                    'from-teal-500 to-emerald-500',
                                    'from-violet-500 to-purple-500',
                                    'from-orange-500 to-red-500',
                                    'from-blue-500 to-cyan-500',
                                    'from-pink-500 to-rose-500',
                                ]
                                const grad = gradients[seller.username.charCodeAt(0) % gradients.length]

                                return (
                                    <div key={seller.id}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">

                                        {/* Rank */}
                                        <span className={`text-sm font-black w-5 text-center shrink-0
                                            ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                                            {i + 1}
                                        </span>

                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad}
                                            flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                                            {initials}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {displayName}
                                                </p>
                                                {seller.isVerified && (
                                                    <ShieldSolid className="w-3 h-3 text-emerald-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-400">
                                                    {seller.totalSales} sales
                                                </span>
                                                {seller.rating > 0 && (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                                                        <StarIcon className="w-2.5 h-2.5 fill-amber-400" />
                                                        {seller.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Earnings */}
                                        <p className="text-sm font-black text-teal-700 shrink-0">
                                            {fmtUSD(seller.earnings, true)}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
                        <Link href="/admin/orders"
                            className="text-xs text-teal-600 hover:text-teal-800 font-semibold
                                flex items-center gap-1 transition-colors">
                            All orders <ChevronRightIcon className="w-3 h-3" />
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-400">
                            No orders yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentOrders.map(order => (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    target="_blank"
                                    className="flex items-center gap-3 px-5 py-3
                                        hover:bg-gray-50 transition-colors group"
                                >
                                    {/* Product image */}
                                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100
                                        flex items-center justify-center shrink-0 overflow-hidden">
                                        {order.productImage ? (
                                            <Image
                                                src={order.productImage}
                                                alt={order.productTitle ?? ''}
                                                width={36} height={36} sizes="36px"
                                                className="w-full h-full object-contain p-0.5"
                                            />
                                        ) : (
                                            <span className="text-base">📱</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate
                                            group-hover:text-teal-700 transition-colors">
                                            {order.productTitle ?? 'Device'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {order.buyerUsername ? `@${order.buyerUsername}` : '—'}
                                            {' → '}
                                            {order.sellerUsername ? `@${order.sellerUsername}` : '—'}
                                        </p>
                                    </div>

                                    {/* Status + amount */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                                            ${ORDER_STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                                        </span>
                                        <span className="text-xs font-bold text-gray-800">
                                            {fmtUSD(order.amount)}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {relDate(order.createdAt)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ 5. ORDERS DAILY BAR CHART ══════════════════════ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Daily Order Volume</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Last 30 days — hover bars for detail</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-gray-900">
                            {fmtNum(ordersSeries.reduce((s, d) => s + d.value, 0))}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total orders</p>
                    </div>
                </div>
                <BarChart data={ordersSeries} color="#0891b2" height={100} />
                {/* X-axis label row */}
                <div className="flex justify-between mt-2">
                    {[0, 7, 14, 21, 29].map(i => (
                        <span key={i} className="text-[10px] text-gray-400 font-mono">
                            {fmtDateShort(ordersSeries[i]?.date ?? '')}
                        </span>
                    ))}
                </div>
            </div>

            {/* ═══ 6. USER GROWTH LINE CHART ══════════════════════ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">New User Signups</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-gray-900">
                            {fmtNum(usersSeries.reduce((s, d) => s + d.value, 0))}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">New users</p>
                    </div>
                </div>
                <AreaChart data={usersSeries} color="#7c3aed" height={120} showGrid />
            </div>

        </div>
    )
}