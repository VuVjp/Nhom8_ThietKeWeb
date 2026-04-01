import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { usersSeed } from '../mock/data';
import type { UserItem } from '../types/models';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Table } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { paginate, queryIncludes, sortBy } from '../utils/table';
import { usePermissionCheck } from '../hooks/usePermissionCheck';

export function UsersPage() {
  const { ensure } = usePermissionCheck();
  const [rows, setRows] = useState<UserItem[]>(usersSeed);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);
  const [draft, setDraft] = useState<Partial<UserItem>>({ role: 'Staff', status: 'Active' });

  const filtered = useMemo(() => {
    const next = rows.filter((item) => {
      const matchQuery = queryIncludes(item.name, query) || queryIncludes(item.email, query);
      const matchRole = roleFilter === 'all' || item.role === roleFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchQuery && matchRole && matchStatus;
    });

    return sortBy(next, (item) => item.name, 'asc');
  }, [rows, query, roleFilter, statusFilter]);

  const pageSize = 8;
  const paged = paginate(filtered, page, pageSize);

  const columns = [
    { key: 'name', label: 'Name', render: (row: UserItem) => row.name },
    { key: 'email', label: 'Email', render: (row: UserItem) => row.email },
    { key: 'role', label: 'Role', render: (row: UserItem) => row.role },
    {
      key: 'status',
      label: 'Status',
      render: (row: UserItem) => (
        <button
          type="button"
          onClick={() => {
            if (!ensure('manage_users', 'update user status')) {
              return;
            }
            setRows((prev) =>
              prev.map((item) =>
                item.id === row.id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item,
              ),
            );
            toast.success(`${row.name} status updated`);
          }}
        >
          <Badge value={row.status} />
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: UserItem) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
            onClick={() => {
              if (!ensure('manage_users', 'reset user password')) {
                return;
              }
              toast.success(`Password reset sent to ${row.email}`);
            }}
          >
            <KeyIcon className="h-4 w-4" /> Reset Password
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
            onClick={() => {
              if (!ensure('manage_users', 'change user role')) {
                return;
              }
              setTargetUser(row);
              setOpenRole(true);
            }}
          >
            <PencilSquareIcon className="h-4 w-4" /> Change Role
          </button>
        </div>
      ),
    },
  ];

  const addUser = () => {
    if (!ensure('manage_users', 'add new user')) {
      return;
    }

    if (!draft.name || !draft.email || !draft.role) {
      toast.error('Name, email and role are required');
      return;
    }

    const safeName = draft.name;
    const safeEmail = draft.email;
    const safeRole = draft.role;

    setRows((prev) => [
      {
        id: Date.now(),
        name: safeName,
        email: safeEmail,
        role: safeRole,
        status: (draft.status as UserItem['status']) ?? 'Active',
      },
      ...prev,
    ]);
    setOpenAdd(false);
    setDraft({ role: 'Staff', status: 'Active' });
    toast.success('User added successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">Manage identity, roles and account status.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            if (!ensure('manage_users', 'open create user form')) {
              return;
            }
            setOpenAdd(true);
          }}
        >
          <PlusIcon className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <Input placeholder="Search name/email" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="all">All Roles</option><option>Admin</option><option>Manager</option><option>Staff</option></Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Statuses</option><option>Active</option><option>Inactive</option></Select>
      </div>

      <Table columns={columns} rows={paged} />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

      <Modal open={openAdd} title="Add User" onClose={() => setOpenAdd(false)}>
        <div className="space-y-3">
          <Input placeholder="Full name" value={draft.name ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Email" value={draft.email ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} />
          <Select value={draft.role} onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value as UserItem['role'] }))}><option>Admin</option><option>Manager</option><option>Staff</option></Select>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpenAdd(false)}>Cancel</button>
            <button type="button" className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white" onClick={addUser}>Create</button>
          </div>
        </div>
      </Modal>

      <Modal open={openRole} title="Change Role" onClose={() => setOpenRole(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Update role for {targetUser?.name}</p>
          <Select
            value={targetUser?.role ?? 'Staff'}
            onChange={(e) => setTargetUser((prev) => (prev ? { ...prev, role: e.target.value as UserItem['role'] } : prev))}
          >
            <option>Admin</option><option>Manager</option><option>Staff</option>
          </Select>
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => {
                if (!targetUser) {
                  return;
                }
                if (!ensure('manage_users', 'change user role')) {
                  return;
                }
                setRows((prev) => prev.map((item) => (item.id === targetUser.id ? targetUser : item)));
                setOpenRole(false);
                toast.success('Role changed successfully');
              }}
            >
              Save Role
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
