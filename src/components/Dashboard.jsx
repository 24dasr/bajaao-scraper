import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Bookmark, BookmarkPlus } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import GuitarModal from './GuitarModal';

export default function Dashboard({ data }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [watchedIds, setWatchedIds] = useState([]);
    const [selectedGuitar, setSelectedGuitar] = useState(null);
    const [sortConfigs, setSortConfigs] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('bajaao_watchlist');
        if (saved) {
            try {
                setWatchedIds(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const toggleWatch = (id, e) => {
        e.stopPropagation();
        let updated;
        if (watchedIds.includes(id)) {
            updated = watchedIds.filter(wId => wId !== id);
        } else {
            updated = [...watchedIds, id];
        }
        setWatchedIds(updated);
        localStorage.setItem('bajaao_watchlist', JSON.stringify(updated));
    };

    // Basic stats
    const totalGuitars = data.length;
    const inStockCount = data.filter(g => g.inStock).length;
    const avgPrice = Math.round(data.reduce((acc, g) => acc + g.currentPrice, 0) / data.length) || 0;
    const maxDiscount = Math.max(...data.map(g => g.discountPercent), 0);

    // Filtered & Sorted data
    const filteredData = useMemo(() => {
        let result = data.filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.brand.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStock = inStockOnly ? g.inStock : true;
            return matchesSearch && matchesStock;
        });

        if (sortConfigs.length > 0) {
            result.sort((a, b) => {
                for (const config of sortConfigs) {
                    let aVal = a[config.key];
                    let bVal = b[config.key];

                    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                    if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return result;
    }, [data, searchTerm, inStockOnly, sortConfigs]);

    const requestSort = (key, event) => {
        let newSortConfigs = [...sortConfigs];
        const existingIndex = newSortConfigs.findIndex(c => c.key === key);

        if (event.shiftKey) {
            // Multi-sort
            if (existingIndex >= 0) {
                if (newSortConfigs[existingIndex].direction === 'asc') {
                    newSortConfigs[existingIndex].direction = 'desc';
                } else {
                    newSortConfigs.splice(existingIndex, 1);
                }
            } else {
                newSortConfigs.push({ key, direction: 'asc' });
            }
        } else {
            // Single sort
            if (existingIndex >= 0 && newSortConfigs.length === 1) {
                if (newSortConfigs[existingIndex].direction === 'asc') {
                    newSortConfigs = [{ key, direction: 'desc' }];
                } else {
                    newSortConfigs = [];
                }
            } else {
                newSortConfigs = [{ key, direction: 'asc' }];
            }
        }

        setSortConfigs(newSortConfigs);
    };

    const getSortIndicator = (key) => {
        const index = sortConfigs.findIndex(c => c.key === key);
        if (index < 0) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        const dir = sortConfigs[index].direction === 'asc' ? '↑' : '↓';
        const multi = sortConfigs.length > 1 ? <span className="text-[10px] ml-1 opacity-70">({index + 1})</span> : null;
        return <span className="flex items-center text-amber-500 ml-1 font-bold">{dir} {multi}</span>;
    };

    // General Market Trend (Average Price over time)
    const marketTrendData = useMemo(() => {
        const dateMap = {};
        data.forEach(g => {
            g.priceHistory.forEach(h => {
                const dateStr = h.date.split('T')[0];
                if (!dateMap[dateStr]) dateMap[dateStr] = { count: 0, total: 0 };
                dateMap[dateStr].total += h.price;
                dateMap[dateStr].count += 1;
            });
        });
        return Object.keys(dateMap).sort().map(date => {
            const [y, m, d] = date.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return {
                dateStr: `${months[parseInt(m) - 1]} ${parseInt(d)}`,
                Average: Math.round(dateMap[date].total / dateMap[date].count)
            };
        });
    }, [data]);

    // Chart data (top 10 discounts)
    const chartData = useMemo(() => {
        return [...filteredData]
            .sort((a, b) => b.discountPercent - a.discountPercent)
            .slice(0, 10)
            .map(g => ({
                name: g.name.length > 20 ? g.name.substring(0, 20) + '...' : g.name,
                fullName: g.name,
                Price: g.currentPrice,
                Original: g.originalPrice,
                Discount: g.discountPercent
            }));
    }, [filteredData]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-charcoal-900 border border-charcoal-800 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm font-medium">Total Guitars Tracked</p>
                    <p className="text-3xl font-bold text-white mt-2">{totalGuitars}</p>
                </div>
                <div className="bg-charcoal-900 border border-charcoal-800 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm font-medium">In Stock</p>
                    <p className="text-3xl font-bold text-emerald-500 mt-2">{inStockCount}</p>
                </div>
                <div className="bg-charcoal-900 border border-charcoal-800 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm font-medium">Average Price</p>
                    <p className="text-3xl font-bold text-amber-500 mt-2">₹{avgPrice.toLocaleString()}</p>
                </div>
                <div className="bg-charcoal-900 border border-charcoal-800 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm font-medium">Highest Discount</p>
                    <p className="text-3xl font-bold text-rose-500 mt-2">{maxDiscount}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Filters & Chart */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Filters */}
                    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-amber-500" /> Filters
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search guitars, brands..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="inStock"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500/50 bg-charcoal-950 accent-amber-500"
                                />
                                <label htmlFor="inStock" className="text-sm font-medium text-gray-300 cursor-pointer">
                                    In Stock Only
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Chart 1 */}
                    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            Top Discounts
                        </h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#2d2d2d' }}
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="Discount" name="Discount %" fill="#f0a500" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Market Trend */}
                    {marketTrendData.length > 0 && (
                        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                Market Trend (Average Price)
                            </h2>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={marketTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                                        <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#9ca3af"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={['auto', 'auto']}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#2d2d2d' }}
                                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                            labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
                                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="Average" name="Avg Price ₹" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Data Table */}
                <div className="lg:col-span-2">
                    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden flex flex-col h-[800px]">
                        <div className="p-6 border-b border-charcoal-800 flex justify-between items-center bg-charcoal-900">
                            <h2 className="text-xl font-semibold">Guitar Listings</h2>
                            <span className="text-sm text-gray-400">{filteredData.length} results</span>
                        </div>

                        <div className="overflow-auto flex-grow">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-charcoal-950/50 sticky top-0 z-10 text-gray-400">
                                    <tr>
                                        <th className="py-4 px-6 font-medium cursor-pointer hover:text-white transition-colors select-none" onClick={(e) => requestSort('name', e)} title="Shift+Click to sort by multiple columns">
                                            <div className="flex items-center">Product {getSortIndicator('name')}</div>
                                        </th>
                                        <th className="py-4 px-6 font-medium cursor-pointer hover:text-white transition-colors select-none" onClick={(e) => requestSort('brand', e)} title="Shift+Click to sort by multiple columns">
                                            <div className="flex items-center">Brand {getSortIndicator('brand')}</div>
                                        </th>
                                        <th className="py-4 px-6 font-medium cursor-pointer hover:text-white transition-colors select-none" onClick={(e) => requestSort('currentPrice', e)} title="Shift+Click to sort by multiple columns">
                                            <div className="flex items-center">Price {getSortIndicator('currentPrice')}</div>
                                        </th>
                                        <th className="py-4 px-6 font-medium cursor-pointer hover:text-white transition-colors select-none" onClick={(e) => requestSort('inStock', e)} title="Shift+Click to sort by multiple columns">
                                            <div className="flex items-center">Status {getSortIndicator('inStock')}</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal-800">
                                    {filteredData.map((guitar) => (
                                        <tr
                                            key={guitar.id}
                                            onClick={() => setSelectedGuitar(guitar)}
                                            className="hover:bg-white/5 transition-colors group cursor-pointer"
                                        >
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={(e) => toggleWatch(guitar.id, e)}
                                                        className="p-1 hover:bg-charcoal-800 rounded-md transition-colors"
                                                        title={watchedIds.includes(guitar.id) ? "Remove from Watchlist" : "Add to Watchlist"}
                                                    >
                                                        {watchedIds.includes(guitar.id)
                                                            ? <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
                                                            : <BookmarkPlus className="w-5 h-5 text-gray-500 hover:text-amber-500" />
                                                        }
                                                    </button>
                                                    <div className="w-10 h-10 rounded-md bg-white p-1 flex-shrink-0">
                                                        <img
                                                            src={guitar.imageUrl}
                                                            alt={guitar.name}
                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="max-w-[200px] sm:max-w-xs md:max-w-sm overflow-hidden text-ellipsis">
                                                        <span className="font-medium text-white group-hover:text-amber-500 transition-colors">
                                                            {guitar.name}
                                                        </span>
                                                        {guitar.discountPercent > 0 && (
                                                            <div className="text-xs text-rose-500 mt-0.5 mt-1 font-semibold">
                                                                {guitar.discountPercent}% OFF
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-gray-300">{guitar.brand}</td>
                                            <td className="py-3 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-amber-500">₹{guitar.currentPrice.toLocaleString()}</span>
                                                    {guitar.originalPrice > guitar.currentPrice && (
                                                        <span className="text-xs text-gray-500 line-through">₹{guitar.originalPrice.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${guitar.inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {guitar.inStock ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center text-gray-400">
                                                No guitars found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {selectedGuitar && (
                <GuitarModal
                    guitar={selectedGuitar}
                    onClose={() => setSelectedGuitar(null)}
                />
            )}
        </div>
    );
}
