import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings2, Trash2, ArrowUpRight } from 'lucide-react';

export default function Alerts({ data }) {
    const [targetRange, setTargetRange] = useState({ min: 10000, max: 25000 });
    const [alertsEnabled, setAlertsEnabled] = useState(true);

    // Load target range from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('bajaao_target_range');
        if (saved) {
            try {
                setTargetRange(JSON.parse(saved));
            } catch (e) {
                console.error("Could not parse saved target range");
            }
        }

        const savedEnabled = localStorage.getItem('bajaao_alerts_enabled');
        if (savedEnabled !== null) {
            setAlertsEnabled(savedEnabled === 'true');
        }
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        localStorage.setItem('bajaao_target_range', JSON.stringify(targetRange));
        localStorage.setItem('bajaao_alerts_enabled', alertsEnabled.toString());
    }, [targetRange, alertsEnabled]);

    // Find guitars that match criteria
    const matchingGuitars = data.filter(g =>
        g.inStock &&
        g.currentPrice >= targetRange.min &&
        g.currentPrice <= targetRange.max
    );

    const bigDrops = data.filter(g => g.discountPercent >= 15 && g.inStock);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                        Price Drop Alerts
                    </h1>
                    <p className="text-gray-400 mt-2">Set your budget and get notified when guitars drop into your range.</p>
                </div>

                <button
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${alertsEnabled ? 'bg-amber-500 hover:bg-amber-400 text-charcoal-950' : 'bg-charcoal-800 hover:bg-charcoal-700 text-gray-300'
                        }`}
                >
                    {alertsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    {alertsEnabled ? 'Alerts Active' : 'Alerts Paused'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 sticky top-24">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-amber-500" /> Target Budget
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Price (₹)</label>
                                <input
                                    type="number"
                                    value={targetRange.min}
                                    onChange={(e) => setTargetRange({ ...targetRange, min: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Price (₹)</label>
                                <input
                                    type="number"
                                    value={targetRange.max}
                                    onChange={(e) => setTargetRange({ ...targetRange, max: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                            </div>

                            <div className="pt-4 border-t border-charcoal-800">
                                <p className="text-sm text-gray-400 mb-2">Current Range:</p>
                                <div className="flex items-center gap-2 text-lg font-bold text-white">
                                    <span>₹{targetRange.min.toLocaleString()}</span>
                                    <span className="text-charcoal-600">-</span>
                                    <span>₹{targetRange.max.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Guitars in Budget */}
                    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-charcoal-800 flex justify-between items-center bg-charcoal-900">
                            <h2 className="text-xl font-semibold">Guitars in Auto-Alert Range</h2>
                            <span className="text-sm px-2 py-1 rounded-full bg-charcoal-800 text-amber-500 font-medium">
                                {matchingGuitars.length} found
                            </span>
                        </div>

                        <div className="p-6">
                            {matchingGuitars.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {matchingGuitars.map(guitar => (
                                        <div key={guitar.id} className="bg-charcoal-950 border border-charcoal-800 rounded-lg p-4 flex flex-col hover:border-charcoal-700 transition-colors group">
                                            <div className="flex gap-4 mb-4">
                                                <div className="w-16 h-16 rounded bg-white p-1 flex-shrink-0">
                                                    <img src={guitar.imageUrl} alt={guitar.name} className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm text-gray-100 line-clamp-2 transition-colors group-hover:text-amber-500">
                                                        {guitar.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">{guitar.brand}</p>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-charcoal-800">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-amber-500">₹{guitar.currentPrice.toLocaleString()}</span>
                                                    {guitar.originalPrice > guitar.currentPrice && (
                                                        <span className="text-xs text-gray-500 line-through">₹{guitar.originalPrice.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                <a
                                                    href={guitar.productUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs font-medium bg-charcoal-800 hover:bg-charcoal-700 px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    View <ArrowUpRight className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-charcoal-800" />
                                    <p>No guitars found in your target price range currently.</p>
                                    <p className="text-sm mt-2">We'll alert you if any drop into this range.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Big Drops */}
                    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-charcoal-800 bg-charcoal-900 flex justify-between items-center">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <span className="text-rose-500">🔥</span> Huge Price Drops {`>15%`}
                            </h2>
                        </div>

                        <div className="p-6">
                            {bigDrops.length > 0 ? (
                                <div className="space-y-4">
                                    {bigDrops.slice(0, 5).map(guitar => (
                                        <div key={guitar.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-charcoal-950 rounded-lg border border-charcoal-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded bg-white p-1 flex-shrink-0">
                                                    <img src={guitar.imageUrl} alt={guitar.name} className="w-full h-full object-contain mix-blend-multiply" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-100">{guitar.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                                                            {guitar.discountPercent}% OFF
                                                        </span>
                                                        <span className="text-xs text-gray-500 line-through">₹{guitar.originalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-charcoal-800 sm:border-0 justify-between">
                                                <span className="font-bold text-amber-500 text-lg">₹{guitar.currentPrice.toLocaleString()}</span>
                                                <a href={guitar.productUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-charcoal-800 hover:bg-charcoal-700 rounded-md transition-colors">
                                                    <ArrowUpRight className="w-4 h-4 text-gray-300" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-8 text-gray-500">No massive deals at the moment.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
