"use client";

import React, { useState } from 'react';
import { Search, Bell, ChevronRight, Heart } from 'lucide-react';

// Type Definitions
interface Device {
    id: string;
    name: string;
    battery?: string;
    ram?: string;
    isVerified: boolean;
    currentPrice: number;
    originalPrice: number;
    rating: number;
    gradient: string;
    icon: 'phone' | 'laptop';
}

interface Category {
    id: string;
    name: string;
    count: number;
    icon: React.ReactNode;
    color: string;
}

interface TrustFeature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const HomePage: React.FC = () => {
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Categories Data
    const categories: Category[] = [
        {
            id: 'smartphones',
            name: 'Smartphones',
            count: 2450,
            color: 'text-indigo-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="4" fill="currentColor" opacity="0.1" />
                    <rect x="11" y="8" width="10" height="16" rx="1" fill="currentColor" />
                    <circle cx="16" cy="21" r="1" fill="white" />
                </svg>
            ),
        },
        {
            id: 'laptops',
            name: 'Laptops',
            count: 1280,
            color: 'text-green-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="4" fill="currentColor" opacity="0.1" />
                    <rect x="8" y="10" width="16" height="11" rx="1" fill="currentColor" />
                    <rect x="8" y="21" width="16" height="2" rx="0.5" fill="currentColor" />
                </svg>
            ),
        },
        {
            id: 'pcs',
            name: 'PCs & Desktops',
            count: 680,
            color: 'text-orange-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="4" fill="currentColor" opacity="0.1" />
                    <rect x="9" y="8" width="14" height="11" rx="1" fill="currentColor" />
                    <rect x="7" y="19" width="18" height="5" rx="1" fill="currentColor" />
                </svg>
            ),
        },
        {
            id: 'tablets',
            name: 'Tablets & Watches',
            count: 890,
            color: 'text-red-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="4" fill="currentColor" opacity="0.1" />
                    <rect x="10" y="7" width="12" height="18" rx="2" fill="currentColor" />
                    <circle cx="16" cy="22" r="1" fill="white" />
                </svg>
            ),
        },
    ];

    // Featured Devices Data
    const devices: Device[] = [
        {
            id: '1',
            name: 'iPhone 13 Pro - 128GB',
            battery: '92% Battery',
            isVerified: true,
            currentPrice: 649,
            originalPrice: 899,
            rating: 4.9,
            gradient: 'from-indigo-600 to-purple-600',
            icon: 'phone',
        },
        {
            id: '2',
            name: 'MacBook Pro 14" M1',
            battery: '95% Battery',
            isVerified: true,
            currentPrice: 1299,
            originalPrice: 1999,
            rating: 5.0,
            gradient: 'from-green-600 to-green-700',
            icon: 'laptop',
        },
        {
            id: '3',
            name: 'Samsung Galaxy S22 Ultra',
            battery: '88% Battery',
            isVerified: true,
            currentPrice: 599,
            originalPrice: 849,
            rating: 4.8,
            gradient: 'from-orange-600 to-orange-700',
            icon: 'phone',
        },
        {
            id: '4',
            name: 'ThinkPad X1 Carbon Gen 9',
            ram: '16GB RAM',
            isVerified: true,
            currentPrice: 899,
            originalPrice: 1299,
            rating: 4.9,
            gradient: 'from-indigo-600 to-indigo-800',
            icon: 'laptop',
        },
    ];

    // Trust Features Data
    const trustFeatures: TrustFeature[] = [
        {
            id: '1',
            title: 'Device Verification',
            description: 'Every device tested & certified by our expert technicians',
            color: 'text-indigo-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                    <path d="M28 14L17 25L12 20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            id: '2',
            title: '30-Day Warranty',
            description: 'Money-back guarantee on all purchases',
            color: 'text-green-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M16 8L18 15H26L20 20L22 27L16 22L10 27L12 20L6 15H14L16 8Z" />
                </svg>
            ),
        },
        {
            id: '3',
            title: 'Secure Payments',
            description: 'Escrow protection for peace of mind',
            color: 'text-orange-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
                    <rect x="12" y="8" width="8" height="16" rx="1" />
                    <rect x="12" y="20" width="8" height="4" opacity="0.7" />
                </svg>
            ),
        },
        {
            id: '4',
            title: 'Data Privacy',
            description: 'Factory reset verified before shipping',
            color: 'text-purple-600',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                    <circle cx="16" cy="16" r="10" strokeWidth="2" />
                    <path d="M12 16L15 19L21 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ];

    const toggleWishlist = (deviceId: string) => {
        setWishlist(prev => {
            const newWishlist = new Set(prev);
            if (newWishlist.has(deviceId)) {
                newWishlist.delete(deviceId);
            } else {
                newWishlist.add(deviceId);
            }
            return newWishlist;
        });
    };

    const renderDeviceIcon = (type: 'phone' | 'laptop') => {
        if (type === 'phone') {
            return (
                <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
                    <rect x="25" y="10" width="30" height="100" rx="4" fill="white" opacity="0.15" />
                    <rect x="27" y="14" width="26" height="88" rx="2" fill="white" opacity="0.1" />
                    <circle cx="40" cy="106" r="2.5" fill="white" opacity="0.3" />
                </svg>
            );
        }
        return (
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
                <rect x="15" y="15" width="70" height="45" rx="2" fill="white" opacity="0.15" />
                <rect x="17" y="17" width="66" height="41" rx="1" fill="white" opacity="0.1" />
                <rect x="10" y="60" width="80" height="8" rx="1" fill="white" opacity="0.15" />
            </svg>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-8 py-4">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M5 10L9 14L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-gray-900">SecondTech</span>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search devices, brands, models..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                            />
                        </div>

                        {/* Nav Links */}
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium text-sm transition">
                                Browse
                            </a>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium text-sm transition">
                                Sell
                            </a>
                            <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                                    3
                                </span>
                            </button>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium text-sm transition">
                                Sign up
                            </a>
                            <a href="#" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition">
                                Sign In
                            </a>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                        Quality Pre-Owned Tech,{' '}
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Trusted & Verified
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Buy and sell second-hand smartphones, laptops, and tablets with confidence.
                        Every device tested, verified, and backed by our guarantee.
                    </p>
                    <div className="flex gap-4 justify-center mb-12">
                        <button className="flex items-center gap-2 bg-indigo-600 text-white px-7 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm">
                            <Search className="w-5 h-5" />
                            Browse Devices
                        </button>
                        <button className="flex items-center gap-2 bg-white text-indigo-600 px-7 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 hover:border-indigo-600 transition">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                <path d="M10 5V15M5 10H15" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Sell Your Device
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center gap-16 pt-8">
                        <div>
                            <div className="text-3xl font-extrabold text-indigo-600 mb-1">50K+</div>
                            <div className="text-sm text-gray-600">Devices Sold</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-indigo-600 mb-1">4.9★</div>
                            <div className="text-sm text-gray-600">Average Rating</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-indigo-600 mb-1">98%</div>
                            <div className="text-sm text-gray-600">Satisfaction Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold mb-2">Shop by Category</h2>
                        <p className="text-gray-600">Find the perfect device for your needs</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map(category => (
                            <a
                                key={category.id}
                                href="#"
                                className="bg-white p-8 rounded-xl text-center border border-gray-200 hover:border-indigo-600 hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className={`${category.color} mx-auto mb-5`}>
                                    {category.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-gray-900">{category.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">{category.count.toLocaleString()} devices</p>
                                <div className="text-indigo-600 text-xl group-hover:translate-x-1 transition-transform">→</div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Devices */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-extrabold">Featured Devices</h2>
                        <a href="#" className="flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all">
                            View All
                            <ChevronRight className="w-5 h-5" />
                        </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {devices.map(device => (
                            <div
                                key={device.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 hover:border-transparent transition-all cursor-pointer"
                            >
                                {/* Device Image */}
                                <div className={`relative h-60 bg-gradient-to-br ${device.gradient} flex items-center justify-center`}>
                                    {renderDeviceIcon(device.icon)}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist(device.id);
                                        }}
                                        className={`absolute top-4 right-4 w-9 h-9 rounded-full ${wishlist.has(device.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
                                            } flex items-center justify-center shadow-lg hover:scale-110 transition`}
                                    >
                                        <Heart className={`w-5 h-5 ${wishlist.has(device.id) ? 'fill-current' : ''}`} />
                                    </button>
                                </div>

                                {/* Device Info */}
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 mb-3">{device.name}</h3>
                                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                                                <circle cx="7" cy="7" r="6" strokeWidth="1.5" />
                                            </svg>
                                            <span>{device.battery || device.ram}</span>
                                        </div>
                                        {device.isVerified && (
                                            <div className="flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                                    <path d="M7 1L8.5 4.5L12 5L9.5 7.5L10 11L7 9L4 11L4.5 7.5L2 5L5.5 4.5L7 1Z" />
                                                </svg>
                                                <span>Verified Seller</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-extrabold text-green-600">
                                                ${device.currentPrice}
                                            </span>
                                            <span className="text-sm text-gray-400 line-through">
                                                ${device.originalPrice}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="#F59E0B">
                                                <path d="M7 1L8.5 4.5L12 5L9.5 7.5L10 11L7 9L4 11L4.5 7.5L2 5L5.5 4.5L7 1Z" />
                                            </svg>
                                            <span>{device.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {trustFeatures.map(feature => (
                            <div
                                key={feature.id}
                                className="bg-white p-8 rounded-xl text-center border border-gray-200 hover:border-indigo-600 hover:shadow-lg hover:-translate-y-1 transition-all"
                            >
                                <div className={`${feature.color} mx-auto mb-4`}>
                                    {feature.icon}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-8 pb-8 border-b border-gray-800">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M5 10L9 14L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="text-lg font-bold text-white">SecondTech</span>
                            </div>
                            <p className="text-sm">Quality pre-owned tech, trusted & verified</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">SHOP</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-indigo-600 transition">Smartphones</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Laptops</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Tablets</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Accessories</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">COMPANY</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-indigo-600 transition">About Us</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">How It Works</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Trust & Safety</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">SUPPORT</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-indigo-600 transition">Help Center</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Contact Us</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Shipping</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Returns</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p>&copy; 2026 SecondTech. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-indigo-600 transition">Privacy Policy</a>
                            <a href="#" className="hover:text-indigo-600 transition">Terms of Service</a>
                            <a href="#" className="hover:text-indigo-600 transition">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;