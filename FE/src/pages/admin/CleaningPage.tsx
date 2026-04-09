import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { InventoryItem, LossRecord, Room } from '../../types/models';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { toApiError } from '../../api/httpClient';
import { roomsApi } from '../../api/roomsApi';
import { roomInventoriesApi } from '../../api/roomInventoriesApi';
import { lossApi } from '../../api/lossApi';

interface CleaningRoomState {
    room: Room;
    inventories: InventoryItem[];
    losses: LossRecord[];
}

interface LossDraft {
    roomInventoryId: number | '';
    quantity: number;
    description: string;
}

interface PendingLossReport {
    tempId: string;
    roomId: number;
    roomNumber: string;
    noIssue: boolean;
    roomInventoryId?: number;
    itemName: string;
    quantity: number;
    penaltyAmount: number;
    description: string;
    evidenceFile?: File;
    createdAt: string;
}

const emptyLossDraft: LossDraft = {
    roomInventoryId: '',
    quantity: 1,
    description: '',
};

export function CleaningPage() {
    const { ensure } = usePermissionCheck();
    const [inspectingRooms, setInspectingRooms] = useState<Room[]>([]);
    const [cleaningRooms, setCleaningRooms] = useState<Room[]>([]);
    const [activeInspectingRoomId, setActiveInspectingRoomId] = useState<number>(0);
    const [activeCleaningRoomId, setActiveCleaningRoomId] = useState<number>(0);
    const [inspectingState, setInspectingState] = useState<CleaningRoomState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingInspectingState, setIsLoadingInspectingState] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [openLossModal, setOpenLossModal] = useState(false);
    const [lossDraft, setLossDraft] = useState<LossDraft>(emptyLossDraft);
    const [lossEvidenceFile, setLossEvidenceFile] = useState<File | null>(null);
    const [isNoIssueDraft, setIsNoIssueDraft] = useState(false);
    const [activeTab, setActiveTab] = useState<'inspecting' | 'cleaning'>('inspecting');
    const [pendingLossReportsByRoom, setPendingLossReportsByRoom] = useState<Record<number, PendingLossReport[]>>({});
    const [isSendingPendingReports, setIsSendingPendingReports] = useState(false);

    const loadBoards = useCallback(async () => {
        setIsLoading(true);
        try {
            const [inspecting, cleaning] = await Promise.all([
                roomsApi.getByStatus('Inspecting'),
                roomsApi.getByStatus('Cleaning'),
            ]);

            setInspectingRooms(inspecting);
            setCleaningRooms(cleaning);

            setActiveInspectingRoomId((prev) => (inspecting.some((room) => room.id === prev) ? prev : (inspecting[0]?.id ?? 0)));
            setActiveCleaningRoomId((prev) => (cleaning.some((room) => room.id === prev) ? prev : (cleaning[0]?.id ?? 0)));
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load cleaning boards');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadInspectingState = useCallback(async (roomId: number) => {
        if (!roomId) {
            setInspectingState(null);
            return;
        }

        setIsLoadingInspectingState(true);
        try {
            const [inventories, losses] = await Promise.all([
                roomInventoriesApi.getByRoom(roomId),
                lossApi.getByRoom(roomId),
            ]);

            const room = inspectingRooms.find((item) => item.id === roomId) ?? null;
            if (room) {
                setInspectingState({
                    room,
                    inventories,
                    losses,
                });
            } else {
                setInspectingState(null);
            }
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load inspecting room details');
        } finally {
            setIsLoadingInspectingState(false);
        }
    }, [inspectingRooms]);

    useEffect(() => {
        void loadBoards();
    }, [loadBoards]);

    useEffect(() => {
        void loadInspectingState(activeInspectingRoomId);
    }, [activeInspectingRoomId, loadInspectingState]);

    const selectedInspectingRoom = useMemo(
        () => inspectingRooms.find((room) => room.id === activeInspectingRoomId) ?? null,
        [inspectingRooms, activeInspectingRoomId],
    );

    const selectedCleaningRoom = useMemo(
        () => cleaningRooms.find((room) => room.id === activeCleaningRoomId) ?? null,
        [cleaningRooms, activeCleaningRoomId],
    );

    const reportLossRows = useMemo(() => inspectingState?.losses ?? [], [inspectingState]);

    const selectedLossInventory = useMemo(
        () =>
            lossDraft.roomInventoryId
                ? inspectingState?.inventories.find((item) => item.id === Number(lossDraft.roomInventoryId)) ?? null
                : null,
        [inspectingState, lossDraft.roomInventoryId],
    );

    const penaltyAmount = useMemo(
        () => Number((Number(selectedLossInventory?.compensationPrice ?? 0) * Math.max(0, lossDraft.quantity || 0)).toFixed(2)),
        [selectedLossInventory, lossDraft.quantity],
    );

    const pendingLossReports = useMemo(
        () => (selectedInspectingRoom ? pendingLossReportsByRoom[selectedInspectingRoom.id] ?? [] : []),
        [pendingLossReportsByRoom, selectedInspectingRoom],
    );

    const pendingPenaltyTotal = useMemo(
        () => pendingLossReports.reduce((sum, item) => sum + Number(item.penaltyAmount || 0), 0),
        [pendingLossReports],
    );

    const selectedPendingInventoryIds = useMemo(
        () => new Set(pendingLossReports.filter((item) => !item.noIssue && item.roomInventoryId).map((item) => Number(item.roomInventoryId))),
        [pendingLossReports],
    );

    const availableInventoriesForDraft = useMemo(
        () => (inspectingState?.inventories ?? []).filter((item) => !selectedPendingInventoryIds.has(item.id)),
        [inspectingState, selectedPendingInventoryIds],
    );

    const sendPendingReports = async (roomId: number) => {
        const pendingRows = pendingLossReportsByRoom[roomId] ?? [];
        const rowsToSubmit = pendingRows.filter((item) => !item.noIssue);

        for (const row of rowsToSubmit) {
            if (!row.roomInventoryId) {
                continue;
            }

            await lossApi.create({
                roomInventoryId: row.roomInventoryId,
                quantity: row.quantity,
                penaltyAmount: row.penaltyAmount,
                description: row.description,
                evidenceFile: row.evidenceFile,
            });
        }
    };

    const inventoryColumns = [
        { key: 'code', label: 'Code', render: (row: InventoryItem) => row.code },
        { key: 'name', label: 'Item', render: (row: InventoryItem) => row.name },
        { key: 'quantity', label: 'Quantity', render: (row: InventoryItem) => row.quantity },
        { key: 'price', label: 'Price if Lost', render: (row: InventoryItem) => `$${row.compensationPrice}` },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: InventoryItem) => (
                selectedPendingInventoryIds.has(row.id) ? (
                    <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                        Added to pending
                    </span>
                ) : (
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                        onClick={() => {
                            if (!selectedInspectingRoom) {
                                return;
                            }

                            if (!ensure('MANAGE_CLEANING', 'report loss and damage')) {
                                return;
                            }

                            setLossDraft({
                                roomInventoryId: row.id,
                                quantity: Math.min(Math.max(1, row.quantity || 1), row.quantity || 1),
                                description: '',
                            });
                            setIsNoIssueDraft(false);
                            setLossEvidenceFile(null);
                            setOpenLossModal(true);
                        }}
                    >
                        <ExclamationTriangleIcon className="h-4 w-4" /> Report loss
                    </button>
                )
            ),
        },
    ];

    const lossColumns = [
        { key: 'id', label: 'ID', render: (row: LossRecord) => row.id },
        { key: 'item', label: 'Item', render: (row: LossRecord) => row.item },
        { key: 'quantity', label: 'Qty', render: (row: LossRecord) => row.quantity },
        { key: 'penalty', label: 'Penalty', render: (row: LossRecord) => `$${row.penalty}` },
        { key: 'description', label: 'Description', render: (row: LossRecord) => row.description },
        {
            key: 'evidence',
            label: 'Evidence',
            render: (row: LossRecord) =>
                row.evidence ? (
                    <a href={row.evidence} target="_blank" rel="noreferrer" className="text-cyan-700 underline underline-offset-2">
                        View image
                    </a>
                ) : (
                    <span className="text-slate-400">No image</span>
                ),
        },
        { key: 'date', label: 'Date', render: (row: LossRecord) => row.date },
    ];

    const completeInspection = () => {
        if (!selectedInspectingRoom) {
            toast.error('Please select an inspecting room');
            return;
        }

        if (!ensure('UPDATE_CLEANING', 'move room to cleaning')) {
            return;
        }

        void (async () => {
            setIsUpdatingStatus(true);
            try {
                const pendingRows = pendingLossReportsByRoom[selectedInspectingRoom.id] ?? [];

                if (pendingRows.length > 0) {
                    await sendPendingReports(selectedInspectingRoom.id);
                }

                await roomsApi.changeStatus(selectedInspectingRoom.id, 'Cleaning');

                if (pendingRows.length > 0) {
                    setPendingLossReportsByRoom((prev) => {
                        const next = { ...prev };
                        delete next[selectedInspectingRoom.id];
                        return next;
                    });
                }

                toast.success(`Room ${selectedInspectingRoom.roomNumber} moved to Cleaning`);
                await loadBoards();
            } catch (error) {
                const apiError = toApiError(error);
                toast.error(apiError.message || 'Failed to move room to Cleaning');
            } finally {
                setIsUpdatingStatus(false);
            }
        })();
    };

    const completeCleaning = () => {
        if (!selectedCleaningRoom) {
            toast.error('Please select a room that is already in cleaning');
            return;
        }

        if (!ensure('UPDATE_CLEANING', 'finish room cleaning')) {
            return;
        }

        void (async () => {
            setIsUpdatingStatus(true);
            try {
                await roomsApi.changeStatus(selectedCleaningRoom.id, 'Available');
                // const updatedRoom = await roomsApi.getById(selectedCleaningRoom.id);
                // if (updatedRoom.status === 'Maintenance') {
                //     toast.error(`Room ${selectedCleaningRoom.roomNumber} was moved to Maintenance. Admin has been notified.`);
                // } else {
                //     toast.success(`Room ${selectedCleaningRoom.roomNumber} marked Available`);
                // }
            } catch (error) {
                const apiError = toApiError(error);
                if (apiError.status === 400 && apiError.message?.toLowerCase().includes('room cannot be set to available')) {
                    toast.error(`Room ${selectedCleaningRoom.roomNumber} cannot be marked Available due to pending issues. It has been moved to Maintenance. Admin has been notified.`, { icon: '⚠️' });
                    return;
                }
                toast.error(apiError.message || 'Failed to finish cleaning');
            } finally {
                await loadBoards();
                setIsUpdatingStatus(false);
            }
        })();
    };

    const submitLoss = () => {
        if (!selectedInspectingRoom) {
            toast.error('Please select an inspecting room');
            return;
        }

        if (!isNoIssueDraft && !lossDraft.roomInventoryId) {
            toast.error('Please select an equipment or amenity item');
            return;
        }

        if (!isNoIssueDraft && lossDraft.quantity <= 0) {
            toast.error('Quantity must be greater than zero');
            return;
        }

        if (!isNoIssueDraft && selectedLossInventory && lossDraft.quantity > selectedLossInventory.quantity) {
            toast.error(`Quantity cannot exceed available amount (${selectedLossInventory.quantity})`);
            return;
        }

        if (!isNoIssueDraft && selectedPendingInventoryIds.has(Number(lossDraft.roomInventoryId))) {
            toast.error('This item is already in pending reports. Undo or delete it first.');
            return;
        }

        const nextPending: PendingLossReport = {
            tempId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            roomId: selectedInspectingRoom.id,
            roomNumber: selectedInspectingRoom.roomNumber,
            noIssue: isNoIssueDraft,
            roomInventoryId: isNoIssueDraft ? undefined : Number(lossDraft.roomInventoryId),
            itemName: isNoIssueDraft
                ? 'NO_ISSUE'
                : (selectedLossInventory?.name ?? 'Unknown item'),
            quantity: isNoIssueDraft ? 0 : lossDraft.quantity,
            penaltyAmount: isNoIssueDraft ? 0 : penaltyAmount,
            description: lossDraft.description.trim(),
            evidenceFile: lossEvidenceFile ?? undefined,
            createdAt: new Date().toISOString(),
        };

        setPendingLossReportsByRoom((prev) => ({
            ...prev,
            [selectedInspectingRoom.id]: [...(prev[selectedInspectingRoom.id] ?? []), nextPending],
        }));

        setOpenLossModal(false);
        setLossDraft(emptyLossDraft);
        setLossEvidenceFile(null);
        setIsNoIssueDraft(false);
        toast.success(isNoIssueDraft ? 'Saved as no-loss check (pending)' : 'Saved loss report (pending). Click Save & Send Reports to submit and move room.');
    };

    const undoLastPendingReport = () => {
        if (!selectedInspectingRoom) {
            return;
        }

        const rows = pendingLossReportsByRoom[selectedInspectingRoom.id] ?? [];
        if (rows.length === 0) {
            toast.error('No pending report to undo');
            return;
        }

        setPendingLossReportsByRoom((prev) => ({
            ...prev,
            [selectedInspectingRoom.id]: (prev[selectedInspectingRoom.id] ?? []).slice(0, -1),
        }));
        toast.success('Undo last pending report');
    };

    const removePendingReport = (tempId: string) => {
        if (!selectedInspectingRoom) {
            return;
        }

        setPendingLossReportsByRoom((prev) => ({
            ...prev,
            [selectedInspectingRoom.id]: (prev[selectedInspectingRoom.id] ?? []).filter((item) => item.tempId !== tempId),
        }));
        toast.success('Removed pending report');
    };

    const saveAndSendPendingReports = () => {
        if (!selectedInspectingRoom) {
            toast.error('Please select an inspecting room');
            return;
        }

        const rows = pendingLossReportsByRoom[selectedInspectingRoom.id] ?? [];
        if (rows.length === 0) {
            toast.error('No pending reports to send');
            return;
        }

        void (async () => {
            setIsSendingPendingReports(true);
            try {
                await sendPendingReports(selectedInspectingRoom.id);
                await roomsApi.changeStatus(selectedInspectingRoom.id, 'Cleaning');

                setPendingLossReportsByRoom((prev) => {
                    const next = { ...prev };
                    delete next[selectedInspectingRoom.id];
                    return next;
                });

                await loadBoards();
                toast.success(`Pending reports sent. Room ${selectedInspectingRoom.roomNumber} moved to Cleaning.`);
            } catch (error) {
                const apiError = toApiError(error);
                toast.error(apiError.message || 'Failed to send reports and move room to Cleaning');
            } finally {
                setIsSendingPendingReports(false);
            }
        })();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Cleaning Workflow</h2>
                    <p className="text-sm text-slate-500">Only supports Inspecting to Cleaning and Cleaning to Available.</p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadBoards()}
                    className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
                    title="Refresh"
                >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === 'inspecting'
                            ? 'bg-cyan-700 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        onClick={() => setActiveTab('inspecting')}
                    >
                        Inspecting Rooms ({inspectingRooms.length})
                    </button>
                    <button
                        type="button"
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === 'cleaning'
                            ? 'bg-cyan-700 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        onClick={() => setActiveTab('cleaning')}
                    >
                        Cleaning Rooms ({cleaningRooms.length})
                    </button>
                </div>
            </div>

            {activeTab === 'inspecting' ? (
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Inspecting Rooms</h3>
                            <p className="text-sm text-slate-500">Report loss and damage, then move the room to Cleaning.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                onClick={completeInspection}
                                disabled={!selectedInspectingRoom || isUpdatingStatus || isSendingPendingReports}
                            >
                                <CheckCircleIcon className="h-4 w-4" /> {isUpdatingStatus ? 'Updating...' : 'Move to Cleaning'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid items-start gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-2 max-h-140 overflow-y-auto pr-1">
                            {inspectingRooms.map((room) => (
                                <button
                                    type="button"
                                    key={room.id}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${activeInspectingRoomId === room.id ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setActiveInspectingRoomId(room.id)}
                                >
                                    Room {room.roomNumber} - Inspecting
                                </button>
                            ))}
                            {!isLoading && inspectingRooms.length === 0 ? <p className="text-xs text-slate-400">No rooms are currently inspecting.</p> : null}
                        </div>

                        <div className="min-w-0 space-y-4 min-h-105">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h4 className="text-sm font-semibold text-slate-900">Selected Room</h4>
                                <p className="mt-1 text-sm text-slate-600">Room: {selectedInspectingRoom?.roomNumber ?? '-'}</p>
                                <p className="mt-1 text-sm text-slate-600">Room Type: {selectedInspectingRoom?.roomType ?? '-'}</p>
                                <p className="mt-1 text-sm text-slate-600">Status: Inspecting</p>
                            </div>

                            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">Equipment & Amenities</h4>
                                        <p className="text-xs text-slate-500">Choose an item to record damage or loss.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        onClick={() => {
                                            if (!selectedInspectingRoom) {
                                                toast.error('Select an inspecting room first');
                                                return;
                                            }
                                            setLossDraft(emptyLossDraft);
                                            setIsNoIssueDraft(false);
                                            setLossEvidenceFile(null);
                                            setOpenLossModal(true);
                                        }}
                                        disabled={!selectedInspectingRoom}
                                    >
                                        <PencilSquareIcon className="h-4 w-4" /> Add Loss Record
                                    </button>
                                </div>

                                <div className="mt-3 overflow-x-auto">
                                    {isLoadingInspectingState ? (
                                        <p className="text-sm text-slate-500">Loading room items...</p>
                                    ) : inspectingState?.inventories.length ? (
                                        <Table columns={inventoryColumns} rows={inspectingState.inventories} />
                                    ) : (
                                        <p className="text-sm text-slate-500">No equipment or amenity items found for this room.</p>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="text-sm font-semibold text-slate-900">Pending Reports (RAM)</h4>
                                    <span className="wrap-break-word text-xs text-slate-500">{pendingLossReports.length} pending, total penalty ${pendingPenaltyTotal}</span>
                                </div>
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:opacity-60"
                                        onClick={undoLastPendingReport}
                                        disabled={!selectedInspectingRoom || pendingLossReports.length === 0 || isUpdatingStatus || isSendingPendingReports}
                                    >
                                        Undo
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                        onClick={saveAndSendPendingReports}
                                        disabled={!selectedInspectingRoom || pendingLossReports.length === 0 || isUpdatingStatus || isSendingPendingReports}
                                    >
                                        {isSendingPendingReports ? 'Sending...' : 'Save & Send Reports'}
                                    </button>
                                </div>
                                {pendingLossReports.length > 0 ? (
                                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                        {pendingLossReports.map((item) => (
                                            <div key={item.tempId} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {item.noIssue ? 'No loss/damage reported' : item.itemName}
                                                        </p>
                                                        <p className="wrap-break-word text-xs">
                                                            Qty: {item.quantity} | Penalty: ${item.penaltyAmount}
                                                            {item.evidenceFile ? ` | Evidence: ${item.evidenceFile.name}` : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs text-amber-700 hover:bg-amber-100"
                                                        onClick={() => removePendingReport(item.tempId)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">No pending report yet.</p>
                                )}
                            </div>

                            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">Loss & Damage Records</h4>
                                <div className="mt-3 overflow-x-auto">
                                    {reportLossRows.length > 0 ? (
                                        <Table columns={lossColumns} rows={reportLossRows} />
                                    ) : (
                                        <p className="text-sm text-slate-500">No loss records for this room yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {activeTab === 'cleaning' ? (
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Cleaning Rooms</h3>
                            <p className="text-sm text-slate-500">Finish cleaning and move the room back to Available.</p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={completeCleaning}
                            disabled={!selectedCleaningRoom || isUpdatingStatus}
                        >
                            <CheckCircleIcon className="h-4 w-4" /> {isUpdatingStatus ? 'Updating...' : 'Mark Available'}
                        </button>
                    </div>

                    <div className="mt-4 grid items-start gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-2 max-h-140 overflow-y-auto pr-1">
                            {cleaningRooms.map((room) => (
                                <button
                                    type="button"
                                    key={room.id}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${activeCleaningRoomId === room.id ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setActiveCleaningRoomId(room.id)}
                                >
                                    Room {room.roomNumber} - Cleaning
                                </button>
                            ))}
                            {!isLoading && cleaningRooms.length === 0 ? <p className="text-xs text-slate-400">No rooms are currently cleaning.</p> : null}
                        </div>

                        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Selected Room</h4>
                            <p className="mt-1 text-sm text-slate-600">Room: {selectedCleaningRoom?.roomNumber ?? '-'}</p>
                            <p className="mt-1 text-sm text-slate-600">Room Type: {selectedCleaningRoom?.roomType ?? '-'}</p>
                            <p className="mt-1 text-sm text-slate-600">Status: Cleaning</p>
                            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                                Review the room manually, then use the button above to move it back to Available.
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            <Modal
                open={openLossModal}
                title="Report Loss and Damage"
                onClose={() => {
                    setOpenLossModal(false);
                    setLossDraft(emptyLossDraft);
                    setLossEvidenceFile(null);
                    setIsNoIssueDraft(false);
                }}
            >
                <div className="space-y-4">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Loss details</h3>
                            <p className="text-xs text-slate-500">Select an existing equipment or amenity item from this room and record the damage.</p>
                        </div>

                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={isNoIssueDraft}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsNoIssueDraft(checked);
                                    if (checked) {
                                        setLossDraft((prev) => ({ ...prev, roomInventoryId: '', quantity: 1 }));
                                        setLossEvidenceFile(null);
                                    }
                                }}
                            />
                            No loss or missing item in this room
                        </label>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Room item</label>
                            <Select
                                disabled={isNoIssueDraft}
                                value={lossDraft.roomInventoryId ? String(lossDraft.roomInventoryId) : ''}
                                onChange={(e) => {
                                    const nextId = e.target.value ? Number(e.target.value) : '';
                                    setLossDraft((prev) => ({
                                        ...prev,
                                        roomInventoryId: nextId,
                                        quantity: 1,
                                    }));
                                }}
                            >
                                <option value="">Select an item</option>
                                {availableInventoriesForDraft.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.quantity})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Quantity damaged/lost</label>
                                <Input
                                    type="number"
                                    disabled={isNoIssueDraft}
                                    min={1}
                                    max={selectedLossInventory?.quantity ?? undefined}
                                    value={lossDraft.quantity}
                                    onChange={(e) =>
                                        setLossDraft((prev) => {
                                            const raw = Number(e.target.value);
                                            const next = Number.isNaN(raw) ? 1 : raw;
                                            const max = selectedLossInventory?.quantity ?? next;
                                            return { ...prev, quantity: Math.max(1, Math.min(next, Math.max(1, max))) };
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Penalty amount (auto calculated)</label>
                                <Input
                                    type="number"
                                    readOnly
                                    value={isNoIssueDraft ? 0 : penaltyAmount}
                                    className="bg-slate-100 text-slate-600"
                                />
                                <p className="text-xs text-slate-500">
                                    Unit price: ${Number(selectedLossInventory?.compensationPrice ?? 0)} x Qty: {isNoIssueDraft ? 0 : lossDraft.quantity}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <Input
                                placeholder="Describe the damage or loss"
                                value={lossDraft.description}
                                onChange={(e) => setLossDraft((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Evidence image (optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                disabled={isNoIssueDraft}
                                onChange={(e) => setLossEvidenceFile(e.target.files?.[0] ?? null)}
                                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-cyan-700"
                            />
                            <p className="text-xs text-slate-500">{lossEvidenceFile ? `Selected: ${lossEvidenceFile.name}` : 'No image selected'}</p>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => {
                                setOpenLossModal(false);
                                setLossDraft(emptyLossDraft);
                                setLossEvidenceFile(null);
                                setIsNoIssueDraft(false);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={submitLoss}
                            disabled={isUpdatingStatus}
                        >
                            Save Pending Report
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
