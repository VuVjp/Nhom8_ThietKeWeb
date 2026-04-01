import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrashIcon, PencilIcon, PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Tabs } from '../../components/Tabs';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { roomTemplateInventory, inventorySeed, roomsSeed } from '../../mock/data';
import type { InventoryItem } from '../../types/models';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

export function RoomDetailPage() {
  const { ensure } = usePermissionCheck();
  const { roomId } = useParams();
  const room = roomsSeed.find((item) => String(item.id) === roomId);
  const [items, setItems] = useState<InventoryItem[]>(inventorySeed.slice(0, 12));
  const [openAdd, setOpenAdd] = useState(false);
  const [draft, setDraft] = useState<Partial<InventoryItem>>({ unit: 'pcs' });

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
                if (!ensure('manage_inventory', 'edit room inventory item')) {
                  return;
                }
                toast.success(`Edit ${row.code}`);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-200 p-1.5 text-rose-600"
              onClick={() => {
                if (!ensure('manage_inventory', 'delete room inventory item')) {
                  return;
                }
                setItems((prev) => prev.filter((item) => item.id !== row.id));
                toast.error(`Deleted ${row.code}`);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [ensure],
  );

  const addItem = () => {
    if (!ensure('manage_inventory', 'add room inventory item')) {
      return;
    }

    if (!draft.code || !draft.name || !draft.unit) {
      toast.error('Please complete item code, name and unit');
      return;
    }

    const safeCode = draft.code;
    const safeName = draft.name;
    const safeUnit = draft.unit;

    setItems((prev) => [
      {
        id: Date.now(),
        code: safeCode,
        name: safeName,
        unit: safeUnit,
        quantity: Number(draft.quantity ?? 1),
        compensationPrice: Number(draft.compensationPrice ?? 0),
        notes: draft.notes ?? 'Added manually',
        category: 'Linen',
        price: 0,
        stock: 0,
      },
      ...prev,
    ]);
    setOpenAdd(false);
    setDraft({ unit: 'pcs' });
    toast.success('Inventory item added');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Room {room?.roomNumber ?? roomId} Details</h2>
        <p className="text-sm text-slate-500">Detailed room profile and inventory controls.</p>
      </div>

      <Tabs
        tabs={[
          {
            key: 'details',
            label: 'Room Details',
            content: (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600">Room Type: {room?.roomType ?? 'Unknown'}</p>
                <p className="mt-1 text-sm text-slate-600">Floor: {room?.floor ?? '-'}</p>
                <p className="mt-1 text-sm text-slate-600">Current Status: {room?.status ?? '-'}</p>
              </div>
            ),
          },
          {
            key: 'inventory',
            label: 'Inventory Management',
            content: (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    onClick={() => {
                      if (!ensure('manage_inventory', 'open add inventory form')) {
                        return;
                      }
                      setOpenAdd(true);
                    }}
                  >
                    <PlusIcon className="h-4 w-4" /> Add Item
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm text-white"
                    onClick={() => {
                      if (!ensure('manage_inventory', 'clone template inventory')) {
                        return;
                      }
                      setItems(roomTemplateInventory.map((item, idx) => ({ ...item, id: Date.now() + idx })));
                      toast.success('Template applied to this room');
                    }}
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" /> Clone from Template
                  </button>
                </div>
                <Table columns={columns} rows={items} />
              </div>
            ),
          },
        ]}
      />

      <Modal open={openAdd} title="Add Inventory Item" onClose={() => setOpenAdd(false)}>
        <div className="space-y-3">
          <Input placeholder="Item code" value={draft.code ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value }))} />
          <Input placeholder="Name" value={draft.name ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Unit" value={draft.unit ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))} />
          <Input placeholder="Quantity" type="number" value={draft.quantity ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))} />
          <Input placeholder="Compensation price" type="number" value={draft.compensationPrice ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, compensationPrice: Number(e.target.value) }))} />
          <Input placeholder="Notes" value={draft.notes ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpenAdd(false)}>Cancel</button>
            <button type="button" className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white" onClick={addItem}>Add Item</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
