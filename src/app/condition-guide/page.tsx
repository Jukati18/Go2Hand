import React from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export const metadata = {
    title: 'Device Condition Guide | Go2Hand',
    description: 'Understand Go2Hand grading standards. Learn how we inspect, test, and categorize second-hand devices to ensure complete transparency.',
};

export default function ConditionGuidePage() {
    const gradingStandards = [
        {
            grade: 'Mint (Like New)',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            description: 'The device is in flawless, pristine condition with virtually zero signs of previous use.',
            cosmetics: 'No visible scratches, scuffs, or blemishes on the screen or body even under direct inspection light.',
            technical: '100% fully functional. Battery health is at or near peak capacity (typically ≥ 95%).',
            idealFor: 'Buyers looking for a brand-new experience at a second-hand price point.',
        },
        {
            grade: 'Excellent',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
            description: 'The device shows exceptionally light wear from careful daily usage.',
            cosmetics: 'May have micro-scratches on the body or bezel visible only from specific angles. The screen is practically flawless.',
            technical: '100% fully functional. Tested thoroughly with robust battery performance (typically ≥ 88%).',
            idealFor: 'Buyers seeking premium cosmetic appeal with great value.',
        },
        {
            grade: 'Good',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
            description: 'The device displays normal, moderate signs of everyday use.',
            cosmetics: 'Contains noticeable light scratches or minor scuffs on the casing or screen. No cracks, deep chips, or structural bends.',
            technical: '100% fully functional. All hardware components, sensors, and cameras operate perfectly.',
            idealFor: 'Practical users prioritizing functionality and budget over pristine cosmetics.',
        },
        {
            grade: 'Fair',
            badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
            description: 'The device shows obvious and heavy signs of wear and tear.',
            cosmetics: 'Prominent scratches, minor casing dents, or worn finish. Display may have light surface scratches, but remains fully intact without cracks.',
            technical: '100% fully functional. Thoroughly verified to ensure reliable daily operation.',
            idealFor: 'Bargain hunters, secondary backup devices, or testing dedicated software.',
        },
    ];

    const inspectionPoints = [
        {
            title: 'Authenticity & IMEI Verification',
            detail: 'Every device undergoes strict IMEI cross-checking to verify clean ownership history, network unlock status, and anti-theft database clearance.',
        },
        {
            title: 'Display & Touch Digitizer',
            detail: 'Screens are tested for dead pixels, color accuracy, True Tone functionality, brightness consistency, and multi-touch responsiveness.',
        },
        {
            title: 'Hardware & Sensors',
            detail: 'Biometrics (Face ID / Touch ID), cameras, microphones, speakers, Wi-Fi, Bluetooth, and physical buttons are subjected to multi-point diagnostic stress tests.',
        },
        {
            title: 'Battery & Power System',
            detail: 'We measure charge cycle counts, voltage stability, and thermal output to ensure the battery meets our strict safety and longevity standards.',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Content Container */}
            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Page Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Go2Hand Condition Grading Guide
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-gray-600">
                            We believe buying pre-owned devices should be completely transparent. Every listing on Go2Hand is categorized using our standardized grading scale.
                        </p>
                    </div>

                    {/* Grading Scale Section */}
                    <section className="space-y-6">
                        <div className="border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Standardized Grading Standards</h2>
                            <p className="text-sm text-gray-500 mt-1">Cosmetic condition varies by grade, but 100% functional reliability is guaranteed across all tiers.</p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                            {gradingStandards.map((item) => (
                                <div
                                    key={item.grade}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.badgeColor}`}>
                                                {item.grade}
                                            </span>
                                        </div>
                                        <p className="text-gray-900 font-medium">{item.description}</p>

                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li><strong className="text-gray-800">Cosmetics:</strong> {item.cosmetics}</li>
                                            <li><strong className="text-gray-800">Technical:</strong> {item.technical}</li>
                                        </ul>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
                                        <span className="font-semibold text-gray-700">Best for:</span> {item.idealFor}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Inspection Protocol */}
                    <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Our 30-Point Inspection Protocol</h2>
                            <p className="text-gray-600 text-sm">
                                Before any device is approved for listing or protected under our Escrow coverage, it must pass rigorous diagnostic checks.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {inspectionPoints.map((point) => (
                                <div key={point.title} className="space-y-1">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                                        {point.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 pl-4">{point.detail}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Buyer & Seller Protection Callout */}
                    <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 shadow-lg text-center space-y-6">
                        <div className="space-y-2 max-w-xl mx-auto">
                            <h2 className="text-2xl font-bold">Shop with Complete Confidence</h2>
                            <p className="text-gray-300 text-sm">
                                Did your device arrive in a condition different from its grading badge? Our escrow payment hold ensures your money is safe until you inspect the device.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/buyer-protection"
                                className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                            >
                                Buyer Protection Policy
                            </Link>
                            <Link
                                href="/devices"
                                className="bg-transparent border border-gray-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
                            >
                                Browse Verified Devices
                            </Link>
                        </div>
                    </section>

                    {/* Footer Navigation Back */}
                    <div className="text-center pt-4">
                        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            &larr; Return to Homepage
                        </Link>
                    </div>

                </div>
            </main>

            {/* Global Footer component placed correctly at the bottom */}
            <Footer />
        </div>
    );
}