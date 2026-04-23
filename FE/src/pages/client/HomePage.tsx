import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { Spin } from 'antd';
import { MapPinIcon, StarIcon, ShieldCheckIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function HomePage() {
    const navigate = useNavigate();
    const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

    // Search form state
    const [searchName, setSearchName] = useState('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await roomTypesApi.getAll();
                // Sort by basePrice descending and take top 3
                setRoomTypes(
                    data
                        .filter((rt: RoomTypeItem) => rt.isActive)
                        .sort((a, b) => b.basePrice - a.basePrice)
                        .slice(0, 3)
                );
            } catch (error) {
                console.error("Failed to load rooms", error);
            } finally {
                setLoadingRooms(false);
            }
        };
        fetchRooms();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchName) params.append('name', searchName);
        params.append('adults', adults.toString());
        params.append('children', children.toString());
        
        toast.success('Searching for the perfect room...');
        navigate(`/rooms?${params.toString()}`);
    };

    return (
        <div className="w-full bg-white text-slate-800">
            {/* HERO SECTION */}
            <section className="relative h-[90vh] w-full flex flex-col justify-center items-center overflow-hidden -mt-[88px] pt-[88px]">
                {/* Real Background Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1542314831-c6a4d1409e1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                        alt="Luxury Hotel Facade" 
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80" />
                </div>
                
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full">
                    <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-6 block drop-shadow-md">Welcome to Grandeur</span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                        Experience the <span className="font-light italic">Art</span> of <br /> Luxury Living
                    </h1>
                    
                    {/* Search Form Overlay */}
                    <div className="mt-12 md:mt-16 bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-white/20 shadow-2xl mx-auto w-full max-w-4xl">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-white rounded-xl overflow-hidden flex flex-col justify-center px-4 py-3 text-left">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Search Room</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter room name..." 
                                    className="w-full text-slate-900 font-semibold focus:outline-none placeholder-slate-400"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>
                            <div className="md:w-32 bg-white rounded-xl overflow-hidden flex flex-col justify-center px-4 py-3 text-left">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Adults</label>
                                <input 
                                    type="number" 
                                    min={1}
                                    className="w-full text-slate-900 font-semibold focus:outline-none bg-transparent"
                                    value={adults}
                                    onChange={(e) => setAdults(Number(e.target.value))}
                                />
                            </div>
                            <div className="md:w-32 bg-white rounded-xl overflow-hidden flex flex-col justify-center px-4 py-3 text-left">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Children</label>
                                <input 
                                    type="number" 
                                    min={0}
                                    className="w-full text-slate-900 font-semibold focus:outline-none bg-transparent"
                                    value={children}
                                    onChange={(e) => setChildren(Number(e.target.value))}
                                />
                            </div>
                            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 md:py-0 px-8 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-sm">
                                Search Rooms
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE US */}
            <section className="py-24 bg-white relative">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Item 1 */}
                        <div className="text-center p-6 group">
                            <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300 transform group-hover:rotate-6">
                                <MapPinIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Prime Location</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Situated in the heart of the city, perfectly positioned for both business and leisure.</p>
                        </div>
                        {/* Item 2 */}
                        <div className="text-center p-6 group">
                            <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300 transform group-hover:-rotate-6">
                                <StarIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">5-Star Quality</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Impeccable service, premium amenities, and world-class standards in every detail.</p>
                        </div>
                        {/* Item 3 */}
                        <div className="text-center p-6 group">
                            <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300 transform group-hover:rotate-6">
                                <ShieldCheckIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">24/7 security and strict privacy protocols to ensure your utmost peace of mind.</p>
                        </div>
                        {/* Item 4 */}
                        <div className="text-center p-6 group">
                            <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300 transform group-hover:-rotate-6">
                                <BeakerIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Luxury Amenities</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">From infinity pools to elite spas, everything you need for the perfect relaxation.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURED ROOMS */}
            <section className="py-24 bg-slate-50 relative border-t border-slate-100 border-b">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="flex justify-between items-end mb-16">
                        <div>
                            <span className="text-cyan-600 font-bold tracking-widest uppercase text-sm mb-2 block">Accommodations</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Featured Suites</h2>
                        </div>
                        <Link to="/rooms" className="hidden md:inline-flex items-center font-bold text-slate-900 border-b-2 border-cyan-500 pb-1 hover:text-cyan-600 transition-colors uppercase tracking-widest text-sm">
                            View All Rooms <span className="ml-2">→</span>
                        </Link>
                    </div>

                    {loadingRooms ? (
                        <div className="flex justify-center py-12"><Spin size="large" /></div>
                    ) : roomTypes.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-medium">Rooms updating...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {roomTypes.map((rt) => {
                                const primaryImage = rt.images?.find(img => img.isPrimary) || rt.images?.[0];
                                const displayImage = primaryImage?.url || "https://images.unsplash.com/photo-1618773928112-859e548dbce9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

                                return (
                                    <div key={rt.id} className="bg-white rounded-none border border-slate-100 group overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col text-left">
                                        <div className="relative h-72 overflow-hidden">
                                            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors z-10" />
                                            <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur text-slate-900 px-4 py-2 font-bold text-lg shadow-lg">
                                                ${rt.basePrice.toLocaleString()}<span className="text-xs font-normal text-slate-500">/night</span>
                                            </div>
                                            <img 
                                                src={displayImage} 
                                                alt={rt.name}
                                                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h3 className="text-2xl font-bold mb-3">{rt.name}</h3>
                                            <p className="text-slate-500 text-sm mb-6 flex-1">{rt.description || 'Spacious room with modern interior and premium bedding.'}</p>
                                            <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                                                <span>{rt.capacityAdults + rt.capacityChildren} GUESTS</span>
                                                <span>•</span>
                                                <span>{rt.bedType || 'STANDARD BED'}</span>
                                                <span>•</span>
                                                <span>{rt.view || 'STANDARD VIEW'}</span>
                                            </div>
                                            <Link to={`/rooms/${rt.id}`} className="w-full text-center border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white py-3 font-bold uppercase tracking-widest text-xs transition-colors">
                                                Book Now
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-12 text-center md:hidden">
                        <Link to="/rooms" className="inline-flex items-center font-bold text-slate-900 border-b-2 border-cyan-500 pb-1 hover:text-cyan-600 transition-colors uppercase tracking-widest text-sm">
                            View All Rooms <span className="ml-2">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* GALLERY */}
            <section className="py-24 bg-white">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center mb-16">
                    <span className="text-cyan-600 font-bold tracking-widest uppercase text-sm mb-2 block">Visual Tour</span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Discover Grandeur</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 h-[60vh] gap-2 px-2 max-w-[1600px] mx-auto">
                    <div className="col-span-2 row-span-2 relative group overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Pool" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                    </div>
                    <div className="relative group overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1551882547-ff40c0d129df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Restaurant" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="relative group overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Spa" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="col-span-2 relative group overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Lobby" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24 bg-[#111827] text-white">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center mb-16">
                        <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-2 block">Testimonials</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white">What Our Guests Say</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Review 1 */}
                        <div className="bg-slate-800/50 p-10 border border-slate-700 relative text-left">
                            <div className="text-cyan-500 mb-6 flex">
                                {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <p className="text-slate-300 italic mb-8 leading-relaxed">"Absolutely incredible experience. The attention to detail, the culinary masterpieces, and the view from our suite were completely unmatched. Will definitely return."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xl">S</div>
                                <div>
                                    <h4 className="font-bold">Sarah Jenkins</h4>
                                    <span className="text-xs text-slate-500 uppercase tracking-widest">New York, USA</span>
                                </div>
                            </div>
                        </div>
                        {/* Review 2 */}
                        <div className="bg-slate-800/50 p-10 border border-slate-700 relative transform md:-translate-y-4 text-left">
                            <div className="text-cyan-500 mb-6 flex">
                                {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <p className="text-slate-300 italic mb-8 leading-relaxed">"From the moment we arrived, we were treated like royalty. The spa services are out of this world and the staff is incredibly attentive."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xl">M</div>
                                <div>
                                    <h4 className="font-bold">Michael Chen</h4>
                                    <span className="text-xs text-slate-500 uppercase tracking-widest">London, UK</span>
                                </div>
                            </div>
                        </div>
                        {/* Review 3 */}
                        <div className="bg-slate-800/50 p-10 border border-slate-700 relative text-left">
                            <div className="text-cyan-500 mb-6 flex">
                                {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <p className="text-slate-300 italic mb-8 leading-relaxed">"The perfect destination for our anniversary. They went above and beyond to make our stay special. The infinity pool is breathtaking."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xl">D</div>
                                <div>
                                    <h4 className="font-bold">David & Elena</h4>
                                    <span className="text-xs text-slate-500 uppercase tracking-widest">Sydney, AUS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
