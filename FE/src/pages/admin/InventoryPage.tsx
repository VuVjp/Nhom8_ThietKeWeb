import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import type { InventoryItem } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { roomInventoriesApi, type UpdateRoomInventoryPayload } from '../../api/roomInventoriesApi';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
import { equipmentsApi, type EquipmentItem } from '../../api/equipmentsApi';
import { roomsApi } from '../../api/roomsApi';
import type { Room } from '../../types/models';
import { paginate, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { Badge } from '../../components/Badge';

export function InventoryPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<InventoryItem[]>([]);
    const [amenities, setAmenities] = useState<AmenityItem[]>([]);
    const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [roomFilterId, setRoomFilterId] = useState('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'amenity' | 'equipment'>('all');
    const [itemFilterId, setItemFilterId] = useState('all');
    const [sortMode, setSortMode] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const [inventoryData, amenityData, equipmentData, roomData] = await Promise.all([
                roomInventoriesApi.getAll(),
                amenitiesApi.getAll(),
                equipmentsApi.getAll(),
                roomsApi.getAll(),
            ]);
            setRows(inventoryData);
            setAmenities(amenityData);
            setEquipments(equipmentData);
            setRooms(roomData);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        setIsSaving(true);
        try {
            const payload: UpdateRoomInventoryPayload = {
                roomId: editingItem.roomId,
                equipmentId: editingItem.equipmentId,
                amenityId: editingItem.amenityId,
                itemName: editingItem.name,
                quantity: editingItem.quantity,
                priceIfLost: editingItem.compensationPrice,
            };

            await roomInventoriesApi.update(editingItem.id, payload);

            setRows((prev) =>
                prev.map((item) => (item.id === editingItem.id ? editingItem : item))
            );

            toast.success(`Updated ${editingItem.code} successfully`);
            handleCloseEditModal();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update inventory item');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        void loadInventory();
    }, [loadInventory]);

    const filtered = useMemo(() => {
        const next = rows.filter((item) => {
            const byRoomId = roomFilterId === 'all' || String(item.roomId ?? '') === roomFilterId;
            const byType =
                typeFilter === 'all' ||
                (typeFilter === 'amenity' && Boolean(item.amenityId)) ||
                (typeFilter === 'equipment' && Boolean(item.equipmentId));

            const byItemId =
                itemFilterId === 'all' ||
                (typeFilter === 'amenity' && String(item.amenityId ?? '') === itemFilterId) ||
                (typeFilter === 'equipment' && String(item.equipmentId ?? '') === itemFilterId);

            return byRoomId && byType && byItemId;
        });

        return sortBy(next, (item) => item.name, sortMode);
    }, [rows, roomFilterId, typeFilter, itemFilterId, sortMode]);

    const roomLookup = useMemo(
        () => new Map(rooms.map((room) => [room.id, room])),
        [rooms],
    );

    const filteredRoomOptions = useMemo(
        () => rooms.filter((room) => rows.some((row) => row.roomId === room.id)),
        [rooms, rows],
    );

    const filteredAmenityOptions = useMemo(() => {
        return amenities.filter((item) => {
            if (!(item.isActive || rows.some((row) => row.amenityId === item.id))) {
                return false;
            }
            if (roomFilterId === 'all') {
                return true;
            }
            return rows.some((row) => String(row.roomId ?? '') === roomFilterId && row.amenityId === item.id);
        });
    }, [amenities, rows, roomFilterId]);

    const filteredEquipmentOptions = useMemo(() => {
        return equipments.filter((item) => {
            if (!(item.isActive || rows.some((row) => row.equipmentId === item.id))) {
                return false;
            }
            if (roomFilterId === 'all') {
                return true;
            }
            return rows.some((row) => String(row.roomId ?? '') === roomFilterId && row.equipmentId === item.id);
        });
    }, [equipments, rows, roomFilterId]);

    const itemOptions = useMemo(() => {
        if (typeFilter === 'amenity') {
            return filteredAmenityOptions.map((item) => ({
                id: String(item.id),
                label: item.name,
            }));
        }

        if (typeFilter === 'equipment') {
            return filteredEquipmentOptions.map((item) => ({
                id: String(item.id),
                label: `${item.itemCode} - ${item.name}`,
            }));
        }

        return [];
    }, [typeFilter, filteredAmenityOptions, filteredEquipmentOptions]);

    useEffect(() => {
        setItemFilterId('all');
    }, [typeFilter, roomFilterId]);

    const toggleInventoryActive = async (item: InventoryItem) => {
        if (!ensure('MANAGE_INVENTORY', 'toggle inventory active status')) {
            return;
        }
        try {
            await roomInventoriesApi.toggleActive(item.id);
            setRows((prev) =>
                prev.map((row) =>
                    row.id === item.id
                        ? {
                            ...row,
                            isActive: !row.isActive,
                        }
                        : row,
                ),
            );
            toast.success(`${item.code} is now ${item.isActive ? 'OFF' : 'ON'}`);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to toggle inventory status');
        }
    };

    const pageSize = 10;
    const paged = paginate(filtered, page, pageSize);

    const columns = [
        { key: 'code', label: 'Code', render: (row: InventoryItem) => row.code },
        { key: 'name', label: 'Name', render: (row: InventoryItem) => row.name },
        {
            key: 'room',
            label: 'Room',
            render: (row: InventoryItem) => {
                const room = row.roomId ? roomLookup.get(row.roomId) : undefined;
                return room ? room.roomNumber : `#${row.roomId ?? '-'}`;
            },
        },
        { key: 'category', label: 'Category', render: (row: InventoryItem) => (row.amenityId ? 'Amenity' : 'Equipment') },
        { key: 'unit', label: 'Unit', render: (row: InventoryItem) => row.unit },
        { key: 'price', label: 'Price', render: (row: InventoryItem) => `$${row.price}` },
        { key: 'stock', label: 'Stock', render: (row: InventoryItem) => row.stock },
        {
            key: 'status',
            label: 'Status',
            render: (row: InventoryItem) => (
                <button
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        void toggleInventoryActive(row);
                    }}
                >
                    <Badge value={row.isActive ? 'Active' : 'Inactive'} />
                </button>

            ),
        },
        // {
        //     key: 'actions',
        //     label: 'Actions',
        //     render: (row: InventoryItem) => (
        //         <div className="flex gap-2">
        //             <button
        //                 type="button"
        //                 className={`rounded-lg border px-2 py-1 text-xs ${row.isActive ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}`}
        //                 onClick={() => {
        //                     if (!ensure('MANAGE_INVENTORY', 'toggle inventory active status')) {
        //                         return;
        //                     }
        //                     void (async () => {
        //                         try {
        //                             await roomInventoriesApi.toggleActive(row.id);
        //                             setRows((prev) =>
        //                                 prev.map((item) =>
        //                                     item.id === row.id
        //                                         ? {
        //                                             ...item,
        //                                             isActive: !item.isActive,
        //                                         }
        //                                         : item,
        //                                 ),
        //                             );
        //                             toast.success(`${row.code} is now ${row.isActive ? 'OFF' : 'ON'}`);
        //                         } catch (error) {
        //                             const apiError = toApiError(error);
        //                             toast.error(apiError.message || 'Failed to toggle inventory status');
        //                         }
        //                     })();
        //                 }}
        //             >
        //                 {row.isActive ? 'Set OFF' : 'Set ON'}
        //             </button>
        //         </div>
        //     ),
        // },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
                <p className="text-sm text-slate-500">Search, sort, filter and maintain hotel inventory.</p>
            </div>

            <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
                <Select value={roomFilterId} onChange={(e) => setRoomFilterId(e.target.value)}>
                    <option value="all">Room: All</option>
                    {filteredRoomOptions.map((room) => (
                        <option key={room.id} value={room.id}>{room.roomNumber}</option>
                    ))}
                </Select>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'amenity' | 'equipment')}>
                    <option value="all">Type: All</option>
                    <option value="amenity">Type: Amenity</option>
                    <option value="equipment">Type: Equipment</option>
                </Select>
                <Select
                    value={itemFilterId}
                    onChange={(e) => setItemFilterId(e.target.value)}
                    disabled={typeFilter === 'all'}
                >
                    <option value="all">
                        {typeFilter === 'amenity' ? 'Amenity: All' : typeFilter === 'equipment' ? 'Equipment: All' : 'Choose Type First'}
                    </option>
                    {itemOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                </Select>
                <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'asc' | 'desc')}><option value="asc">Sort A-Z</option><option value="desc">Sort Z-A</option></Select>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 flex-1"
                        onClick={() => {
                            setRoomFilterId('all');
                            setTypeFilter('all');
                            setItemFilterId('all');
                            setSortMode('asc');
                            void loadInventory();
                            toast('Filters refreshed', { icon: 'ℹ️' });
                        }}
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <Table columns={columns} rows={isLoading ? [] : paged} />
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

            <Modal
                open={isEditModalOpen}
                title={editingItem ? `Edit ${editingItem.code}` : 'Edit Item'}
                onClose={handleCloseEditModal}
            >
                {editingItem && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Item Name</label>
                            <Input
                                value={editingItem.name}
                                onChange={(e) =>
                                    setEditingItem({ ...editingItem, name: e.target.value })
                                }
                                placeholder="Enter item name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Category</label>
                            <Input value={editingItem.amenityId ? 'Amenity' : 'Equipment'} disabled />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Unit</label>
                            <Input
                                value={editingItem.unit}
                                onChange={(e) =>
                                    setEditingItem({ ...editingItem, unit: e.target.value })
                                }
                                placeholder="e.g., pcs, kg, liter"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Quantity
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingItem.quantity}
                                    onChange={(e) =>
                                        setEditingItem({
                                            ...editingItem,
                                            quantity: Number(e.target.value),
                                        })
                                    }
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Price If Lost
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingItem.compensationPrice}
                                    onChange={(e) =>
                                        setEditingItem({
                                            ...editingItem,
                                            compensationPrice: Number(e.target.value),
                                        })
                                    }
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                onClick={handleCloseEditModal}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
}
