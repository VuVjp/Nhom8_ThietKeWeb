import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { Voucher } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { vouchersApi } from '../../api/vouchersApi';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { paginate, queryIncludes, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

type SortConfig = {
  key: keyof Voucher;
  direction: 'asc' | 'desc';
};

export function VouchersPage() {
  const { ensure } = usePermissionCheck();
  const [rows, setRows] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortConfig>({ key: 'code', direction: 'asc' });

  const [openModal, setOpenModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Voucher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discountType: 'Percentage' as 'Percentage' | 'Fixed',
    discountValue: 0,
    minBookingValue: 0,
    usageLimit: 1,
    validFrom: '',
    validTo: '',
    isActive: true
  });

  const loadVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await vouchersApi.getAll();
      setRows(data || []);
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(apiError.message || 'Failed to load vouchers');
      // Mock data if API fails to show design
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const handleSort = (key: keyof Voucher) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filtered = useMemo(() => {
    const next = rows.filter((item) => {
      const matchQuery = queryIncludes(item.code, query);
      const matchType = typeFilter === 'all' || item.discountType === typeFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive);
      return matchQuery && matchType && matchStatus;
    });

    return sortBy(next, (item) => item[sort.key] as string | number, sort.direction);
  }, [rows, query, typeFilter, statusFilter, sort]);

  const pageSize = 8;
  const paged = paginate(filtered, page, pageSize);

  const handleToggleActive = async (id: number) => {
    if (!ensure('MANAGE_VOUCHERS', 'toggle voucher status')) return;
    try {
      await vouchersApi.toggleActive(id);
      setRows(prev => prev.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v));
      toast.success('Voucher status updated');
    } catch (error) {
      toast.error(toApiError(error).message || 'Failed to toggle status');
    }
  };

  const handleOpenCreate = () => {
    if (!ensure('MANAGE_VOUCHERS', 'create voucher')) return;
    setEditTarget(null);
    setForm({
      code: '',
      discountType: 'Percentage',
      discountValue: 0,
      minBookingValue: 0,
      usageLimit: 1,
      validFrom: '',
      validTo: '',
      isActive: true
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (voucher: Voucher) => {
    if (!ensure('MANAGE_VOUCHERS', 'edit voucher')) return;
    setEditTarget(voucher);
    setForm({
      code: voucher.code,
      discountType: (voucher.discountType as any) || 'Percentage',
      discountValue: voucher.discountValue,
      minBookingValue: voucher.minBookingValue,
      usageLimit: voucher.usageLimit,
      validFrom: voucher.validFrom.split('T')[0],
      validTo: voucher.validTo.split('T')[0],
      isActive: voucher.isActive
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await vouchersApi.update(editTarget.id, form);
        toast.success('Voucher updated successfully');
      } else {
        await vouchersApi.create(form);
        toast.success('Voucher created successfully');
      }
      setOpenModal(false);
      await loadVouchers();
    } catch (error) {
      toast.error(toApiError(error).message || 'Failed to save voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row: Voucher) => (
        <span className="font-mono font-bold text-slate-700">{row.code}</span>
      ),
      sortable: true
    },
    {
      key: 'discount',
      label: 'Discount',
      render: (row: Voucher) => (
        <div>
          <span className="font-semibold text-cyan-700">
            {row.discountType === 'Percentage' ? `${row.discountValue}%` : `$${row.discountValue}`}
          </span>
          <p className="text-xs text-slate-400">Min: ${row.minBookingValue}</p>
        </div>
      )
    },
    {
      key: 'validity',
      label: 'Validity',
      render: (row: Voucher) => (
        <div className="text-xs">
          <p><span className="text-slate-400">From:</span> {new Date(row.validFrom).toLocaleDateString()}</p>
          <p><span className="text-slate-400">To:</span> {new Date(row.validTo).toLocaleDateString()}</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (row: Voucher) => (
        <div className="text-xs">
          <div className="flex justify-between mb-1">
            <span>{row.usageCount} / {row.usageLimit}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-cyan-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((row.usageCount / row.usageLimit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Voucher) => (
        <button
          style={{ cursor: 'pointer' }}
          onClick={() => handleToggleActive(row.id)}>
          <Badge value={row.isActive ? 'Active' : 'Inactive'} />
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Voucher) => (
        <div className="flex gap-2">
          <button
            className="p-1 text-slate-400 hover:text-cyan-600 transition"
            onClick={() => handleOpenEdit(row)}
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          {/* <button 
            className="p-1 text-slate-400 hover:text-red-600 transition"
            onClick={() => handleDelete(row.id)}
          >
            <TrashIcon className="h-5 w-5" />
          </button> */}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Voucher Management</h2>
          <p className="text-sm text-slate-500">Create and manage discount codes for bookings.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadVouchers}
            className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 transition"
          >
            <PlusIcon className="h-4 w-4" /> Create Voucher
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <Input
          placeholder="Search voucher code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Percentage">Percentage</option>
          <option value="Fixed">Fixed Amount</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Select>
        <div className="flex items-center gap-2 px-2 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
          <span>Sort by:</span>
          <button
            onClick={() => handleSort('code')}
            className={`px-2 py-1 rounded transition ${sort.key === 'code' ? 'bg-cyan-100 text-cyan-700' : ''}`}
          >Code</button>
          <button
            onClick={() => handleSort('validFrom')}
            className={`px-2 py-1 rounded transition ${sort.key === 'validFrom' ? 'bg-cyan-100 text-cyan-700' : ''}`}
          >Date</button>
        </div>
      </div>

      <Table columns={columns} rows={isLoading ? [] : paged} />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

      <Modal
        open={openModal}
        title={editTarget ? 'Edit Voucher' : 'Create New Voucher'}
        onClose={() => setOpenModal(false)}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Voucher Code</label>
              <Input
                placeholder="PROMO2024"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Discount Type</label>
              <Select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as any })}>
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount ($)</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Discount Value</label>
              <Input
                type="number"
                value={form.discountValue}
                onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Usage Limit</label>
              <Input
                type="number"
                value={form.usageLimit}
                onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Min Booking Value ($)</label>
            <Input
              type="number"
              value={form.minBookingValue}
              onChange={e => setForm({ ...form, minBookingValue: Number(e.target.value) })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Valid From</label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={e => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Valid To</label>
              <Input
                type="date"
                value={form.validTo}
                onChange={e => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-50 transition"
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Saving...' : (editTarget ? 'Update Voucher' : 'Create Voucher')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
