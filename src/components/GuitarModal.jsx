import React from 'react';
import { X, ExternalLink, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function GuitarModal({ guitar, onClose }) {
    if (!guitar) return null;

    // Format price history for chart
    const historyData = guitar.priceHistory.map(h => ({
        dateStr: format(parseISO(h.date), 'MMM d, yyyy'),
        price: h.price
    }));

    // Determine trend
    let trend = 'same';
    if (historyData.length > 1) {
        const latest = historyData[historyData.length - 1].price;
        const previous = historyData[historyData.length - 2].price;
        if (latest < previous) trend = 'down';
        else if (latest > previous) trend = 'up';
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-charcoal-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative bg-charcoal-900 border border-charcoal-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-charcoal-800 sticky top-0 bg-charcoal-900/95 backdrop-blur z-10">
                    <div className="pr-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                            {guitar.name}
                        </h2>
                        <p className="text-amber-500 font-medium mt-1">{guitar.brand}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white rounded-full transition-colors absolute right-4 top-4"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col md:flex-row gap-8">

                    {/* Left: Image & Quick Stats */}
                    <div className="w-full md:w-1/3 flex flex-col gap-6">
                        <div className="aspect-square bg-white rounded-xl p-4 flex items-center justify-center">
                            <img
                                src={guitar.imageUrl}
                                alt={guitar.name}
                                className="w-full h-full object-contain mix-blend-multiply"
                            />
                        </div>

                        <div className="bg-charcoal-950 p-4 rounded-xl border border-charcoal-800 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Current Price</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-bold text-amber-500">₹{guitar.currentPrice.toLocaleString()}</span>
                                    {guitar.originalPrice > guitar.currentPrice && (
                                        <span className="text-sm text-gray-500 line-through">₹{guitar.originalPrice.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {guitar.discountPercent > 0 && (
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                        {guitar.discountPercent}% OFF MRP
                                    </span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-charcoal-800">
                                <p className="text-sm text-gray-500 font-medium mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${guitar.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-gray-300">{guitar.inStock ? 'In Stock' : 'Out of Stock'}</span>
                                </div>
                            </div>
                        </div>

                        <a
                            href={guitar.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            View on Bajaao <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Right: Charts & History */}
                    <div className="w-full md:w-2/3 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            Price History
                            {trend === 'down' && <TrendingDown className="w-5 h-5 text-emerald-500" />}
                            {trend === 'up' && <TrendingUp className="w-5 h-5 text-rose-500" />}
                            {trend === 'same' && <Minus className="w-5 h-5 text-gray-500" />}
                        </h3>

                        <div className="bg-charcoal-950 border border-charcoal-800 rounded-xl p-4 h-64 w-full">
                            {historyData.length > 1 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                                        <XAxis
                                            dataKey="dateStr"
                                            stroke="#9ca3af"
                                            fontSize={12}
                                            tickMargin={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            stroke="#9ca3af"
                                            fontSize={12}
                                            tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                            tickLine={false}
                                            axisLine={false}
                                            width={80}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                            labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
                                            itemStyle={{ color: '#f0a500', fontWeight: 'bold' }}
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Price']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#f0a500"
                                            strokeWidth={3}
                                            dot={{ fill: '#f0a500', strokeWidth: 2, r: 4, stroke: '#171717' }}
                                            activeDot={{ r: 6, fill: '#fbbf24', stroke: '#171717' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                    <p>Not enough historical data.</p>
                                    <p className="text-sm mt-1">Check back after the next scrape.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-charcoal-800 flex-grow">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Tracking Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">First Seen</p>
                                    <p className="text-gray-300 font-medium">{format(parseISO(guitar.firstSeen || guitar.priceHistory[0].date), 'PPP')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Lowest Price Tracked</p>
                                    <p className="text-emerald-400 font-medium">
                                        ₹{Math.min(...historyData.map(d => d.price)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
