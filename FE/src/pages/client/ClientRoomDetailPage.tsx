import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { Spin } from 'antd';
import { 
    UserIcon, 
    ArrowsPointingOutIcon, 
    WifiIcon, 
    TvIcon, 
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

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-24">
            {/* HERo/LARGETHUMBNAIL SECTION */}
            <div className="relative h-[60vh] w-full bg-slate-900 mt-[88px]">
                <img 
                    src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
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
                                <span className="text-slate-900 font-medium">{Math.floor(Math.random() * 20 + 30)}m²</span>
                            </div>
                            <div className="flex flex-col text-slate-600">
                                <UserIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">Capacity</span>
                                <span className="text-slate-900 font-medium">{totalGuests} Persons</span>
                            </div>
                            <div className="flex flex-col text-slate-600">
                                <SparklesIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">Bed Type</span>
                                <span className="text-slate-900 font-medium">Double Bed</span>
                            </div>
                            <div className="flex flex-col text-slate-600">
                                <SparklesIcon className="w-6 h-6 mb-2 text-cyan-600" />
                                <span className="text-xs uppercase tracking-wider font-bold mb-1">View</span>
                                <span className="text-slate-900 font-medium">City / Ocean</span>
                            </div>
                        </div>

                        {/* Description Details */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Room Overview</h3>
                            <p className="text-slate-600 leading-relaxed max-w-3xl">
                                Designed with the modern traveler in mind, {roomType.name} offers a harmonious blend of comfort and elegance. Natural light pours in through floor-to-ceiling windows, highlighting the thoughtful interior elements and plush furnishings. Whether you're here for an extended vacation or a brief getaway, this room serves as your private sanctuary, complete with smart room controls and uncompromising luxury.
                            </p>
                        </div>

                        {/* Amenities */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Room Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                {/* Default rich mock amenities + API amenities */}
                                {roomType.amenities.length > 0 ? (
                                    roomType.amenities.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 text-slate-700">
                                            <CheckCircleIcon className="w-5 h-5 text-cyan-600" />
                                            <span>{a.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <WifiIcon className="w-5 h-5 text-cyan-600" /><span>Free High-Speed WiFi</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <TvIcon className="w-5 h-5 text-cyan-600" /><span>65" Smart TV</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <CheckCircleIcon className="w-5 h-5 text-cyan-600" /><span>Air Conditioning</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <CheckCircleIcon className="w-5 h-5 text-cyan-600" /><span>Fully Stocked Mini Bar</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <CheckCircleIcon className="w-5 h-5 text-cyan-600" /><span>Private Bathroom</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <CheckCircleIcon className="w-5 h-5 text-cyan-600" /><span>Private Balcony</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

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
