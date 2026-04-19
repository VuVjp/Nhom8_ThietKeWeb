import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { receptionApi } from '../../api/receptionApi';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, CreditCardIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export function ClientBookingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const roomIdParam = searchParams.get('room');

    const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomTypeItem | null>(null);
    const [nights, setNights] = useState(1);
    const [submitting, setSubmitting] = useState(false);

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

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await roomTypesApi.getAll();
                const activeRooms = data.filter(rt => rt.isActive);
                setRoomTypes(activeRooms);

                if (roomIdParam) {
                    const r = activeRooms.find(x => x.id === Number(roomIdParam));
                    if (r) setSelectedRoom(r);
                } else if (activeRooms.length > 0) {
                    setSelectedRoom(activeRooms[0]);
                }
            } catch (error) {
                console.error("Failed to fetch rooms for booking", error);
            }
        };
        fetchRooms();
    }, [roomIdParam]);

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

    const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const r = roomTypes.find(x => x.id === Number(e.target.value));
        if (r) setSelectedRoom(r);
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email || !formData.checkIn || !formData.checkOut) {
            toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
            return;
        }
        if (nights <= 0) {
            toast.error("Ngày trả phòng phải sau ngày nhận phòng!");
            return;
        }
        if (!selectedRoom) {
            toast.error("Vui lòng chọn loại phòng!");
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Lấy danh sách phòng trống theo ngày
            const checkInISO = new Date(formData.checkIn).toISOString();
            const checkOutISO = new Date(formData.checkOut).toISOString();

            const availableRooms = await receptionApi.getAvailableRooms(checkInISO, checkOutISO);

            // Step 2: Tìm phòng thuộc loại phòng được chọn
            const matchedRoom = availableRooms.find(r =>
                r.roomTypeName?.toLowerCase() === selectedRoom.name?.toLowerCase()
            );

            if (!matchedRoom) {
                toast.error(`Không còn phòng trống cho loại "${selectedRoom.name}" trong thời gian này. Vui lòng chọn ngày khác.`);
                setSubmitting(false);
                return;
            }

            // Step 3: Tạo booking trên BE
            const totalAmount = selectedRoom.basePrice * nights;
            const booking = await receptionApi.createBooking({
                guestName: formData.fullName,
                guestPhone: formData.phone || '0000000000',
                guestEmail: formData.email,
                checkInDate: checkInISO,
                checkOutDate: checkOutISO,
                roomIds: [matchedRoom.roomId],
                totalAmount,
                isExistingGuest: false,
            });

            // Step 4: Lưu booking vào localStorage để hiển thị ở trang lịch sử
            const stored = JSON.parse(localStorage.getItem('my_bookings') || '[]');
            stored.unshift({
                id: `BKG-${booking.id ?? Date.now()}`,
                backendId: booking.id,
                roomName: selectedRoom.name,
                roomTypeName: selectedRoom.name,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                guests: Number(formData.guests),
                total: totalAmount,
                status: booking.status ?? 'Confirmed',
                email: formData.email,
                createdAt: new Date().toISOString(),
            });
            localStorage.setItem('my_bookings', JSON.stringify(stored));
            // Lưu email khách để trang Account có thể nhận dạng
            localStorage.setItem('client_guest_email', formData.email);

            toast.success('🎉 Đặt phòng thành công! Phòng đã được xác nhận.');
            navigate('/account');
        } catch (err: any) {
            console.error('Booking error:', err);
            const msg = err?.response?.data?.message ?? err?.message ?? 'Không thể tạo đặt phòng. Vui lòng thử lại.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-[#f4f7f6] min-h-screen pb-24 font-sans text-slate-800">
            {/* Minimal Header Spacer */}
            <div className="pt-[100px] pb-10 bg-slate-900 border-b-4 border-cyan-500">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Secure Reservation</h1>
                    <p className="text-cyan-400 text-sm tracking-widest uppercase">Fast & Easy Booking Process</p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT COL: BOOKING FORM */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleConfirm} className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-2xl font-bold mb-8 border-b pb-4">Guest Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                                    <input required name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address *</label>
                                    <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="john@example.com" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-8 border-b pb-4">Stay Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Room Type *</label>
                                    <select value={selectedRoom?.id || ''} onChange={handleRoomChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.id}>{rt.name} - ${rt.basePrice}/night</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Check-in Date *</label>
                                    <input required name="checkIn" value={formData.checkIn} onChange={handleChange} type="date" min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Check-out Date *</label>
                                    <input required name="checkOut" value={formData.checkOut} onChange={handleChange} type="date" min={formData.checkIn || new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Adult Guests *</label>
                                    <select name="guests" value={formData.guests} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                    </select>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-8 border-b pb-4">Additional Requests</h2>
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Special Notes (Optional)</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="E.g., early check-in, dietary requirements..." />
                            </div>

                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 border-2 border-slate-300 text-slate-600 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-4 bg-cyan-600 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-cyan-700 shadow-xl shadow-cyan-600/20 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <CreditCardIcon className="w-5 h-5" />
                                    {submitting ? 'Processing...' : 'Confirm & Pay'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COL: SUMMARY & CART */}
                    <div>
                        <div className="bg-slate-900 text-white p-8 rounded-xl sticky top-32 shadow-2xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><InformationCircleIcon className="w-6 h-6 text-cyan-400" /> Booking Summary</h3>

                            {selectedRoom ? (
                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-slate-700">
                                        <h4 className="text-lg font-semibold text-cyan-50">{selectedRoom.name}</h4>
                                        <div className="flex justify-between mt-2 text-slate-400 text-sm font-mono">
                                            <span>Price per night:</span>
                                            <span>${selectedRoom.basePrice.toLocaleString()}.00</span>
                                        </div>
                                    </div>

                                    <div className="pb-6 border-b border-slate-700">
                                        <div className="flex justify-between mb-2 text-slate-300 text-sm">
                                            <span>Duration:</span>
                                            <span className="font-bold text-white">{nights} Night(s)</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300 text-sm bg-slate-800 p-3 rounded-lg border border-slate-700">
                                            <span>Guests:</span>
                                            <span className="font-bold text-white">{formData.guests} Adult(s)</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-lg text-slate-300">Total Price</span>
                                            <span className="text-3xl font-bold text-cyan-400">${((selectedRoom.basePrice * nights) || 0).toLocaleString()}.00</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block text-right">Includes Taxes & Fees</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500 py-8 text-center italic">Loading room details...</div>
                            )}

                            <div className="mt-8 pt-6 border-t border-slate-700 flex items-start gap-4 text-xs text-slate-400 leading-relaxed">
                                <div className="p-1 rounded-full bg-slate-800 shrink-0"><ShieldCheckIcon className="w-5 h-5 text-green-400" /></div>
                                <p>Your payment information is secured using industry-standard SSL encryption. Your data is never stored on our servers.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
