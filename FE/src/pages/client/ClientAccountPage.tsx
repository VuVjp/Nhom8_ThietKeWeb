import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserCircleIcon, ArrowRightOnRectangleIcon, CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface StoredBooking {
    id: string;
    backendId?: number;
    roomName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    total: number;
    status: string;
    email: string;
    createdAt: string;
}

export function ClientAccountPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [bookings, setBookings] = useState<StoredBooking[]>([]);
    const [guestEmail, setGuestEmail] = useState('');

    useEffect(() => {
        // Simple mock check
        if (localStorage.getItem('client_auth_mock') !== 'true') {
            navigate('/login');
        }
        // Load guest email & bookings from localStorage
        const email = localStorage.getItem('client_guest_email') ?? '';
        setGuestEmail(email);
        loadBookings(email);
    }, [navigate]);

    const loadBookings = (email: string) => {
        const stored: StoredBooking[] = JSON.parse(localStorage.getItem('my_bookings') || '[]');
        // If email is known, filter by it; otherwise show all stored
        if (email) {
            setBookings(stored.filter(b => b.email?.toLowerCase() === email.toLowerCase()));
        } else {
            setBookings(stored);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('client_auth_mock');
        toast.success('Logged out successfully');
        navigate('/');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'checkedin': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'checkedout': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'Confirmed';
            case 'pending': return 'Pending';
            case 'cancelled': return 'Cancelled';
            case 'checkedin': return 'Checked In';
            case 'checkedout': return 'Checked Out';
            default: return status;
        }
    };

    return (
        <div className="w-full bg-[#f4f7f6] min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <div className="pt-[120px] pb-10 bg-slate-900 border-b-4 border-cyan-500">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
                        <p className="text-cyan-400 text-sm tracking-widest uppercase">
                            {guestEmail ? `Signed in as: ${guestEmail}` : 'Welcome back'}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest">
                        <ArrowRightOnRectangleIcon className="w-5 h-5"/> Sign Out
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-12 flex flex-col lg:flex-row gap-10">

                {/* SIDEBAR TABS */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-hidden flex flex-col space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'profile' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <UserCircleIcon className="w-5 h-5" /> Profile Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'bookings' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <CalendarDaysIcon className="w-5 h-5" /> Booking History
                            {bookings.length > 0 && (
                                <span className="ml-auto bg-cyan-600 text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                                    {bookings.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-2xl font-bold mb-8 border-b pb-4">Personal Information</h2>
                            <form className="space-y-6 max-w-2xl" onSubmit={(e) => { e.preventDefault(); toast.success('Profile updated successfully!'); }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                                        <input type="text" defaultValue="Guest" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number</label>
                                        <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                                        <input type="email" defaultValue={guestEmail} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed" />
                                        <p className="text-xs text-slate-500 mt-1">Contact support to change your email address.</p>
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-cyan-500 transition-colors shadow-md">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* BOOKINGS TAB */}
                    {activeTab === 'bookings' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-800">Booking History</h2>
                                <button
                                    onClick={() => loadBookings(guestEmail)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                                </button>
                            </div>

                            {bookings.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="text-5xl mb-4">🛎️</div>
                                    <p className="text-xl font-bold text-slate-700 mb-2">No bookings yet</p>
                                    <p className="text-slate-500 mb-6">Your reservations will appear here after you book a room.</p>
                                    <button
                                        onClick={() => navigate('/booking')}
                                        className="bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-700 transition"
                                    >
                                        Book a Room Now
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                <th className="p-5 font-bold">Booking ID / Room</th>
                                                <th className="p-5 font-bold">Dates</th>
                                                <th className="p-5 font-bold">Guests / Total</th>
                                                <th className="p-5 font-bold">Status</th>
                                                <th className="p-5 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bookings.map((bkg) => (
                                                <tr key={bkg.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="font-bold text-slate-900 mb-1">{bkg.roomName}</div>
                                                        <div className="text-xs text-slate-500">{bkg.id}</div>
                                                    </td>
                                                    <td className="p-5 text-sm text-slate-600">
                                                        <div className="mb-1"><span className="font-semibold text-slate-400">In:</span> {bkg.checkIn}</div>
                                                        <div><span className="font-semibold text-slate-400">Out:</span> {bkg.checkOut}</div>
                                                    </td>
                                                    <td className="p-5 text-sm text-slate-600">
                                                        <div className="mb-1">{bkg.guests} Adult(s)</div>
                                                        <div className="font-bold text-slate-900">${bkg.total.toLocaleString()}</div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(bkg.status)}`}>
                                                            {getStatusLabel(bkg.status)}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right space-x-2">
                                                        <button
                                                            onClick={() => toast(`Booking: ${bkg.roomName}\nCheck-in: ${bkg.checkIn}\nCheck-out: ${bkg.checkOut}\nTotal: $${bkg.total}`)}
                                                            className="text-cyan-600 hover:text-cyan-800 font-semibold text-xs uppercase tracking-wider bg-cyan-50 px-3 py-1.5 rounded"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
