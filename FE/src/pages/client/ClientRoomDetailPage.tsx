import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { Spin } from 'antd';
import {
    UserIcon,
    ArrowsPointingOutIcon,
    SparklesIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    NoSymbolIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ClientRoomDetailPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const [roomType, setRoomType] = useState<RoomTypeItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            if (!roomId) return;
            try {
                // If API fails we have a fallback mock just in case
                const data = await roomTypesApi.getById(Number(roomId));
                setRoomType(data);
            } catch (error) {
                console.error('Failed to load room details', error);
                toast.error('Could not fetch room details.');
                navigate('/rooms');
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [roomId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Spin size="large" />
            </div>
        );
    }

    if (!roomType) return null;

    const totalGuests = roomType.capacityAdults + roomType.capacityChildren;
    const primaryImage = roomType.images?.find(img => img.isPrimary) || roomType.images?.[0];
    const heroImage = primaryImage?.url || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-24">
            {/* HERo/LARGETHUMBNAIL SECTION */}
            <div className="relative h-[60vh] w-full bg-slate-900 mt-[88px]">
                <img
                    src={heroImage}
                    alt={roomType.name}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute inset-0 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-end pb-16">
                    <Link to="/rooms" className="text-white/80 hover:text-white flex items-center gap-2 font-semibold uppercase tracking-widest text-xs mb-6 w-max">
                        <ArrowLeftIcon className="w-4 h-4" /> Back to Rooms
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{roomType.name}</h1>
                            <p className="text-slate-300 text-lg">{roomType.description || 'Spacious double room with premium bedding, modern interior, and panoramic city view.'}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl flex-shrink-0">
                            <span className="text-slate-300 text-sm uppercase tracking-wider block mb-1">Starting From</span>
                            <div className="text-4xl font-bold text-cyan-400 mb-4">${roomType.basePrice.toLocaleString()} <span className="text-lg text-slate-300 font-normal">/ night</span></div>
                            <Link to={`/booking?room=${roomType.id}`} className="block w-full bg-cyan-600 hover:bg-cyan-500 text-white text-center py-3 px-8 rounded-lg font-bold uppercase tracking-widest text-sm transition-colors shadow-lg shadow-cyan-600/30">
                                Book Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILS CONTENT */}
            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* LEFT COL: INFO */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Highlights */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-slate-200 py-8">
                            <div className="flex flex-col text-slate-600">
                                <ArrowsPointingOutIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">Size</span>
                                <span className="text-slate-900 font-medium">{roomType.sizeM2 != null ? `${roomType.sizeM2} m²` : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-slate-600">
                                <UserIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">Capacity</span>
                                <span className="text-slate-900 font-medium">{totalGuests} Persons</span>
                                <span className="text-xs text-slate-400 mt-0.5">
                                    {roomType.capacityAdults} adults · {roomType.capacityChildren} children
                                </span>
                            </div>
                            <div className="flex flex-col text-slate-600">
                                <SparklesIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">Bed Type</span>
                                <span className="text-slate-900 font-medium">{roomType.bedType || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-slate-600">
                                <SparklesIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">View</span>
                                <span className="text-slate-900 font-medium">{roomType.view || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Description Details */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Room Overview</h3>
                            <p className="text-slate-600 leading-relaxed max-w-3xl">
                                {roomType.description || 'A premium room crafted for comfort and style. Enjoy a relaxing stay with top-notch furnishings, modern amenities, and impeccable service from our hospitality team.'}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Room Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                {roomType.amenities.length > 0 ? (
                                    roomType.amenities.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 text-slate-700">
                                            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-cyan-50 p-2 shadow-sm flex-shrink-0">
                                                {a.iconUrl ? (
                                                    <img src={a.iconUrl} alt={a.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <CheckCircleIcon className="w-9 h-9 text-cyan-600" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium">{a.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic col-span-full">No amenities listed for this room type.</p>
                                )}
                            </div>
                        </div>

                        {/* Equipments */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">In-Room Equipment</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                {roomType.equipments.length > 0 ? (
                                    roomType.equipments.map(e => (
                                        <div key={e.id} className="flex items-center gap-3 text-slate-700">
                                            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-slate-100 p-2 shadow-sm">
                                                {e.imageUrl ? (
                                                    <img src={e.imageUrl} alt={e.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <SparklesIcon className="w-9 h-9 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold block leading-tight">{e.name}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{e.category}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic col-span-full">High-quality standard equipment included.</p>
                                )}
                            </div>
                        </div>
                        {/* Gallery */}
                        {roomType.images.length > 0 && (
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">Room Gallery</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {[...roomType.images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)).map((img) => (
                                        <div key={img.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer">
                                            <img
                                                src={img.url}
                                                alt="Room detail"
                                                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>

                    {/* RIGHT COL: POLICY CORNER */}
                    <div>
                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm sticky top-32">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Hotel Policies</h3>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Check-In / Out</h4>
                                    <div className="flex justify-between items-center text-slate-700 border-b border-slate-100 pb-3">
                                        <span>Check-in</span>
                                        <span className="font-bold">14:00 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700 pt-3">
                                        <span>Check-out</span>
                                        <span className="font-bold">12:00 PM</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Rules</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-slate-700">
                                            <NoSymbolIcon className="w-5 h-5 text-red-500" />
                                            <span>No Smoking</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-700">
                                            <NoSymbolIcon className="w-5 h-5 text-red-500" />
                                            <span>No Pets Allowed</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-200">
                                <p className="text-xs text-slate-500 text-center mb-4">Have special requests or need an extra bed? Our concierge is available 24/7.</p>
                                <button onClick={() => toast('Contacting concierge...', { icon: '📞' })} className="w-full border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-widest text-xs py-3 rounded-lg hover:bg-slate-900 hover:text-white transition-colors">
                                    Contact Concierge
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
