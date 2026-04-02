import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrashIcon, PencilIcon, PlusIcon, DocumentDuplicateIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import type { InventoryItem, Room } from '../../types/models';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { toApiError } from '../../api/httpClient';
import { roomInventoriesApi } from '../../api/roomInventoriesApi';
import { roomsApi } from '../../api/roomsApi';
import { equipmentsApi, type EquipmentItem } from '../../api/equipmentsApi';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';

export function RoomDetailPage() {
  const { ensure } = usePermissionCheck();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [addMode, setAddMode] = useState<'equipment' | 'amenity'>('equipment');
  const [draft, setDraft] = useState<Partial<InventoryItem>>({ quantity: 1, compensationPrice: 0 });
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentItem[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<AmenityItem[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | ''>('');
  const [selectedAmenityId, setSelectedAmenityId] = useState<number | ''>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editMode, setEditMode] = useState<'equipment' | 'amenity'>('equipment');
  const [editDraft, setEditDraft] = useState<{ quantity: number; compensationPrice: number }>({ quantity: 1, compensationPrice: 0 });
  const [selectedEditEquipmentId, setSelectedEditEquipmentId] = useState<number | ''>('');
  const [selectedEditAmenityId, setSelectedEditAmenityId] = useState<number | ''>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const roomIdNumber = Number(roomId ?? 0);

  const loadRoom = useCallback(async () => {
    if (!roomIdNumber) {
      return;
    }

    try {
      const data = await roomsApi.getById(roomIdNumber);
      setRoom(data);
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(apiError.message || 'Failed to load room details');
    }
  }, [roomIdNumber]);

  const loadInventory = useCallback(async () => {
    if (!roomIdNumber) {
      return;
    }

    try {
      const data = await roomInventoriesApi.getByRoom(roomIdNumber);
      setItems(data);
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(apiError.message || 'Failed to load room inventory');
    }
  }, [roomIdNumber]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    void (async () => {
      try {
        const [equipmentData, amenityData] = await Promise.all([
          equipmentsApi.getAll(),
          amenitiesApi.getAll(),
        ]);

        setEquipmentOptions(equipmentData);
        setAmenityOptions(amenityData);
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || 'Failed to load existing equipment/amenity options');
      }
    })();
  }, []);

  const resetAddForm = () => {
    setOpenAdd(false);
    setAddMode('equipment');
    setSelectedEquipmentId('');
    setSelectedAmenityId('');
    setDraft({ quantity: 1, compensationPrice: 0 });
  };

  const resetEditForm = () => {
    setEditingItem(null);
    setEditMode('equipment');
    setEditDraft({ quantity: 1, compensationPrice: 0 });
    setSelectedEditEquipmentId('');
    setSelectedEditAmenityId('');
  };

  const isAmenityInventoryName = (name: string) => name.trim().toLowerCase().startsWith('[amenity]');
  const removeAmenityPrefix = (name: string) => name.replace(/^\[amenity\]\s*/i, '').trim();
  const normalizeName = (name: string) => name.trim().toLowerCase();

  const amenityItems = useMemo(
    () => items.filter((item) => item.name.trim().toLowerCase().startsWith('[amenity]')),
    [items],
  );

  const equipmentItems = useMemo(
    () => items.filter((item) => !item.name.trim().toLowerCase().startsWith('[amenity]')),
    [items],
  );

  const selectedEquipment = useMemo(
    () => equipmentOptions.find((item) => item.id === selectedEquipmentId),
    [equipmentOptions, selectedEquipmentId],
  );

  const selectedAmenity = useMemo(
    () => amenityOptions.find((item) => item.id === selectedAmenityId),
    [amenityOptions, selectedAmenityId],
  );

  const canSubmitAdd = useMemo(() => {
    if (addMode === 'equipment') {
      return Boolean(selectedEquipment) && Number(draft.quantity ?? 0) > 0;
    }

    return Boolean(selectedAmenity);
  }, [addMode, selectedEquipment, selectedAmenity, draft.quantity]);

  const selectedEditEquipment = useMemo(
    () => equipmentOptions.find((item) => item.id === selectedEditEquipmentId),
    [equipmentOptions, selectedEditEquipmentId],
  );

  const selectedEditAmenity = useMemo(
    () => amenityOptions.find((item) => item.id === selectedEditAmenityId),
    [amenityOptions, selectedEditAmenityId],
  );

  const canSubmitEdit = useMemo(() => {
    if (!editingItem) {
      return false;
    }

    if (editMode === 'equipment') {
      return Boolean(selectedEditEquipment) && Number(editDraft.quantity ?? 0) > 0;
    }

    return Boolean(selectedEditAmenity);
  }, [editingItem, editMode, selectedEditEquipment, selectedEditAmenity, editDraft.quantity]);

  const columns = useMemo(
    () => [
      { key: 'code', label: 'Item Code', render: (row: InventoryItem) => row.code },
      { key: 'name', label: 'Name', render: (row: InventoryItem) => row.name },
      { key: 'unit', label: 'Unit', render: (row: InventoryItem) => row.unit },
      { key: 'quantity', label: 'Quantity', render: (row: InventoryItem) => row.quantity },
      { key: 'comp', label: 'Compensation Price', render: (row: InventoryItem) => `$${row.compensationPrice}` },
      { key: 'notes', label: 'Notes', render: (row: InventoryItem) => row.notes },
      {
        key: 'actions',
        label: 'Actions',
        render: (row: InventoryItem) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-1.5"
              onClick={() => {
                if (!ensure('update_room_inventory', 'edit room inventory item')) {
                  return;
                }

                const amenityRow = isAmenityInventoryName(row.name);
                const rowNameWithoutPrefix = removeAmenityPrefix(row.name);

                setEditingItem(row);
                setEditMode(amenityRow ? 'amenity' : 'equipment');
                setEditDraft({
                  quantity: amenityRow ? 1 : Number(row.quantity || 1),
                  compensationPrice: amenityRow ? 0 : Number(row.compensationPrice || 0),
                });

                if (amenityRow) {
                  const matchedAmenity = amenityOptions.find(
                    (item) => item.name.trim().toLowerCase() === rowNameWithoutPrefix.toLowerCase(),
                  );
                  setSelectedEditAmenityId(matchedAmenity?.id ?? '');
                  setSelectedEditEquipmentId('');
                } else {
                  const matchedEquipment = equipmentOptions.find(
                    (item) => item.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
                  );
                  setSelectedEditEquipmentId(matchedEquipment?.id ?? '');
                  setSelectedEditAmenityId('');
                }
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-200 p-1.5 text-rose-600"
              onClick={() => {
                if (!ensure('delete_room_inventory', 'delete room inventory item')) {
                  return;
                }
                void (async () => {
                  try {
                    await roomInventoriesApi.remove(row.id);
                    setItems((prev) => prev.filter((item) => item.id !== row.id));
                    toast.success(isAmenityInventoryName(row.name) ? `Removed amenity ${removeAmenityPrefix(row.name)}` : `Removed equipment ${row.name}`);
                  } catch (error) {
                    const apiError = toApiError(error);
                    toast.error(apiError.message || 'Failed to delete item');
                  }
                })();
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [ensure, amenityOptions, equipmentOptions],
  );

  const addItem = () => {
    if (!ensure('create_room_inventory', 'add room inventory item')) {
      return;
    }

    if (!roomIdNumber) {
      toast.error('Invalid room ID');
      return;
    }

    if (addMode === 'equipment' && !selectedEquipment) {
      toast.error('Please choose an existing equipment item');
      return;
    }

    if (addMode === 'amenity' && !selectedAmenity) {
      toast.error('Please choose an existing amenity');
      return;
    }

    void (async () => {
      setIsAdding(true);
      try {
        const itemName = addMode === 'amenity' ? `[Amenity] ${selectedAmenity?.name ?? ''}` : selectedEquipment?.name ?? '';
        const quantity = addMode === 'amenity' ? 1 : Number(draft.quantity ?? 1);
        const priceIfLost =
          addMode === 'amenity'
            ? 0
            : Number(draft.compensationPrice ?? selectedEquipment?.defaultPriceIfLost ?? 0);

        if (addMode === 'equipment') {
          const existingEquipmentRow = equipmentItems.find(
            (item) => normalizeName(item.name) === normalizeName(itemName),
          );

          if (existingEquipmentRow) {
            await roomInventoriesApi.update(existingEquipmentRow.id, {
              roomId: roomIdNumber,
              itemName,
              quantity: Number(existingEquipmentRow.quantity ?? 0) + quantity,
              priceIfLost,
            });

            await loadInventory();
            resetAddForm();
            toast.success(`Equipment already exists. Quantity increased by ${quantity}.`);
            return;
          }
        }

        if (addMode === 'amenity') {
          const amenityName = removeAmenityPrefix(itemName);
          const existingAmenityRow = amenityItems.find(
            (item) => normalizeName(removeAmenityPrefix(item.name)) === normalizeName(amenityName),
          );

          if (existingAmenityRow) {
            toast.error('Amenity already exists in this room');
            return;
          }
        }

        await roomInventoriesApi.create({
          roomId: roomIdNumber,
          itemName,
          quantity,
          priceIfLost,
        });
        await loadInventory();
        resetAddForm();
        toast.success(addMode === 'amenity' ? 'Amenity added to room' : 'Equipment added to room');
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || `Failed to add ${addMode}`);
      } finally {
        setIsAdding(false);
      }
    })();
  };

  const saveEditItem = () => {
    if (!editingItem) {
      return;
    }

    if (!ensure('update_room_inventory', 'save room inventory item edit')) {
      return;
    }

    if (!roomIdNumber) {
      toast.error('Invalid room ID');
      return;
    }

    if (editMode === 'equipment' && !selectedEditEquipment) {
      toast.error('Please choose an existing equipment item');
      return;
    }

    if (editMode === 'amenity' && !selectedEditAmenity) {
      toast.error('Please choose an existing amenity');
      return;
    }

    void (async () => {
      setIsSavingEdit(true);
      try {
        const itemName = editMode === 'amenity' ? `[Amenity] ${selectedEditAmenity?.name ?? ''}` : selectedEditEquipment?.name ?? '';
        const quantity = editMode === 'amenity' ? 1 : Number(editDraft.quantity ?? 1);
        const priceIfLost =
          editMode === 'amenity'
            ? 0
            : Number(editDraft.compensationPrice ?? selectedEditEquipment?.defaultPriceIfLost ?? 0);

        if (editMode === 'equipment') {
          const duplicateEquipmentRow = equipmentItems.find(
            (item) => item.id !== editingItem.id && normalizeName(item.name) === normalizeName(itemName),
          );

          if (duplicateEquipmentRow) {
            toast.error('This equipment already exists in room inventory. Use that row to adjust quantity.');
            return;
          }
        }

        if (editMode === 'amenity') {
          const duplicateAmenityRow = amenityItems.find(
            (item) => item.id !== editingItem.id && normalizeName(removeAmenityPrefix(item.name)) === normalizeName(removeAmenityPrefix(itemName)),
          );

          if (duplicateAmenityRow) {
            toast.error('This amenity already exists in room inventory.');
            return;
          }
        }

        await roomInventoriesApi.update(editingItem.id, {
          roomId: roomIdNumber,
          itemName,
          quantity,
          priceIfLost,
        });

        await loadInventory();
        resetEditForm();
        toast.success(editMode === 'amenity' ? 'Amenity updated' : 'Equipment updated');
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || `Failed to update ${editMode}`);
      } finally {
        setIsSavingEdit(false);
      }
    })();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Room {room?.roomNumber ?? roomId} Details</h2>
          <p className="text-sm text-slate-500">Detailed room profile with equipment and amenity controls in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/rooms')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Rooms
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Room Details</h3>
        <p className="mt-2 text-sm text-slate-600">Room Type: {room?.roomType ?? 'Unknown'}</p>
        <p className="mt-1 text-sm text-slate-600">Floor: {room?.floor ?? '-'}</p>
        <p className="mt-1 text-sm text-slate-600">Current Status: {room?.status ?? '-'}</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onClick={() => {
              if (!ensure('create_room_inventory', 'open add equipment form')) {
                return;
              }
              setAddMode('equipment');
              setSelectedAmenityId('');
              setOpenAdd(true);
            }}
          >
            <PlusIcon className="h-4 w-4" /> Add Equipment
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm text-white"
            onClick={() => {
              if (!ensure('create_room_inventory', 'open add amenity form')) {
                return;
              }
              setAddMode('amenity');
              setSelectedEquipmentId('');
              setOpenAdd(true);
            }}
          >
            <PlusIcon className="h-4 w-4" /> Add Amenity
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DocumentDuplicateIcon className="h-4 w-4 text-cyan-700" />
            <h3 className="text-sm font-semibold text-slate-900">Equipment</h3>
          </div>
          <Table columns={columns} rows={equipmentItems} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DocumentDuplicateIcon className="h-4 w-4 text-cyan-700" />
            <h3 className="text-sm font-semibold text-slate-900">Amenities</h3>
          </div>
          <Table columns={columns} rows={amenityItems} />
        </div>
      </div>

      <Modal
        open={openAdd}
        title={addMode === 'amenity' ? 'Add Amenity to Room' : 'Add Equipment to Room'}
        onClose={resetAddForm}
      >
        <div className="space-y-4">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Select item type</h3>
              <p className="text-xs text-slate-500">Choose whether you want to attach existing equipment or an existing amenity.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="item-type"
                  checked={addMode === 'equipment'}
                  onChange={() => {
                    setAddMode('equipment');
                    setSelectedAmenityId('');
                  }}
                />
                Equipment
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="item-type"
                  checked={addMode === 'amenity'}
                  onChange={() => {
                    setAddMode('amenity');
                    setSelectedEquipmentId('');
                  }}
                />
                Amenity
              </label>
            </div>
          </section>

          {addMode === 'equipment' ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Equipment setup</h3>
                <p className="text-xs text-slate-500">Select existing equipment, then adjust quantity and compensation price for this room.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Existing equipment</label>
                <Select
                  value={selectedEquipmentId ? String(selectedEquipmentId) : ''}
                  onChange={(e) => {
                    const nextId = e.target.value ? Number(e.target.value) : '';
                    setSelectedEquipmentId(nextId);

                    const selected = equipmentOptions.find((item) => item.id === nextId);
                    if (selected) {
                      setDraft((prev) => ({
                        ...prev,
                        quantity: prev.quantity ?? 1,
                        compensationPrice: selected.defaultPriceIfLost,
                      }));
                    }
                  }}
                >
                  <option value="">Select equipment</option>
                  {equipmentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemCode} - {item.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">Only equipment already created in the equipment catalog can be attached.</p>
              </div>

              {selectedEquipment ? (
                <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 sm:grid-cols-3">
                  <p><span className="font-medium text-slate-800">Code:</span> {selectedEquipment.itemCode}</p>
                  <p><span className="font-medium text-slate-800">Unit:</span> {selectedEquipment.unit}</p>
                  <p><span className="font-medium text-slate-800">Default loss price:</span> ${selectedEquipment.defaultPriceIfLost}</p>
                </div>
              ) : null}

              <Input
                placeholder="Quantity"
                type="number"
                min={1}
                value={draft.quantity ?? 1}
                onChange={(e) => setDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
              />
              <Input
                placeholder="Compensation price"
                type="number"
                min={0}
                value={draft.compensationPrice ?? 0}
                onChange={(e) => setDraft((prev) => ({ ...prev, compensationPrice: Number(e.target.value) }))}
              />
            </section>
          ) : (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Amenity setup</h3>
                <p className="text-xs text-slate-500">Choose an existing amenity to attach. Quantity and compensation are applied automatically.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Existing amenity</label>
                <Select
                  value={selectedAmenityId ? String(selectedAmenityId) : ''}
                  onChange={(e) => setSelectedAmenityId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select amenity</option>
                  {amenityOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">Amenity names come from the amenity catalog.</p>
              </div>
              {selectedAmenity ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <p><span className="font-medium text-slate-800">Selected amenity:</span> {selectedAmenity.name}</p>
                  <p className="mt-1">Attachment rule: quantity = 1, compensation price = 0.</p>
                </div>
              ) : null}
            </section>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={resetAddForm}>Cancel</button>
            <button
              type="button"
              className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={addItem}
              disabled={!canSubmitAdd || isAdding}
            >
              {isAdding ? 'Adding...' : addMode === 'amenity' ? 'Add Amenity' : 'Add Equipment'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingItem)}
        title={editMode === 'amenity' ? 'Edit Amenity in Room' : 'Edit Equipment in Room'}
        onClose={resetEditForm}
      >
        <div className="space-y-4">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Item type</h3>
              <p className="text-xs text-slate-500">This type is based on the selected row and can be switched if needed.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="edit-item-type"
                  checked={editMode === 'equipment'}
                  onChange={() => {
                    setEditMode('equipment');
                    setSelectedEditAmenityId('');
                  }}
                />
                Equipment
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="edit-item-type"
                  checked={editMode === 'amenity'}
                  onChange={() => {
                    setEditMode('amenity');
                    setSelectedEditEquipmentId('');
                  }}
                />
                Amenity
              </label>
            </div>
          </section>

          {editMode === 'equipment' ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Equipment details</h3>
                <p className="text-xs text-slate-500">Choose equipment and update quantity/compensation values for this room.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Existing equipment</label>
                <Select
                  value={selectedEditEquipmentId ? String(selectedEditEquipmentId) : ''}
                  onChange={(e) => {
                    const nextId = e.target.value ? Number(e.target.value) : '';
                    setSelectedEditEquipmentId(nextId);

                    const selected = equipmentOptions.find((item) => item.id === nextId);
                    if (selected) {
                      setEditDraft((prev) => ({
                        ...prev,
                        compensationPrice: selected.defaultPriceIfLost,
                      }));
                    }
                  }}
                >
                  <option value="">Select equipment</option>
                  {equipmentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemCode} - {item.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                placeholder="Quantity"
                type="number"
                min={1}
                value={editDraft.quantity}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
              />
              <Input
                placeholder="Compensation price"
                type="number"
                min={0}
                value={editDraft.compensationPrice}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, compensationPrice: Number(e.target.value) }))}
              />
            </section>
          ) : (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Amenity details</h3>
                <p className="text-xs text-slate-500">Choose an amenity to attach. Quantity and compensation follow default amenity rule.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Existing amenity</label>
                <Select
                  value={selectedEditAmenityId ? String(selectedEditAmenityId) : ''}
                  onChange={(e) => setSelectedEditAmenityId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select amenity</option>
                  {amenityOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </div>
              <p className="text-xs text-slate-500">Applied values: quantity = 1, compensation price = 0.</p>
            </section>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={resetEditForm}>Cancel</button>
            <button
              type="button"
              className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={saveEditItem}
              disabled={!canSubmitEdit || isSavingEdit}
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
