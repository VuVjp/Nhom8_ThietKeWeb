    import { useState, useEffect } from 'react';
    import { useSearchParams, useNavigate } from 'react-router-dom';
    import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
    import { receptionApi } from '../../api/receptionApi';
    import toast from 'react-hot-toast';
    import { ShieldCheckIcon, CreditCardIcon, InformationCircleIcon, MapPinIcon, CalendarDaysIcon, UserGroupIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon, TicketIcon, XMarkIcon } from '@heroicons/react/24/outline';
    import type { RoomAvailability, Voucher } from '../../types/models';
    import { useAppAuth } from '../../auth/useAppAuth';
    import { vouchersApi } from '../../api/vouchersApi';
    import { usersApi } from '../../api/usersApi';
    import { toApiError } from '../../api/httpClient';
    import momoApi from '../../api/momoApi';

    export function ClientBookingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAppAuth();
    const roomIdParam = searchParams.get('room');

    const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
    const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeItem | null>(null);
    const [nights, setNights] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [availableRooms, setAvailableRooms] = useState<RoomAvailability[]>([]);
    const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Voucher & Membership State
    const [voucherCode, setVoucherCode] = useState('');
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [membershipInfo, setMembershipInfo] = useState({ tier: '', discount: 0 });

    // Form inputs
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '2',
        notes: ''
    });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [recentBooking, setRecentBooking] = useState<any>(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await roomTypesApi.getAll();
                const activeRooms = data.filter(rt => rt.isActive);
                setRoomTypes(activeRooms);

                if (roomIdParam) {
                    const r = activeRooms.find(x => x.id === Number(roomIdParam));
                    if (r) setSelectedRoomType(r);
                } else if (activeRooms.length > 0) {
                    setSelectedRoomType(activeRooms[0]);
                }
            } catch (error) {
                console.error("Failed to fetch rooms for booking", error);
            }
        };
        fetchRooms();
    }, [roomIdParam]);

    // Auto-fill for logged-in users
    useEffect(() => {
        if (isAuthenticated && user?.email) {
            const fetchMembership = async () => {
                try {
                    const info = await usersApi.isAvailable(user.email);
                    setMembershipInfo({ tier: info.membershipTierName, discount: info.discountPercent });
                    setFormData(prev => ({
                        ...prev,
                        fullName: info.fullName || user.name || prev.fullName,
                        email: user.email || prev.email,
                        phone: info.phone || prev.phone
                    }));
                } catch (e) {
                    console.error("Failed to fetch membership info", e);
                }
            };
            fetchMembership();
        }
    }, [isAuthenticated, user]);

    // Auto-calculate nights based on dates
    useEffect(() => {
        if (formData.checkIn && formData.checkOut) {
            const d1 = new Date(formData.checkIn);
            const d2 = new Date(formData.checkOut);
            if (d2 > d1) {
                const diffTime = Math.abs(d2.getTime() - d1.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setNights(diffDays);
            } else {
                setNights(0);
            }
        }
    }, [formData.checkIn, formData.checkOut]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const r = roomTypes.find(x => x.id === Number(e.target.value));
        if (r) setSelectedRoomType(r);
    };

    const handlePayment = async () => {
        if (!recentBooking) return;
        try {
            const res = await momoApi.createPayment({
                type: 'booking',
                targetId: recentBooking.id
            });
            if (res.payUrl) {
                window.location.href = res.payUrl;
            }
        } catch (error) {
            toast.error('Không thể tạo liên kết thanh toán.');
        }
    };

    const handleSearchRooms = async () => {
        if (!formData.checkIn || !formData.checkOut) {
            toast.error("Vui lòng chọn ngày nhận và trả phòng!");
            return;
        }
        if (nights <= 0) {
            toast.error("Ngày trả phòng phải sau ngày nhận phòng!");
            return;
        }

        setIsSearching(true);
        try {
            const checkInISO = new Date(formData.checkIn).toISOString();
            const checkOutISO = new Date(formData.checkOut).toISOString();
            const rooms = await receptionApi.getAvailableRooms(checkInISO, checkOutISO);

            // Filter rooms by selected type
            const filtered = selectedRoomType
                ? rooms.filter(r => r.roomTypeName?.toLowerCase() === selectedRoomType.name?.toLowerCase())
                : rooms;

            setAvailableRooms(filtered);
            setStep(2);
            setSelectedRoomIds([]); // Reset selection when searching new dates
        } catch (error) {
            toast.error("Không thể tìm phòng trống. Vui lòng thử lại.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleRoomToggle = (roomId: number) => {
        setSelectedRoomIds(prev =>
            prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
    };

    const handleCheckVoucher = async () => {
        if (!voucherCode.trim()) {
            toast.error('Vui lòng nhập mã giảm giá.');
            return;
        }

        const selectedRoomsData = availableRooms.filter(r => selectedRoomIds.includes(r.roomId));
        const baseTotal = selectedRoomsData.reduce((sum, r) => sum + r.pricePerNight, 0) * nights;

        setIsCheckingVoucher(true);
        try {
            const voucher = await vouchersApi.validate(voucherCode.trim(), baseTotal);
            setAppliedVoucher(voucher);
            toast.success('🎉 Áp dụng mã giảm giá thành công!');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
            setAppliedVoucher(null);
        } finally {
            setIsCheckingVoucher(false);
        }
    };

    const calculateTotals = () => {
        const selectedRoomsData = availableRooms.filter(r => selectedRoomIds.includes(r.roomId));
        const baseTotal = selectedRoomsData.reduce((sum, r) => sum + r.pricePerNight, 0) * nights;

        const membershipDiscount = Math.round((baseTotal * membershipInfo.discount) / 100);

        let voucherDiscount = 0;
        if (appliedVoucher) {
            if (appliedVoucher.discountType === 'Percentage') {
                voucherDiscount = Math.round((baseTotal * appliedVoucher.discountValue) / 100);
            } else {
                voucherDiscount = appliedVoucher.discountValue;
            }
        }

        const finalTotal = Math.max(0, baseTotal - membershipDiscount - voucherDiscount);

        return { baseTotal, membershipDiscount, voucherDiscount, finalTotal };
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email || !formData.phone) {
            toast.error("Vui lòng điền đầy đủ thông tin cá nhân!");
            return;
        }
        if (selectedRoomIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một phòng!");
            return;
        }

        setSubmitting(true);
        try {
            const checkInISO = new Date(formData.checkIn).toISOString();
            const checkOutISO = new Date(formData.checkOut).toISOString();

            const { finalTotal } = calculateTotals();

            const booking = await receptionApi.createBooking({
                guestName: formData.fullName,
                guestPhone: formData.phone,
                guestEmail: formData.email,
                checkInDate: checkInISO,
                checkOutDate: checkOutISO,
                roomIds: selectedRoomIds,
                totalAmount: finalTotal,
                isExistingGuest: isAuthenticated,
                notes: formData.notes,
                voucherId: appliedVoucher ? String(appliedVoucher.id) : null
            });

            // Save to history
            const selectedRoomsData = availableRooms.filter(r => selectedRoomIds.includes(r.roomId));
            const roomNames = selectedRoomsData.map(r => r.roomNumber).join(', ');
            const stored = JSON.parse(localStorage.getItem('my_bookings') || '[]');
            stored.unshift({
                id: `BKG-${booking.id ?? Date.now()}`,
                backendId: booking.id,
                roomName: roomNames,
                roomTypeName: selectedRoomType?.name,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                guests: Number(formData.guests),
                total: finalTotal,
                status: booking.status ?? 'Confirmed',
                email: formData.email,
                createdAt: new Date().toISOString(),
            });
            localStorage.setItem('my_bookings', JSON.stringify(stored));
            localStorage.setItem('client_guest_email', formData.email);

            toast.success('🎉 Đặt phòng thành công! Vui lòng hoàn tất đặt cọc.');
            setRecentBooking(booking);
            setShowPaymentModal(true);
        } catch (err: any) {
            const apiError = toApiError(err);
            toast.error(apiError.message || 'Không thể tạo đặt phòng.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-[#f4f7f6] min-h-screen pb-24 font-sans text-slate-800">
            {/* Minimal Header Spacer */}
            <div className="pt-[100px] pb-10 bg-slate-900 border-b-4 border-cyan-500">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 uppercase tracking-tighter">Secure Reservation</h1>
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-cyan-400' : 'text-slate-500'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-500'}`}>1</span>
                            <span className="font-bold text-sm hidden sm:inline uppercase tracking-widest">Stay Info</span>
                        </div>
                        <div className="w-12 h-0.5 bg-slate-700" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-cyan-400' : 'text-slate-500'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-500'}`}>2</span>
                            <span className="font-bold text-sm hidden sm:inline uppercase tracking-widest">Pick Room</span>
                        </div>
                        <div className="w-12 h-0.5 bg-slate-700" />
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-cyan-400' : 'text-slate-500'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-500'}`}>3</span>
                            <span className="font-bold text-sm hidden sm:inline uppercase tracking-widest">Details</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-12">
                {isAuthenticated && membershipInfo.discount > 0 && (
                    <div className="mb-8 p-4 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-cyan-600/20 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">Membership Reward Active!</p>
                                <p className="text-cyan-100 text-sm">As a <span className="font-bold uppercase tracking-widest text-white">{membershipInfo.tier}</span> member, you get an automatic <span className="font-bold text-white">{membershipInfo.discount}% discount</span> on this booking.</p>
                            </div>
                        </div>
                        <CheckCircleIcon className="w-10 h-10 text-white/40 hidden md:block" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT COL: MAIN FLOW */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">

                            {/* STEP 1: DATES & ROOM TYPE */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                                            <CalendarDaysIcon className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-bold">When would you like to stay?</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Check-in Date & Time</label>
                                            <input
                                                required
                                                name="checkIn"
                                                value={formData.checkIn}
                                                onChange={handleChange}
                                                type="datetime-local"
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium text-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Check-out Date & Time</label>
                                            <input
                                                required
                                                name="checkOut"
                                                value={formData.checkOut}
                                                onChange={handleChange}
                                                type="datetime-local"
                                                min={formData.checkIn || new Date().toISOString().slice(0, 16)}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium text-lg"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Select Room Category</label>
                                            <select
                                                value={selectedRoomType?.id || ''}
                                                onChange={handleRoomTypeChange}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium text-lg appearance-none"
                                            >
                                                {roomTypes.map(rt => (
                                                    <option key={rt.id} value={rt.id}>{rt.name} — ${rt.basePrice}/night</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                        <p className="text-slate-400 text-sm italic">Next step: Choose a specific room number.</p>
                                        <button
                                            type="button"
                                            onClick={handleSearchRooms}
                                            disabled={isSearching}
                                            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-cyan-600 transition-all flex items-center gap-3 group disabled:opacity-50"
                                        >
                                            {isSearching ? 'Searching...' : 'Continue to Room Selection'}
                                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: SPECIFIC ROOM SELECTION */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                                                <MapPinIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">Pick Your Room</h2>
                                                <p className="text-slate-500 text-sm">Available {selectedRoomType?.name} rooms for your dates.</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 uppercase block">Category</span>
                                            <span className="text-cyan-700 font-bold">{selectedRoomType?.name}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {availableRooms.map((room) => {
                                            const isSelected = selectedRoomIds.includes(room.roomId);
                                            return (
                                                <div
                                                    key={room.roomId}
                                                    onClick={() => handleRoomToggle(room.roomId)}
                                                    className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all group ${isSelected
                                                            ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20'
                                                            : 'border-slate-100 hover:border-cyan-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="text-center">
                                                        <span className={`block text-xs font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`}>Room</span>
                                                        <span className={`text-3xl font-black ${isSelected ? 'text-cyan-700' : 'text-slate-800'}`}>{room.roomNumber}</span>
                                                        <div className={`mt-3 mx-auto w-8 h-1 rounded-full transition-all ${isSelected ? 'bg-cyan-500' : 'bg-slate-100 group-hover:bg-cyan-200'}`} />
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircleIcon className="w-6 h-6 text-cyan-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {availableRooms.length === 0 && (
                                            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500">
                                                <p className="text-lg font-medium">Sorry, no rooms available of this type.</p>
                                                <button onClick={() => setStep(1)} className="mt-4 text-cyan-600 font-bold hover:underline">Change dates or room type</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                        <button onClick={() => setStep(1)} className="text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">Back to dates</button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            disabled={selectedRoomIds.length === 0}
                                            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-cyan-600 transition-all flex items-center gap-3 group disabled:opacity-50"
                                        >
                                            Continue with {selectedRoomIds.length} Room(s)
                                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: GUEST DETAILS */}
                            {step === 3 && (
                                <form onSubmit={handleConfirm} className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                                            <UserGroupIcon className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-bold">Complete Your Reservation</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                                            <input required name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium" placeholder="e.g. John Smith" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                                            <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium" placeholder="john@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Phone Number *</label>
                                            <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium" placeholder="+84 123 456 789" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Guests *</label>
                                            <select name="guests" value={formData.guests} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium">
                                                <option value="1">1 Person</option>
                                                <option value="2">2 Persons</option>
                                                <option value="3">3 Persons</option>
                                                <option value="4">4 Persons</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Special Notes</label>
                                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-cyan-500 focus:bg-white focus:outline-none transition-all font-medium" placeholder="Any special requests or arrival time..." />
                                        </div>
                                    </div>

                                    {/* Voucher Section */}
                                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-8">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <TicketIcon className="w-5 h-5 text-cyan-600" />
                                            Apply Promo Code
                                        </h3>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Enter code (e.g. SAVE20)"
                                                    value={voucherCode}
                                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    disabled={!!appliedVoucher}
                                                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition-all font-mono uppercase"
                                                />
                                                {appliedVoucher && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                            {!appliedVoucher && (
                                                <button
                                                    type="button"
                                                    onClick={handleCheckVoucher}
                                                    disabled={isCheckingVoucher || !voucherCode}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-cyan-600 transition-all disabled:opacity-50"
                                                >
                                                    {isCheckingVoucher ? '...' : 'Apply'}
                                                </button>
                                            )}
                                        </div>
                                        {appliedVoucher && (
                                            <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Discount Applied: {appliedVoucher.discountType === 'Percentage' ? `${appliedVoucher.discountValue}%` : `$${appliedVoucher.discountValue}`} Off
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                        <button type="button" onClick={() => setStep(2)} className="text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">Back to room selection</button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-12 py-4 bg-cyan-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-cyan-700 shadow-xl shadow-cyan-600/20 transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {submitting ? 'Processing...' : (
                                                <>
                                                    <CreditCardIcon className="w-5 h-5" />
                                                    Complete Reservation
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>

                    {/* RIGHT COL: SUMMARY CARD */}
                    <div>
                        <div className="bg-slate-900 text-white p-8 rounded-2xl sticky top-32 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 relative z-10">
                                <InformationCircleIcon className="w-6 h-6 text-cyan-400" />
                                Your Stay Summary
                            </h3>

                            <div className="space-y-6 relative z-10">
                                {selectedRoomType && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">{selectedRoomType.name}</h4>
                                            {selectedRoomIds.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {availableRooms.filter(r => selectedRoomIds.includes(r.roomId)).map(r => (
                                                        <span key={r.roomId} className="px-2 py-1 bg-cyan-500/20 rounded-md text-white font-black text-lg">#{r.roomNumber}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">Select room(s) in Step 2</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Check-in</span>
                                                <span className="text-xs font-bold">{formData.checkIn ? new Date(formData.checkIn).toLocaleString() : '—'}</span>
                                            </div>
                                            <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Check-out</span>
                                                <span className="text-xs font-bold">{formData.checkOut ? new Date(formData.checkOut).toLocaleString() : '—'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 py-4 border-y border-slate-800">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Duration:</span>
                                                <span className="font-bold text-cyan-50">{nights} Night(s)</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Total Rooms:</span>
                                                <span className="font-bold text-cyan-50">{selectedRoomIds.length} Room(s)</span>
                                            </div>

                                            {/* Price Breakdown */}
                                            {(() => {
                                                const { baseTotal, membershipDiscount, voucherDiscount, finalTotal } = calculateTotals();
                                                return (
                                                    <div className="pt-4 space-y-2 border-t border-slate-800/50">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-slate-400">Base Price:</span>
                                                            <span className="font-bold text-slate-300">${baseTotal.toLocaleString()}</span>
                                                        </div>
                                                        {membershipDiscount > 0 && (
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-emerald-500/80 font-medium">Member Discount:</span>
                                                                <span className="font-bold text-emerald-500">-${membershipDiscount.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        {voucherDiscount > 0 && (
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-emerald-500/80 font-medium">Voucher:</span>
                                                                <span className="font-bold text-emerald-500">-${voucherDiscount.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-4 text-center">
                                                            <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Total Amount</span>
                                                            <div className="flex items-baseline justify-center gap-1">
                                                                <span className="text-4xl font-black text-white">${finalTotal.toLocaleString()}</span>
                                                                <span className="text-cyan-500 font-bold">.00</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-600 uppercase tracking-widest mt-2 block">All taxes & fees included</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-slate-800">
                                    <div className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                        <ShieldCheckIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider">
                                            Best Price Guaranteed. Secure 256-bit SSL encrypted reservation process.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Successful!</h2>
                            <p className="text-slate-500 mb-8">Your reservation <strong>#{recentBooking?.id}</strong> has been created. Please complete the deposit to secure your room.</p>
                            
                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Amount</span>
                                    <span className="text-xl font-black text-slate-900">${recentBooking?.deposit?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <InformationCircleIcon className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-medium leading-relaxed">
                                        Your booking will be automatically cancelled after <strong>15 minutes</strong> if the deposit is not completed.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePayment}
                                    className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <CreditCardIcon className="w-5 h-5" />
                                    Pay with MoMo
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/account')}
                                    className="w-full py-4 bg-white text-slate-500 border-2 border-slate-100 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-50 transition-all"
                                >
                                    Pay Later in Account
                                </button>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('Are you sure you want to cancel this booking?')) {
                                            try {
                                                await receptionApi.cancelBooking(recentBooking.id);
                                                toast.success('Booking cancelled.');
                                                navigate('/account');
                                            } catch (e) {
                                                toast.error('Failed to cancel.');
                                            }
                                        }
                                    }}
                                    className="w-full py-2 text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest text-[10px] transition-all"
                                >
                                    Cancel Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

