import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { Spin } from 'antd';
import { UserIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ROOM_IMAGES = [
    'https://images.unsplash.com/photo-1618773928112-859e548dbce9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89d14565b24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584622839958-86d11e5a5573?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

const SORT_OPTIONS = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'guests_desc', label: 'Most Guests First' },
    { value: 'name_asc', label: 'Name: A → Z' },
];

export function ClientRoomsPage() {
    const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [maxPrice, setMaxPrice] = useState<number>(10000);
    const [minGuests, setMinGuests] = useState<number>(1);
    const [sortBy, setSortBy] = useState('default');
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        const fetchRoomTypes = async () => {
            try {
                const data = await roomTypesApi.getAll();
                setRoomTypes(data.filter((rt: RoomTypeItem) => rt.isActive));
            } catch (error) {
                console.error('Failed to load room types', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoomTypes();
    }, []);

    // Dynamically compute max possible price for the slider
    const maxBasePrice = useMemo(() =>
        roomTypes.length > 0 ? Math.max(...roomTypes.map(r => r.basePrice)) : 10000,
    [roomTypes]);

    // Initialize slider to max price once loaded
    useEffect(() => {
        if (!loading) setMaxPrice(maxBasePrice);
    }, [loading, maxBasePrice]);

    // Active filters count badge
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (maxPrice < maxBasePrice) count++;
        if (minGuests > 1) count++;
        if (sortBy !== 'default') count++;
        return count;
    }, [searchQuery, maxPrice, minGuests, sortBy, maxBasePrice]);

    const handleReset = () => {
        setSearchQuery('');
        setMaxPrice(maxBasePrice);
        setMinGuests(1);
        setSortBy('default');
    };

    // Filtered & sorted list
    const filteredRooms = useMemo(() => {
        let result = roomTypes.filter(rt => {
            const q = searchQuery.toLowerCase();
            const matchesName = rt.name.toLowerCase().includes(q) || rt.description?.toLowerCase().includes(q);
            const matchesPrice = rt.basePrice <= maxPrice;
            const matchesGuests = (rt.capacityAdults + rt.capacityChildren) >= minGuests;
            return matchesName && matchesPrice && matchesGuests;
        });

        switch (sortBy) {
            case 'price_asc': result = [...result].sort((a, b) => a.basePrice - b.basePrice); break;
            case 'price_desc': result = [...result].sort((a, b) => b.basePrice - a.basePrice); break;
            case 'guests_desc': result = [...result].sort((a, b) => (b.capacityAdults + b.capacityChildren) - (a.capacityAdults + a.capacityChildren)); break;
            case 'name_asc': result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
        }

        return result;
    }, [roomTypes, searchQuery, maxPrice, minGuests, sortBy]);

    return (
        <div className="w-full bg-[#f9fafb] min-h-screen font-sans text-slate-800">
            {/* Hero Banner */}
            <div className="relative bg-slate-900 overflow-hidden mt-[88px]">
                <img
                    src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt="Rooms Banner"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="relative z-10 text-center py-24 px-4 max-w-4xl mx-auto">
                    <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Accommodations</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
                        Our Suites & Rooms
                    </h1>
                    <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                        Discover our collection of premium accommodations, thoughtfully designed for an unforgettable stay.
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12">

                {/* FILTER BAR */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
                    {/* Top row: Search + Sort + Filter toggle */}
                    <div className="flex flex-col md:flex-row items-center gap-4 p-5 border-b border-slate-100">
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search rooms by name or description..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="flex-shrink-0 w-full md:w-56">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all border ${
                                filtersOpen || activeFilterCount > 0
                                    ? 'bg-cyan-600 text-white border-cyan-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400'
                            }`}
                        >
                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 bg-white text-cyan-700 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Expanded filters panel */}
                    {filtersOpen && (
                        <div className="p-6 bg-slate-50 flex flex-col md:flex-row gap-8 items-start md:items-center border-t border-slate-100">
                            {/* Price range */}
                            <div className="flex-1 w-full">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Max Price</label>
                                    <span className="text-sm font-bold text-cyan-600">${maxPrice.toLocaleString()}<span className="text-slate-400 font-normal">/night</span></span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={maxBasePrice}
                                    step={10}
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-cyan-600"
                                />
                                <div className="flex justify-between mt-1 text-xs text-slate-400">
                                    <span>$0</span>
                                    <span>${maxBasePrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Min guests */}
                            <div className="flex-shrink-0">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">Min Guests</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setMinGuests(g => Math.max(1, g - 1))}
                                        className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-lg font-bold hover:bg-cyan-50 hover:border-cyan-400 transition"
                                    >−</button>
                                    <span className="text-lg font-bold w-8 text-center">{minGuests}</span>
                                    <button
                                        onClick={() => setMinGuests(g => g + 1)}
                                        className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-lg font-bold hover:bg-cyan-50 hover:border-cyan-400 transition"
                                    >+</button>
                                </div>
                            </div>

                            {/* Reset */}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={handleReset}
                                    className="flex-shrink-0 flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-bold uppercase tracking-wider transition"
                                >
                                    <XMarkIcon className="w-4 h-4" /> Clear All
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Result count */}
                {!loading && (
                    <div className="mb-6 flex justify-between items-center">
                        <p className="text-slate-500 text-sm">
                            Showing <span className="font-bold text-slate-800">{filteredRooms.length}</span> of <span className="font-bold text-slate-800">{roomTypes.length}</span> rooms
                        </p>
                    </div>
                )}

                {/* RESULTS */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Spin size="large" />
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="text-5xl mb-4">🛏️</div>
                        <p className="text-xl font-bold text-slate-700 mb-2">No rooms found</p>
                        <p className="text-slate-500 mb-6">Try adjusting your search or filters.</p>
                        <button onClick={handleReset} className="bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-700 transition">
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredRooms.map((rt, idx) => (
                            <div key={rt.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-500 border border-slate-100 flex flex-col">
                                {/* Image */}
                                <div className="h-64 bg-slate-200 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <span className="bg-white/90 backdrop-blur text-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded">
                                            From ${rt.basePrice.toLocaleString()}/night
                                        </span>
                                    </div>
                                    <img
                                        src={ROOM_IMAGES[idx % ROOM_IMAGES.length]}
                                        alt={rt.name}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>

                                <div className="p-7 flex-1 flex flex-col">
                                    <h2 className="text-xl font-bold text-slate-900 mb-2">{rt.name}</h2>

                                    <p className="text-slate-500 mb-5 flex-1 text-sm leading-relaxed line-clamp-2">
                                        {rt.description || 'Experience ultimate luxury in our elegantly appointed rooms featuring premium bedding and state-of-the-art amenities.'}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <div className="p-1.5 rounded-full bg-cyan-50 text-cyan-600"><UserIcon className="w-4 h-4" /></div>
                                            <span>Max {rt.capacityAdults + rt.capacityChildren} Guests</span>
                                        </div>
                                        <span className="text-slate-200">|</span>
                                        <span className="text-slate-400 text-xs uppercase tracking-wider">Adults: {rt.capacityAdults} · Kids: {rt.capacityChildren}</span>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            to={`/rooms/${rt.id}`}
                                            className="flex-1 text-center py-3 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-cyan-600 transition-colors shadow-sm"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={`/booking?room=${rt.id}`}
                                            className="flex-1 text-center py-3 border-2 border-slate-900 text-slate-900 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-900 hover:text-white transition-colors"
                                        >
                                            Book Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
