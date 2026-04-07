import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input } from '../../../components/Input';
import { toApiError } from '../../../api/httpClient';
import { receptionApi } from '../../../api/receptionApi';
import { usersApi } from '../../../api/usersApi';
import type { RoomAvailability } from '../../../types/models';
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon, UserIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export function CreateBookingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Step 1 State
    const [bookingType, setBookingType] = useState<'daily' | 'hourly'>('daily');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');

    const [hourlyDate, setHourlyDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [isSearching, setIsSearching] = useState(false);

    // Step 2 State
    const [availableRooms, setAvailableRooms] = useState<RoomAvailability[]>([]);
    const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

    // Step 3 State
    const [guestType, setGuestType] = useState<'walkin' | 'existing'>('walkin');
    const [checkEmail, setCheckEmail] = useState('');
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [guestVerified, setGuestVerified] = useState(false);

    const getCalculatedDates = () => {
        if (bookingType === 'daily') return { start: checkInDate, end: checkOutDate };
        return {
            start: hourlyDate && startTime ? `${hourlyDate}T${startTime}:00` : '',
            end: hourlyDate && endTime ? `${hourlyDate}T${endTime}:00` : ''
        };
    };

    const calculateDuration = () => {
        const { start, end } = getCalculatedDates();
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate.getTime() - startDate.getTime();
        if (diffTime <= 0) return 0;

        if (bookingType === 'daily') {
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
            return Math.ceil(diffTime / (1000 * 60 * 60));
        }
    };

    const calculatedTotal = () => {
        const duration = calculateDuration() || 1;
        const selectedRoomsData = availableRooms.filter(r => selectedRoomIds.includes(r.roomId));
        const dailyRate = selectedRoomsData.reduce((acc, curr) => acc + curr.pricePerNight, 0);

        if (bookingType === 'daily') {
            return duration * dailyRate;
        } else {
            // Assume hourly rate is 1/24 of daily rate for generic fallback
            const hourlyRate = Math.ceil(dailyRate / 24);
            return duration * hourlyRate;
        }
    };

    const handleSearchRooms = async () => {
        const { start, end } = getCalculatedDates();
        if (!start || !end) {
            toast.error('Please assign all date/time fields appropriately.');
            return;
        }

        if (new Date(end) <= new Date(start)) {
            toast.error('Check-out time must be after check-in time.');
            return;
        }

        setIsSearching(true);
        try {
            const rooms = await receptionApi.getAvailableRooms(start, end);
            setAvailableRooms(rooms || []);
            setStep(2);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to search rooms');
        } finally {
            setIsSearching(false);
        }
    };

    const handleRoomSelection = (roomId: number) => {
        setSelectedRoomIds(prev =>
            prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
    };

    const handleCheckEmail = async () => {
        if (!checkEmail.trim()) {
            toast.error('Vui lòng nhập email.');
            return;
        }
        setIsCheckingEmail(true);
        try {
            const info = await usersApi.isAvailable(checkEmail.trim());
            setGuestName(info.fullName);
            setGuestPhone(info.phone);
            setGuestEmail(info.email);
            setGuestVerified(true);
            toast.success('Email is valid and guest information has been pre-filled.');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Email không tồn tại hoặc không khả dụng.');
            setGuestVerified(false);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (guestVerified === false) {
            if (guestType === 'existing') {
                toast.error('Please verify the guest email before confirming.');
                return;
            }

            if (!guestName || !guestPhone) {
                toast.error('Guest name and phone are required.');
                return;
            }
        }
        setIsSubmitting(true);
        try {
            const { start, end } = getCalculatedDates();
            await receptionApi.createBooking({
                IsExistingGuest: guestType === 'existing',
                guestName,
                guestPhone,
                guestEmail,
                checkInDate: start,
                checkOutDate: end,
                roomIds: selectedRoomIds,
                totalAmount: calculatedTotal()
            });
            toast.success('Booking created successfully!');
            navigate('/admin/reception/bookings');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Create New Booking</h2>
                <p className="text-sm text-slate-500">3-step wizard for reception desk.</p>
            </div>

            {/* Stepper Header */}
            <div className="flex items-center gap-2 text-sm">
                <span className={`font-semibold ${step >= 1 ? 'text-cyan-700' : 'text-slate-400'}`}>1. Dates</span>
                <span className="text-slate-300">/</span>
                <span className={`font-semibold ${step >= 2 ? 'text-cyan-700' : 'text-slate-400'}`}>2. Rooms</span>
                <span className="text-slate-300">/</span>
                <span className={`font-semibold ${step >= 3 ? 'text-cyan-700' : 'text-slate-400'}`}>3. Confirmation</span>
            </div>

            <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${step === 1 ? 'max-w-[500px]' : ''}`}>
                {step === 1 && (
                    <div className="space-y-6 max-w-md">
                        {/* Booking Type Toggle */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setBookingType('daily')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${bookingType === 'daily' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Over Night (Daily)
                            </button>
                            <button
                                onClick={() => setBookingType('hourly')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${bookingType === 'hourly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Hourly Stay
                            </button>
                        </div>

                        {bookingType === 'daily' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Check-in Date & Time</label>
                                    <Input type="datetime-local" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Check-out Date & Time</label>
                                    <Input type="datetime-local" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Date</label>
                                    <Input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Start Time</label>
                                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">End Time</label>
                                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={isSearching}
                            onClick={handleSearchRooms}
                            className="mt-6 inline-flex w-full justify-center items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-cyan-800"
                        >
                            {isSearching ? 'Searching...' : 'Search Available Rooms'} <ArrowRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="mb-4 text-sm text-slate-600">
                            Found <span className="font-bold text-cyan-700">{availableRooms.length}</span> rooms available.
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {availableRooms.map((room) => {
                                const isSelected = selectedRoomIds.includes(room.roomId);
                                return (
                                    <div
                                        key={room.roomId}
                                        onClick={() => handleRoomSelection(room.roomId)}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-cyan-300'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900">Room {room.roomNumber}</h4>
                                                <p className="text-xs text-slate-500">{room.roomTypeName}</p>
                                            </div>
                                            {isSelected && <CheckCircleIcon className="h-5 w-5 text-cyan-600" />}
                                        </div>
                                        <div className="mt-3 text-sm font-medium text-slate-700">
                                            ${room.pricePerNight} <span className="text-xs font-normal text-slate-400">/ night</span>
                                        </div>
                                    </div>
                                )
                            })}
                            {availableRooms.length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-500">No rooms available for the selected time. Please go back and try differently.</div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button onClick={() => setStep(1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Back</button>
                            <button
                                onClick={() => {
                                    if (selectedRoomIds.length === 0) {
                                        toast.error("Please select at least one room.");
                                        return;
                                    }
                                    setStep(3);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                            >
                                Continue with {selectedRoomIds.length} room(s) <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (() => {
                    const { start, end } = getCalculatedDates();
                    return (
                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Guest Form */}
                            <div className="space-y-5">
                                <h3 className="font-semibold text-slate-800">Guest Information</h3>

                                {/* Guest type toggle */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setGuestType('walkin'); setGuestVerified(false); setGuestName(''); setGuestPhone(''); setGuestEmail(''); setCheckEmail(''); }}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${guestType === 'walkin'
                                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500'
                                            : 'border-slate-200 text-slate-500 hover:border-cyan-300'
                                            }`}
                                    >
                                        <UserIcon className="h-4 w-4" />
                                        Walk-in Guest
                                    </button>
                                    <button
                                        onClick={() => { setGuestType('existing'); setGuestVerified(false); setGuestName(''); setGuestPhone(''); setGuestEmail(''); setCheckEmail(''); }}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${guestType === 'existing'
                                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500'
                                            : 'border-slate-200 text-slate-500 hover:border-cyan-300'
                                            }`}
                                    >
                                        <IdentificationIcon className="h-4 w-4" />
                                        Already have account
                                    </button>
                                </div>

                                {/* Email lookup for existing account */}
                                {guestType === 'existing' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Account Email</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="guest@example.com"
                                                type="email"
                                                value={checkEmail}
                                                onChange={e => { setCheckEmail(e.target.value); setGuestVerified(false); }}
                                                onKeyDown={e => e.key === 'Enter' && handleCheckEmail()}
                                            />
                                            <button
                                                onClick={handleCheckEmail}
                                                disabled={isCheckingEmail}
                                                className="shrink-0 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-cyan-800 transition"
                                            >
                                                {isCheckingEmail ? 'Checking...' : 'Check Email'}
                                            </button>
                                        </div>
                                        {guestVerified && (
                                            <p className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                                Account is valid — information has been pre-filled
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Guest info fields - always shown, auto-filled when existing */}
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium text-slate-700`}>Full Name</label>
                                    <Input
                                        placeholder="John Doe"
                                        value={guestName}
                                        onChange={e => setGuestName(e.target.value)}
                                        readOnly={guestType === 'existing'}
                                        style={{ cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className={`space-y-2`}>
                                    <label className={`text-sm font-medium text-slate-700 `}>Phone Number</label>
                                    <Input
                                        placeholder="0901 234 567 (e.g. Vietnam format)"
                                        value={guestPhone}
                                        onChange={e => setGuestPhone(e.target.value)}
                                        readOnly={guestType === 'existing'}
                                        style={{ cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className={`space-y-2 ${guestType === 'walkin' ? '' : 'hidden'}`}>
                                    <label className={`text-sm font-medium text-slate-700`}>Email {guestType === 'walkin' ? '(Optional)' : ''}</label>
                                    <Input
                                        placeholder="email@example.com"
                                        type="email"
                                        value={guestEmail}
                                        onChange={e => setGuestEmail(e.target.value)}
                                        readOnly={guestType === 'existing' && guestVerified}
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="rounded-xl bg-slate-50 p-6 space-y-4 border border-slate-100">
                                <h3 className="font-semibold text-slate-800">Booking Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-500">Dates</span>
                                        <span className="font-medium text-right">{start} <br /> to {end} <br /> <span className="text-cyan-700 font-bold">({calculateDuration()} {bookingType === 'daily' ? 'nights' : 'hours'})</span></span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 py-2">
                                        <span className="text-slate-500">Rooms Selected</span>
                                        <span className="font-medium">{selectedRoomIds.length} rooms</span>
                                    </div>
                                    <div className="flex justify-between pt-2 text-lg">
                                        <span className="font-bold text-slate-800">Provisional Total</span>
                                        <span className="font-bold text-cyan-700">${calculatedTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between gap-3">
                                    <button onClick={() => setStep(2)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 flex-1">Back</button>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={handleConfirmBooking}
                                        className="inline-flex flex-1 justify-center items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-cyan-800"
                                    >
                                        {isSubmitting ? 'Confirming...' : 'Confirm Bookings'} <SparklesIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    );
}
