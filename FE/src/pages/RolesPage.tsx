import { useMemo, useState } from 'react';
import { Button, Checkbox, Form, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { rolesService } from '../api/roles.service';
import { PageHeader } from '../components/PageHeader';
import { PERMISSIONS, ROLES } from '../types/rbac';
import type { RoleModel, UpsertRolePayload } from '../types/role';
import { PermissionGuard } from '../auth/PermissionGuard';

export const RolesPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleModel | null>(null);
    const [editForm] = Form.useForm<{ permissions: string[] }>();

    const rolesQuery = useQuery({
        queryKey: ['roles', currentPage, pageSize],
        queryFn: () => rolesService.list(currentPage, pageSize),
    });

    const permissionsQuery = useQuery({
        queryKey: ['all-permissions'],
        queryFn: rolesService.getAllPermissions,
    });

    const createRoleMutation = useMutation({
        mutationFn: (payload: UpsertRolePayload) => rolesService.create(payload),
        onSuccess: () => {
            messageApi.success('Role created successfully.');
            setIsModalOpen(false);
        },
        onError: () => {
            messageApi.error('Unable to create role.');
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['roles'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    const updateRolePermissionsMutation = useMutation({
        mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
            rolesService.updatePermissions(roleId, permissions),
        onSuccess: () => {
            messageApi.success('Role permissions updated successfully.');
            setSelectedRole(null);
            editForm.resetFields();
        },
        onError: () => {
            messageApi.error('Unable to update role permissions.');
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['roles'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    const columns = useMemo<ColumnsType<RoleModel>>(
        () => [
            {
                title: 'Role',
                dataIndex: 'name',
                key: 'name',
                render: (name: string) => <Tag color="blue">{name}</Tag>,
            },
            {
                title: 'Permissions',
                dataIndex: 'permissions',
                key: 'permissions',
                render: (permissions: RoleModel['permissions']) => (
                    <Space size={[4, 8]} wrap>
                        {permissions.map((permission) => (
                            <Tag key={permission}>{permission}</Tag>
                        ))}
                    </Space>
                ),
            },
            {
                title: 'Actions',
                key: 'actions',
                render: (_, role) => (
                    <PermissionGuard permissions={['assign_permissions']} fallback={<Button disabled>Edit Permissions</Button>}>
                        <Button
                            onClick={() => {
                                setSelectedRole(role);
                                editForm.setFieldsValue({ permissions: role.permissions });
                            }}
                        >
                            Edit Permissions
                        </Button>
                    </PermissionGuard>
                ),
            },
        ],
        [editForm],
    );

    return (
        <>
            {contextHolder}
            <PageHeader
                title="Role & Permission Management"
                description="Create roles and map permissions precisely for RBAC."
                extra={
                    <PermissionGuard permissions={['create_role']} fallback={<Button disabled>Add Role</Button>}>
                        <Button type="primary" onClick={() => setIsModalOpen(true)}>
                            Add Role
                        </Button>
                    </PermissionGuard>
                }
            />

            <Table<RoleModel>
                rowKey="id"
                columns={columns}
                loading={rolesQuery.isLoading}
                dataSource={rolesQuery.data?.items ?? []}
                pagination={{
                    current: currentPage,
                    pageSize,
                    total: rolesQuery.data?.total ?? 0,
                    showSizeChanger: true,
                    onChange: (page, nextPageSize) => {
                        setCurrentPage(page);
                        setPageSize(nextPageSize);
                    },
                }}
            />

            <Modal
                title={selectedRole ? `Edit Permissions - ${selectedRole.name}` : 'Edit Permissions'}
                open={Boolean(selectedRole)}
                onCancel={() => {
                    setSelectedRole(null);
                    editForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form<{ permissions: string[] }>
                    form={editForm}
                    layout="vertical"
                    onFinish={(values) => {
                        if (!selectedRole) {
                            return;
                        }

                        updateRolePermissionsMutation.mutate({
                            roleId: selectedRole.id,
                            permissions: values.permissions,
                        });
                    }}
                >
                    <Form.Item label="Permissions" name="permissions" rules={[{ required: true }]}>
                        <Checkbox.Group
                            options={(permissionsQuery.data ?? PERMISSIONS).map((permission) => ({
                                label: permission,
                                value: permission,
                            }))}
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={updateRolePermissionsMutation.isPending}>
                        Save Changes
                    </Button>
                </Form>
            </Modal>

            <Modal title="Create Role" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnHidden>
                <Form<UpsertRolePayload>
                    layout="vertical"
                    initialValues={{ name: ROLES[1], permissions: ['view_dashboard'] }}
                    onFinish={(values: UpsertRolePayload) => {
                        createRoleMutation.mutate(values);
                    }}
                >
                    <Form.Item label="Role Name" name="name" rules={[{ required: true }]}>
                        <Select options={ROLES.map((role) => ({ label: role, value: role }))} />
                    </Form.Item>

                    <Form.Item label="Permissions" name="permissions" rules={[{ required: true }]}>
                        <Checkbox.Group options={PERMISSIONS.map((permission) => ({ label: permission, value: permission }))} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={createRoleMutation.isPending}>
                        Create
                    </Button>
                </Form>
            </Modal>
        </>
    );
};
