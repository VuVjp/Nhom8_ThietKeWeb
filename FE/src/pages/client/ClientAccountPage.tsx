import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserCircleIcon, ArrowRightOnRectangleIcon, CalendarDaysIcon, ArrowPathIcon, CreditCardIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { receptionApi } from '../../api/receptionApi';
import { userProfileApi } from '../../api/userProfileApi';
import type { UserProfile } from '../../api/userProfileApi';
import type { Booking } from '../../types/models';
import { getAccessToken, clearAuthTokens } from '../../api/httpClient';
import momoApi from '../../api/momoApi';

export function ClientAccountPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: ''
    });

    const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            navigate('/login');
            return;
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileData, bookingsData] = await Promise.all([
                userProfileApi.getMyProfile(),
                receptionApi.getMyHistory()
            ]);
            setProfile(profileData);
            setBookings(bookingsData);
            setFormData({
                fullName: profileData.fullName,
                phone: profileData.phone
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load account information');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuthTokens();
        localStorage.removeItem('client_auth_mock');
        localStorage.removeItem('client_guest_email');
        toast.success('Logged out successfully');
        navigate('/');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await userProfileApi.updateProfile(formData);
            setProfile(updated);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePayDeposit = async (bookingId: number) => {
        try {
            const res = await momoApi.createPayment({
                type: 'booking',
                targetId: bookingId
            });
            if (res.payUrl) {
                window.location.href = res.payUrl;
            }
        } catch (error) {
            toast.error('Không thể tạo liên kết thanh toán.');
        }
    };

    const handleCancelBooking = (bookingId: number) => {
        setBookingToCancel(bookingId);
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        setIsCancelling(true);
        try {
            await receptionApi.cancelBooking(bookingToCancel);
            toast.success('Booking cancelled successfully!');
            setBookingToCancel(null);
            fetchData(); // Refresh list
        } catch (error) {
            toast.error('Failed to cancel booking. It may be too late to cancel.');
        } finally {
            setIsCancelling(false);
        }
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

    if (loading) {
        return (
            <div className="w-full bg-[#f4f7f6] min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#f4f7f6] min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <div className="pt-[120px] pb-10 bg-slate-900 border-b-4 border-cyan-500">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
                        <p className="text-cyan-400 text-sm tracking-widest uppercase">
                            {profile?.email ? `Signed in as: ${profile.email}` : 'Welcome back'}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sign Out
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
                            <form className="space-y-6 max-w-2xl" onSubmit={handleUpdateProfile}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                                        <input type="email" value={profile?.email || ''} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed" />
                                        <p className="text-xs text-slate-500 mt-1">Contact support to change your email address.</p>
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-cyan-500 transition-colors shadow-md disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
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
                                    onClick={fetchData}
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
                                                <th className="p-5 font-bold">Total</th>
                                                <th className="p-5 font-bold">Status</th>
                                                <th className="p-5 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bookings.map((bkg) => (
                                                <tr key={bkg.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="font-bold text-slate-900 mb-1">{bkg.roomNumbers?.join(', ') || 'N/A'}</div>
                                                        <div className="text-xs text-slate-500">#{bkg.id}</div>
                                                    </td>
                                                    <td className="p-5 text-sm text-slate-600">
                                                        <div className="mb-1"><span className="font-semibold text-slate-400">In:</span> {new Date(bkg.checkInDate).toLocaleDateString()}</div>
                                                        <div><span className="font-semibold text-slate-400">Out:</span> {new Date(bkg.checkOutDate).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="p-5 text-sm text-slate-600">
                                                        <div className="font-bold text-slate-900">${bkg.totalAmount?.toLocaleString()}</div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(bkg.status)}`}>
                                                            {getStatusLabel(bkg.status)}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {bkg.status?.toLowerCase() === 'pending' && (
                                                                <button
                                                                    onClick={() => handlePayDeposit(bkg.id)}
                                                                    className="text-white bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-600/20 active:scale-95 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                                                                >
                                                                    <CreditCardIcon className="w-4 h-4" /> Pay Deposit
                                                                </button>
                                                            )}
                                                            {(bkg.status?.toLowerCase() === 'pending' || bkg.status?.toLowerCase() === 'confirmed') && new Date(bkg.checkInDate) > new Date() && (
                                                                <button
                                                                    onClick={() => handleCancelBooking(bkg.id)}
                                                                    className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded flex items-center gap-1 transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <XMarkIcon className="w-4 h-4" /> Cancel
                                                                </button>
                                                            )}
                                                            {(bkg.status?.toLowerCase() !== 'pending' && bkg.status?.toLowerCase() !== 'confirmed') && (
                                                                <div className="text-slate-400 bg-slate-100 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded flex items-center gap-1 grayscale opacity-60">
                                                                    <CheckCircleIcon className="w-3.5 h-3.5" /> {getStatusLabel(bkg.status)}
                                                                </div>
                                                            )}
                                                        </div>
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

            {/* Cancel Confirmation Modal */}
            {bookingToCancel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XMarkIcon className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Cancel Booking?</h2>
                            <p className="text-slate-500 mb-8">Are you sure you want to cancel booking <strong>#{bookingToCancel}</strong>? This action cannot be undone.</p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmCancel}
                                    disabled={isCancelling}
                                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                                >
                                    {isCancelling ? 'Processing...' : 'Yes, Cancel Booking'}
                                </button>
                                <button
                                    onClick={() => setBookingToCancel(null)}
                                    disabled={isCancelling}
                                    className="w-full py-4 bg-white text-slate-500 border-2 border-slate-100 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
