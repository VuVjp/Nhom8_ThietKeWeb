import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { UserItem } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { toRoleId, usersApi } from '../../api/usersApi';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { paginate, queryIncludes, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

export function UsersPage() {
  const { ensure } = usePermissionCheck();
  const [rows, setRows] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);
  const [draft, setDraft] = useState<Partial<UserItem>>({ roleName: 'Admin', status: 'Active' });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getAll();
      setRows(data);
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(apiError.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const next = rows.filter((item) => {
      const matchQuery = queryIncludes(item.name, query) || queryIncludes(item.email, query);
      const matchRole = roleFilter === 'all' || item.roleName === roleFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchQuery && matchRole && matchStatus;
    });

    return sortBy(next, (item) => item.name, 'asc');
  }, [rows, query, roleFilter, statusFilter]);

  const pageSize = 8;
  const paged = paginate(filtered, page, pageSize);

  const columns = [
    { key: 'id', label: 'ID', render: (row: UserItem) => row.id },
    { key: 'email', label: 'Email', render: (row: UserItem) => row.email },
    { key: 'role', label: 'Role', render: (row: UserItem) => row.roleName },
    {
      key: 'status',
      label: 'Status',
      render: (row: UserItem) => (
        <button
          style={{ cursor: 'pointer' }}
          type="button"
          onClick={() => {
            if (!ensure('manage_user', 'update user status')) {
              return;
            }
            void (async () => {
              try {
                await usersApi.toggleActive(row.id);
                await loadUsers();
                toast.success(`${row.name} status updated`);
              } catch (error) {
                const apiError = toApiError(error);
                toast.error(apiError.message || 'Failed to update status');
              }
            })();
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
              if (!ensure('manage_user', 'reset user password')) {
                return;
              }
              void (async () => {
                try {
                  const response = await usersApi.resetPassword(row.id);
                  toast.success(response.message ?? response.Message ?? `Password reset sent to ${row.email}`);
                } catch (error) {
                  const apiError = toApiError(error);
                  toast.error(apiError.message || 'Failed to reset password');
                }
              })();
            }}
          >
            <KeyIcon className="h-4 w-4" /> Reset Password
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
            onClick={() => {
              if (!ensure('manage_user', 'change user role')) {
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

  const roles = ['Admin', 'Manager', 'Receptionist', 'Accountant', 'Housekeeping', 'Guest', 'Maintenance', 'Security'] as const;

  const addUser = () => {
    if (!ensure('manage_user', 'add new user')) {
      return;
    }

    if (!draft.name || !draft.email || !draft.roleName) {
      toast.error('Name, email and role are required');
      return;
    }

    const safeEmail = draft.email;
    const safeRole = draft.roleName;

    void (async () => {
      try {
        await usersApi.create({
          email: safeEmail,
          password: '123456',
          roleId: toRoleId(safeRole),
        });
        await loadUsers();
        setOpenAdd(false);
        setDraft({ roleName: 'Staff', status: 'Active' });
        toast.success('User added successfully');
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || 'Failed to add user');
      }
    })();
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
            if (!ensure('manage_user', 'open create user form')) {
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
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="all">All Roles</option>
          {roles.map((role) => (<option key={role}>{role}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Statuses</option><option>Active</option><option>Inactive</option></Select>
      </div>

      <Table columns={columns} rows={isLoading ? [] : paged} />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

      <Modal open={openAdd} title="Add User" onClose={() => setOpenAdd(false)}>
        <div className="space-y-3">
          <Input placeholder="Full name" value={draft.name ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Email" value={draft.email ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} />
          <Select value={draft.roleName} onChange={(e) => setDraft((prev) => ({ ...prev, roleName: e.target.value as UserItem['roleName'] }))}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
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
            value={targetUser?.roleName ?? 'Staff'}
            onChange={(e) => setTargetUser((prev) => (prev ? { ...prev, roleName: e.target.value as UserItem['roleName'] } : prev))}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => {
                if (!targetUser) {
                  return;
                }
                if (!ensure('manage_user', 'change user role')) {
                  return;
                }
                void (async () => {
                  try {
                    await usersApi.changeRole(targetUser.id, {
                      roleId: toRoleId(targetUser.roleName),
                    });
                    await loadUsers();
                    setOpenRole(false);
                    toast.success('Role changed successfully');
                  } catch (error) {
                    const apiError = toApiError(error);
                    toast.error(apiError.message || 'Failed to change role');
                  }
                })();
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
