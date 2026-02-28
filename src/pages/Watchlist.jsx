import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark, BookmarkMinus, TrendingDown, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function Watchlist({ data }) {
    const [watchedIds, setWatchedIds] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('bajaao_watchlist');
        if (saved) {
            try {
                setWatchedIds(JSON.parse(saved));
            } catch (e) {
                console.error("Could not parse watchlist");
            }
        }
    }, []);

    const removeWatch = (id) => {
        const updated = watchedIds.filter(wId => wId !== id);
        setWatchedIds(updated);
        localStorage.setItem('bajaao_watchlist', JSON.stringify(updated));
    };

    const watchedGuitars = useMemo(() => data.filter(g => watchedIds.includes(g.id)), [data, watchedIds]);

    const chartData = useMemo(() => {
        if (watchedGuitars.length === 0) return [];
        const allDates = new Set();
        watchedGuitars.forEach(g => {
            g.priceHistory.forEach(h => allDates.add(h.date));
        });
        const sortedDates = Array.from(allDates).sort();

        return sortedDates.map(date => {
            const dataPoint = { dateStr: format(parseISO(date), 'MMM d') };
            watchedGuitars.forEach(g => {
                const historyPoint = g.priceHistory.find(h => h.date === date);
                if (historyPoint) {
                    dataPoint[g.id] = historyPoint.price;
                    g._lastPrice = historyPoint.price;
                } else if (g._lastPrice) {
                    dataPoint[g.id] = g._lastPrice;
                }
            });
            return dataPoint;
        });
    }, [watchedGuitars]);

    // Overall price trend (sum of prices of all watched guitars)
    const overallChartData = useMemo(() => {
        if (chartData.length === 0) return [];
        return chartData.map(entry => {
            const { dateStr, ...prices } = entry;
            const total = Object.values(prices).reduce((sum, p) => sum + (p || 0), 0);
            return { dateStr, total };
        });
    }, [chartData]);

    const colors = ['#f0a500', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 flex items-center gap-3">
                    <Bookmark className="w-8 h-8 text-amber-500" />
                    My Watchlist
                </h1>
                <p className="text-gray-400 mt-2">Track specific guitars over time to catch the best deals.</p>
            </div>

            <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden min-h-[400px]">
                {watchedGuitars.length > 0 ? (
                    <>
                        {/* Overall Price Trend Chart */}
                        {overallChartData.length > 0 && (
                            <div className="p-6 border-b border-charcoal-800">
                                <h2 className="text-xl font-semibold mb-6">Overall Price Trend</h2>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={overallChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                                            <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                stroke="#9ca3af"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                width={80}
                                            />
                                            <RechartsTooltip
                                                cursor={{ fill: '#2d2d2d' }}
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                                labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
                                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Total']}
                                            />
                                            <Line type="monotone" dataKey="total" name="Total" stroke="#f0a500" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                        {/* Existing multi-line price history comparison chart */}
                        {chartData.length > 0 && (
                            <div className="p-6 border-b border-charcoal-800">
                                <h2 className="text-xl font-semibold mb-6">Price History Comparison</h2>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                                            <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                stroke="#9ca3af"
                                                fontSize={12}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                tickLine={false}
                                                axisLine={false}
                                                width={80}
                                            />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                                labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
                                                formatter={(value, name) => [`₹${value.toLocaleString()}`, watchedGuitars.find(g => g.id === name)?.name || name]}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            {watchedGuitars.map((g, idx) => (
                                                <Line
                                                    key={g.id}
                                                    type="monotone"
                                                    dataKey={g.id}
                                                    name={g.id}
                                                    stroke={colors[idx % colors.length]}
                                                    strokeWidth={2}
                                                    dot={{ r: 3, strokeWidth: 0 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                        <div className="divide-y divide-charcoal-800">
                            {watchedGuitars.map(guitar => {
                                // Calculate lowest price in history
                                const lowestPrice = Math.min(...guitar.priceHistory.map(h => h.price), guitar.currentPrice);
                                const isAtLowest = guitar.currentPrice <= lowestPrice;

                                return (
                                    <div key={guitar.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-charcoal-950/50 transition-colors">
                                        <div className="w-24 h-24 rounded-lg bg-white p-2 flex-shrink-0">
                                            <img src={guitar.imageUrl} alt={guitar.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>

                                        <div className="flex-grow space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                <a href={guitar.productUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-medium text-white hover:text-amber-500 transition-colors">
                                                    {guitar.name}
                                                </a>
                                                <button
                                                    onClick={() => removeWatch(guitar.id)}
                                                    className="text-gray-500 hover:text-rose-500 flex items-center gap-1 text-sm transition-colors py-1 px-2 rounded-md hover:bg-rose-500/10"
                                                >
                                                    <BookmarkMinus className="w-4 h-4" /> Remove
                                                </button>
                                            </div>

                                            <p className="text-sm text-gray-400">{guitar.brand}</p>

                                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-amber-500">₹{guitar.currentPrice.toLocaleString()}</span>
                                                    {guitar.originalPrice > guitar.currentPrice && (
                                                        <span className="text-sm text-gray-500 line-through">₹{guitar.originalPrice.toLocaleString()}</span>
                                                    )}
                                                </div>

                                                {isAtLowest && guitar.discountPercent > 0 && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                        <TrendingDown className="w-3 h-3" /> Lowest Price Tracked
                                                    </span>
                                                )}

                                                {!guitar.inStock && (
                                                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
                        <EyeOff className="w-16 h-16 mb-4 text-charcoal-800" />
                        <p className="text-lg">Your watchlist is completely empty.</p>
                        <p className="text-sm mt-2">Go to the Dashboard and click the bookmark icon to save guitars here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
