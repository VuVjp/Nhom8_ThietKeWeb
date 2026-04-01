import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { allPermissions, rolesSeed } from '../mock/data';
import type { RoleItem } from '../types/models';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import { Input } from '../components/Input';
import { usePermissionCheck } from '../hooks/usePermissionCheck';

export function RolesPage() {
  const { ensure } = usePermissionCheck();
  const [roles, setRoles] = useState<RoleItem[]>(rolesSeed);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(rolesSeed[0].id);
  const [openAdd, setOpenAdd] = useState(false);
  const [draftName, setDraftName] = useState('');

  const selectedRole = useMemo(() => roles.find((item) => item.id === selectedRoleId) ?? roles[0], [roles, selectedRoleId]);

  const columns = [
    { key: 'name', label: 'Role Name', render: (row: RoleItem) => row.roleName },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (row: RoleItem) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions.map((permission) => (
            <span key={permission} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{permission}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: RoleItem) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
          onClick={() => {
            if (!ensure('manage_roles', 'edit role')) {
              return;
            }
            setSelectedRoleId(row.id);
          }}
        >
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Roles</h2>
          <p className="text-sm text-slate-500">Permission matrix for each role profile.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            if (!ensure('manage_roles', 'open create role form')) {
              return;
            }
            setOpenAdd(true);
          }}
        >
          <PlusIcon className="h-4 w-4" /> Add Role
        </button>
      </div>

      <Table columns={columns} rows={roles} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Permission Matrix: {selectedRole?.roleName}</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allPermissions.map((permission) => {
            const checked = selectedRole.permissions.includes(permission);
            return (
              <label key={permission} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (!ensure('manage_roles', 'update role permissions')) {
                      return;
                    }
                    const next = event.target.checked
                      ? [...selectedRole.permissions, permission]
                      : selectedRole.permissions.filter((item) => item !== permission);

                    setRoles((prev) => prev.map((role) => (role.id === selectedRole.id ? { ...role, permissions: next } : role)));
                  }}
                />
                {permission}
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              if (!ensure('manage_roles', 'save role permissions')) {
                return;
              }
              toast.success('Role permissions saved');
            }}
          >
            Save Changes
          </button>
        </div>
      </div>

      <Modal open={openAdd} title="Add Role" onClose={() => setOpenAdd(false)}>
        <div className="space-y-3">
          <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Role name" />
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpenAdd(false)}>Cancel</button>
            <button
              type="button"
              className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => {
                if (!ensure('manage_roles', 'create role')) {
                  return;
                }
                if (!draftName.trim()) {
                  toast.error('Role name is required');
                  return;
                }
                setRoles((prev) => [...prev, { id: Date.now(), roleName: draftName.trim(), permissions: ['view_rooms'] }]);
                setDraftName('');
                setOpenAdd(false);
                toast.success('Role created');
              }}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
