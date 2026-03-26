import { useMemo, useState, type ChangeEvent } from 'react';
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { rolesService } from '../api/roles.service';
import { usersService } from '../api/users.service';
import { PageHeader } from '../components/PageHeader';
import { PermissionGuard } from '../auth/PermissionGuard';
import { useDebounce } from '../hooks/useDebounce';
import type { User } from '../types/user';

const DEFAULT_PAGE_SIZE = 10;

export const UsersPage = () => {
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [createForm] = Form.useForm<{ email: string; password: string; roleId: number }>();
    const [roleForm] = Form.useForm<{ roleId: string }>();

    const debouncedSearch = useDebounce(search, 350);

    const usersQuery = useQuery({
        queryKey: ['users', currentPage, pageSize, debouncedSearch, roleFilter, activeFilter],
        queryFn: () =>
            usersService.list({
                page: currentPage,
                pageSize,
                search: debouncedSearch || undefined,
                role: roleFilter,
                isActive: activeFilter,
            }),
    });

    const rolesQuery = useQuery({
        queryKey: ['roles-for-user-assign'],
        queryFn: async () => {
            const response = await rolesService.list(1, 200);
            return response.items;
        },
    });

    const createUserMutation = useMutation({
        mutationFn: (payload: { email: string; password: string; roleId: number }) => usersService.create(payload),
        onSuccess: () => {
            messageApi.success('User created successfully.');
            setIsCreateModalOpen(false);
            createForm.resetFields();
        },
        onError: () => {
            messageApi.error('Failed to create user.');
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: (userId: string) => usersService.toggleActive(userId),
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    const handleToggleActive = async (record: User) => {
        const previousStatus = record.isActive;

        try {
            await toggleActiveMutation.mutateAsync(record.id);
        } catch {
            // Continue to refetch and verify actual state before showing message.
        }

        const refreshed = await usersQuery.refetch();
        const updated = refreshed.data?.items.find((item) => item.id === record.id);

        if (updated) {
            if (updated.isActive !== previousStatus) {
                messageApi.success('User status updated successfully.');
                return;
            }

            messageApi.error('User status was not changed. Please try again.');
            return;
        }

        if (activeFilter !== undefined && activeFilter === previousStatus) {
            messageApi.success('User status updated successfully.');
            return;
        }

        messageApi.warning('Could not verify user status response. Please check again.');
    };

    const resetPasswordMutation = useMutation({
        mutationFn: (userId: string) => usersService.resetPassword(userId),
        onError: () => {
            messageApi.error('Failed to reset password.');
        },
        onSuccess: () => {
            messageApi.success('New password has been sent to user email.');
        },
    });

    const changeRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) =>
            usersService.assignRole(userId, roleId),
        onError: () => {
            messageApi.error('Failed to change user role.');
        },
        onSuccess: () => {
            messageApi.success('User role updated successfully.');
            setIsRoleModalOpen(false);
            setSelectedUserId(null);
            roleForm.resetFields();
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    const columns = useMemo<ColumnsType<User>>(
        () => [
            {
                title: 'Name',
                dataIndex: 'fullName',
                key: 'fullName',
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
            },
            {
                title: 'Role',
                dataIndex: 'role',
                key: 'role',
                render: (value: User['role']) => <Tag color="geekblue">{value}</Tag>,
            },
            {
                title: 'Status',
                dataIndex: 'isActive',
                key: 'isActive',
                render: (value: boolean) => <Tag color={value ? 'green' : 'red'}>{value ? 'Active' : 'Inactive'}</Tag>,
            },
            {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                    <Space>
                        <PermissionGuard permissions={['edit_user']} fallback={<Button disabled>Toggle Active</Button>}>
                            <Button
                                onClick={() => {
                                    void handleToggleActive(record);
                                }}
                                loading={toggleActiveMutation.isPending}
                            >
                                {record.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard permissions={['edit_user']} fallback={<Button disabled>Reset Password</Button>}>
                            <Button
                                onClick={() => {
                                    resetPasswordMutation.mutate(record.id);
                                }}
                                loading={resetPasswordMutation.isPending}
                            >
                                Reset Password
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard permissions={['edit_user']} fallback={<Button disabled>Change Role</Button>}>
                            <Button
                                onClick={() => {
                                    setSelectedUserId(record.id);
                                    const matchedRole = rolesQuery.data?.find((role) => role.name === record.role);
                                    roleForm.setFieldValue('roleId', matchedRole?.id ?? undefined);
                                    setIsRoleModalOpen(true);
                                }}
                            >
                                Change Role
                            </Button>
                        </PermissionGuard>
                    </Space>
                ),
            },
        ],
        [resetPasswordMutation, roleForm, rolesQuery.data, toggleActiveMutation],
    );

    return (
        <>
            {contextHolder}
            <PageHeader
                title="User Management"
                description="Manage users, roles, and lifecycle actions."
                extra={
                    <PermissionGuard permissions={['create_user']} fallback={<Button disabled>Add User</Button>}>
                        <Button
                            type="primary"
                            onClick={() => {
                                setIsCreateModalOpen(true);
                            }}
                        >
                            Add User
                        </Button>
                    </PermissionGuard>
                }
            />

            <Space wrap style={{ marginBottom: 16 }}>
                <Input.Search
                    allowClear
                    placeholder="Search by name or email"
                    style={{ width: 360 }}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setCurrentPage(1);
                        setSearch(event.target.value);
                    }}
                />

                <Select
                    allowClear
                    style={{ width: 180 }}
                    placeholder="Filter by role"
                    value={roleFilter}
                    onChange={(value) => {
                        setCurrentPage(1);
                        setRoleFilter(value);
                    }}
                    options={(rolesQuery.data ?? []).map((role) => ({
                        label: role.name,
                        value: role.name,
                    }))}
                />

                <Select
                    allowClear
                    style={{ width: 180 }}
                    placeholder="Filter by status"
                    value={activeFilter}
                    onChange={(value) => {
                        setCurrentPage(1);
                        setActiveFilter(value);
                    }}
                    options={[
                        { label: 'Active', value: true },
                        { label: 'Inactive', value: false },
                    ]}
                />
            </Space>

            <Table<User>
                rowKey="id"
                loading={usersQuery.isLoading}
                columns={columns}
                dataSource={usersQuery.data?.items ?? []}
                pagination={{
                    current: currentPage,
                    pageSize,
                    total: usersQuery.data?.total ?? 0,
                    showSizeChanger: true,
                    onChange: (page: number, nextPageSize: number) => {
                        setCurrentPage(page);
                        setPageSize(nextPageSize);
                    },
                }}
            />

            <Modal
                title="Add User"
                open={isCreateModalOpen}
                onCancel={() => {
                    setIsCreateModalOpen(false);
                    createForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form<{ email: string; password: string; roleId: number }>
                    form={createForm}
                    layout="vertical"
                    onFinish={(values) => {
                        createUserMutation.mutate(values);
                    }}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter password' },
                            { min: 8, message: 'Password must be at least 8 characters' },
                        ]}
                    >
                        <Input.Password placeholder="Enter password" />
                    </Form.Item>

                    <Form.Item label="Role" name="roleId" rules={[{ required: true, message: 'Please select a role' }]}>
                        <Select
                            loading={rolesQuery.isLoading}
                            options={(rolesQuery.data ?? []).map((role) => ({
                                label: role.name,
                                value: Number(role.id),
                            }))}
                            placeholder="Select role"
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={createUserMutation.isPending}>
                        Create User
                    </Button>
                </Form>
            </Modal>

            <Modal
                title="Change User Role"
                open={isRoleModalOpen}
                onCancel={() => {
                    setIsRoleModalOpen(false);
                    setSelectedUserId(null);
                    roleForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form<{ roleId: string }>
                    form={roleForm}
                    layout="vertical"
                    onFinish={(values) => {
                        if (!selectedUserId) {
                            return;
                        }

                        changeRoleMutation.mutate({
                            userId: selectedUserId,
                            roleId: Number(values.roleId),
                        });
                    }}
                >
                    <Form.Item label="Role" name="roleId" rules={[{ required: true, message: 'Please select a role' }]}>
                        <Select
                            loading={rolesQuery.isLoading}
                            options={(rolesQuery.data ?? []).map((role) => ({
                                label: role.name,
                                value: role.id,
                            }))}
                            placeholder="Select role"
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={changeRoleMutation.isPending}>
                        Save
                    </Button>
                </Form>
            </Modal>
        </>
    );
};
