import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { RoleItem } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { rolesApi } from '../../api/rolesApi';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { Input } from '../../components/Input';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

export function RolesPage() {
  const { ensure } = usePermissionCheck();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [draftName, setDraftName] = useState('');

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getAllPermissions(),
      ]);
      setRoles(rolesData);
      if (rolesData.length > 0) {
        setSelectedRoleId((prev) => {
          if (prev && rolesData.some((role) => role.id === prev)) {
            return prev;
          }
          return rolesData[0].id;
        });
      }

      setPermissionOptions(Array.from(new Set(permissionsData)));
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(apiError.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const selectedRole = useMemo(() => roles.find((item) => item.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const columns = [
    { key: 'name', label: 'Role Name', render: (row: RoleItem) => row.name },
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
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${selectedRoleId === row.id ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200'}`}
          onClick={() => {
            setSelectedRoleId(row.id);
          }}
        >
          <PencilSquareIcon className="h-4 w-4" /> {selectedRoleId === row.id ? 'Selected' : 'Edit'}
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
            if (!ensure('MANAGE_ROLES', 'open create role form')) {
              return;
            }
            setOpenAdd(true);
          }}
        >
          <PlusIcon className="h-4 w-4" /> Add Role
        </button>
      </div>

      <Table columns={columns} rows={isLoading ? [] : roles} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Permission Matrix: {selectedRole?.name ?? 'No role selected'}</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {permissionOptions.map((permission) => {
            const checked = selectedRole?.permissions.includes(permission) ?? false;
            return (
              <label key={permission} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (!selectedRole) {
                      return;
                    }
                    if (!ensure('MANAGE_ROLES', 'update role permissions')) {
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
        {permissionOptions.length === 0 ? <p className="mt-3 text-sm text-slate-500">No permissions available.</p> : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              if (!selectedRole) {
                toast.error('Please select a role first');
                return;
              }
              if (!ensure('MANAGE_ROLES', 'save role permissions')) {
                return;
              }
              void (async () => {
                try {
                  await rolesApi.updateRolePermissions(selectedRole.id, {
                    permissionNames: selectedRole.permissions,
                  });
                  toast.success('Role permissions saved');
                  await loadRoles();
                } catch (error) {
                  const apiError = toApiError(error);
                  toast.error(apiError.message || 'Failed to save role permissions');
                }
              })();
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
                if (!ensure('MANAGE_ROLES', 'create role')) {
                  return;
                }
                if (!draftName.trim()) {
                  toast.error('Role name is required');
                  return;
                }
                toast.error('Create role API is not available in backend yet');
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
