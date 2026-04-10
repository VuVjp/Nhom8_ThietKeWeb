import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PrinterIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import invoicesApi from '../../api/invoicesApi';
import type { InvoiceDetail } from '../../types/invoices';
import { toApiError } from '../../api/httpClient';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSplitting, setIsSplitting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

    const loadData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await invoicesApi.getById(Number(id));
            setInvoice(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load invoice details');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handlePrint = () => {
        window.print();
    };

    const handleComplete = async () => {
        if (!id || !invoice) return;
        
        setIsCompleting(true);
        try {
            await invoicesApi.complete(Number(id));
            toast.success("Invoice completed and finalized!");
            setIsCompleteModalOpen(false);
            void loadData();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || "Failed to complete invoice");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleSplitAll = async () => {
        if (!id || !invoice) return;

        setIsSplitting(true);
        try {
            await invoicesApi.split(Number(id));
            toast.success("Invoice split into individual records!");
            navigate('/admin/invoices');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || "Failed to split invoice");
        } finally {
            setIsSplitting(false);
            setIsSplitModalOpen(false);
        }
    };

    const handlePartialSplit = async () => {
        if (!id || !invoice || selectedRoomIds.length === 0) return;

        setIsSplitting(true);
        try {
            await invoicesApi.splitMultiple(Number(id), selectedRoomIds);
            toast.success(`Moved ${selectedRoomIds.length} room(s) to a new invoice!`);
            navigate('/admin/invoices');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || "Failed to split selected rooms");
        } finally {
            setIsSplitting(false);
            setIsSplitModalOpen(false);
        }
    };

    const toggleRoomSelection = (roomId: number) => {
        setSelectedRoomIds(prev =>
            prev.includes(roomId)
                ? prev.filter(rid => rid !== roomId)
                : [...prev, roomId]
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading invoice...</div>;
    }

    if (!invoice) {
        return <div className="p-8 text-center text-red-500">Invoice not found.</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto print:max-w-none print:w-full print:m-0">
            {/* Split Selection Modal */}

            {/* Complete Confirmation Modal */}
            <Modal
                open={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                title="Finalize Invoice"
            >
                <div className="p-2">
                    <div className="flex items-center gap-4 text-amber-600 mb-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <ExclamationTriangleIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900">Irreversible Action</p>
                            <p className="text-sm text-amber-700">Once completed, this invoice will be locked and cannot be split or modified.</p>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 mb-8 px-1">
                        Are you sure you want to finalize <span className="font-mono font-bold text-slate-900">{invoice.invoiceCode}</span>? 
                        This will mark the billing process as finished for the associated rooms.
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setIsCompleteModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                            {isCompleting ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-white"></span>
                            )}
                            {isCompleting ? 'Processing...' : 'Yes, Finalize Now'}
                        </button>
                    </div>
                </div>
            </Modal>

            {isSplitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Manage Room Billing</h3>
                            <p className="text-sm text-slate-500 mt-1">Select rooms to move to a new invoice or split all rooms.</p>
                        </div>
                        <div className="p-6 space-y-4 max-height-[400px] overflow-y-auto">
                            <div className="space-y-2">
                                {invoice.roomDetails.map((room) => (
                                    <label
                                        key={room.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition cursor-pointer ${
                                            selectedRoomIds.includes(room.id)
                                                ? 'border-cyan-600 bg-cyan-50'
                                                : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoomIds.includes(room.id)}
                                                onChange={() => toggleRoomSelection(room.id)}
                                                className="h-5 w-5 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900">Room {room.roomNumber}</p>
                                                <p className="text-xs text-slate-500">{room.roomType}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">${room.subtotal.toLocaleString()}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handlePartialSplit}
                                    disabled={selectedRoomIds.length === 0 || selectedRoomIds.length === invoice.roomDetails.length || isSplitting}
                                    className="px-4 py-2.5 bg-cyan-700 text-white rounded-xl font-bold text-sm hover:bg-cyan-800 transition disabled:opacity-50 shadow-lg shadow-cyan-700/20"
                                >
                                    Split Selected
                                </button>
                                <button
                                    onClick={handleSplitAll}
                                    disabled={isSplitting}
                                    className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition disabled:opacity-50"
                                >
                                    Split All
                                </button>
                            </div>
                            <button
                                onClick={() => setIsSplitModalOpen(false)}
                                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header - Hidden on Print */}
            <div className="flex items-center justify-between print:hidden">
                <button
                    onClick={() => navigate('/admin/invoices')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
                >
                    <ArrowLeftIcon className="h-4 w-4" /> Back to Invoices
                </button>
                <div className="flex gap-2">
                    {invoice.status !== 'Completed' && invoice.roomDetails.length > 1 && (
                        <button
                            onClick={() => {
                                if (invoice.roomDetails.length === 2) {
                                    handleSplitAll();
                                } else {
                                    setIsSplitModalOpen(true);
                                }
                            }}
                            disabled={isSplitting || isCompleting}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-700 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 transition shadow-sm disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${isSplitting ? 'animate-spin' : ''}`} />
                            {isSplitting ? 'Splitting...' : invoice.roomDetails.length === 2 ? 'Split All' : 'Split Invoice'}
                        </button>
                    )}
                    {invoice.status !== 'Completed' && (
                        <button
                            onClick={() => setIsCompleteModalOpen(true)}
                            disabled={isCompleting || isSplitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                        >
                            {isCompleting ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                            )}
                            {isCompleting ? 'Finalizing...' : 'Complete Invoice'}
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        disabled={isCompleting || isSplitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 transition shadow-sm disabled:opacity-50"
                    >
                        <PrinterIcon className="h-4 w-4" /> Print Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Document */}
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-xl print:shadow-none print:border-none print:rounded-none print:p-8">
                {/* Brand & Stats */}
                <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-slate-100 pb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 bg-cyan-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">H</div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">Hotel Management</span>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1">
                            <p>123 Luxury Avenue, Suite 100</p>
                            <p>Beverly Hills, CA 90210</p>
                            <p>Phone: +1 (555) 123-4567</p>
                            <p>Email: contact@hotelmanagement.com</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Invoice</h1>
                        <p className="font-mono text-lg font-bold text-cyan-700">{invoice.invoiceCode}</p>
                        <div className="text-sm text-slate-500">
                            <p>Date Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                            {invoice.completedAt && (
                                <p>Date Completed: {new Date(invoice.completedAt).toLocaleDateString()}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</h3>
                        <div className="space-y-1">
                            <p className="text-xl font-bold text-slate-900">{invoice.guestName}</p>
                            <p className="text-slate-600">Booking Code: <span className="font-semibold">{invoice.bookingCode}</span></p>
                            {invoice.isSplit && (
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-bold">
                                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    SPLIT INVOICE - ROOM {invoice.roomNumber}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Tables */}
                <div className="space-y-10">
                    {/* Room Details */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Room Stay Details</h3>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-100">
                                    <th className="py-3 font-semibold">Room info</th>
                                    <th className="py-3 font-semibold">Stay Period</th>
                                    <th className="py-3 font-semibold text-right">Rate</th>
                                    <th className="py-3 font-semibold text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoice.roomDetails.map((room, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4">
                                            <p className="font-bold text-slate-900">Room {room.roomNumber}</p>
                                            <p className="text-xs text-slate-500">{room.roomType}</p>
                                        </td>
                                        <td className="py-4">
                                            <p>{new Date(room.checkIn).toLocaleDateString()} - {new Date(room.actualCheckOut || room.checkOut).toLocaleDateString()}</p>
                                            {room.actualCheckOut && (
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase italic">Early Check-out Applied</p>
                                            )}
                                        </td>
                                        <td className="py-4 text-right">${room.pricePerNight.toLocaleString()}</td>
                                        <td className="py-4 text-right font-medium">${room.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Services */}
                    {invoice.serviceDetails.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Service Orders</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-100">
                                        <th className="py-3 font-semibold">Service</th>
                                        <th className="py-3 font-semibold">Qty</th>
                                        <th className="py-3 font-semibold text-right">Price</th>
                                        <th className="py-3 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoice.serviceDetails.map((service, idx) => (
                                        <tr key={idx}>
                                            <td className="py-4 font-medium text-slate-900">{service.serviceName}</td>
                                            <td className="py-4">{service.quantity}</td>
                                            <td className="py-4 text-right">${service.price.toLocaleString()}</td>
                                            <td className="py-4 text-right font-medium">${service.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Loss & Damage */}
                    {invoice.lossDamageDetails.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Loss & Damage Penalties</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-100">
                                        <th className="py-3 font-semibold">Item / Description</th>
                                        <th className="py-3 font-semibold">Qty</th>
                                        <th className="py-3 font-semibold text-right">Penalty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoice.lossDamageDetails.map((item, idx) => (
                                        <tr key={idx} className="text-red-700">
                                            <td className="py-4">
                                                <p className="font-bold">{item.itemName}</p>
                                                {item.description && <p className="text-xs italic opacity-70">{item.description}</p>}
                                            </td>
                                            <td className="py-4">{item.quantity}</td>
                                            <td className="py-4 text-right font-medium">${item.penaltyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex justify-end">
                        <div className="w-full md:w-80 space-y-3">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Room Subtotal:</span>
                                <span>${invoice.totalRoomAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Service Subtotal:</span>
                                <span>${invoice.totalServiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Penalties:</span>
                                <span>${invoice.totalLossDamageAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-rose-600 font-medium">
                                <span>Discount:</span>
                                <span>-${invoice.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Tax (10%):</span>
                                <span>${invoice.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                <span className="text-lg font-bold text-slate-900">Final Total:</span>
                                <span className="text-3xl font-black text-cyan-700 tracking-tighter">
                                    ${invoice.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-100 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Thank you for choosing Hotel Management!</p>
                    <p className="text-xs text-slate-400">If you have any questions about this invoice, please contact us at contact@hotelmanagement.com or +1 (555) 123-4567.</p>
                </div>
            </div>
        </div>
    );
}
