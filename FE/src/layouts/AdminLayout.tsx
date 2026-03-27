import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Layout, List, Menu, Popover, Space, Switch, theme, Typography, message } from 'antd';
import {
    DashboardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    BellOutlined,
} from '@ant-design/icons';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { notificationService } from '../api/notification.service';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import { PermissionGuard } from '../auth/PermissionGuard';
import { env } from '../utils/env';

const { Header, Sider, Content } = Layout;

export const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const accessToken = useAuthStore((state) => state.accessToken);
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const { isDarkMode, toggleDarkMode } = useUiStore();
    const [collapsed, setCollapsed] = useState(false);
    const [isHubConnected, setIsHubConnected] = useState(false);
    const [notificationPage, setNotificationPage] = useState(1);
    const [notificationItems, setNotificationItems] = useState<
        Array<{
            id: number;
            title: string;
            content: string;
            type?: string | null;
            referenceLink?: string | null;
            isRead: boolean;
            createdAt?: string | null;
        }>
    >([]);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const menuItems = useMemo(
        () => [
            {
                key: '/admin/dashboard',
                icon: <DashboardOutlined />,
                label: <Link to="/admin/dashboard">Dashboard</Link>,
            },
            {
                key: '/admin/users',
                icon: <TeamOutlined />,
                label: (
                    <PermissionGuard permissions="view_user" fallback={<span className="disabled-link">Users</span>}>
                        <Link to="admin/users">Users</Link>
                    </PermissionGuard>
                ),
            },
            {
                key: '/admin/roles',
                icon: <SafetyCertificateOutlined />,
                label: (
                    <PermissionGuard permissions="view_role" fallback={<span className="disabled-link">Roles</span>}>
                        <Link to="/admin/roles">Roles</Link>
                    </PermissionGuard>
                ),
            },
        ],
        [],
    );

    const selectedKey = menuItems.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key ?? '/';

    const notificationsQuery = useQuery({
        queryKey: ['notifications', notificationPage],
        queryFn: () => notificationService.listMine(notificationPage, 20),
        enabled: Boolean(accessToken),
        refetchInterval: accessToken && !isHubConnected ? 15000 : false,
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        if (!notificationsQuery.data) {
            return;
        }

        const items = notificationsQuery.data.items;
        setNotificationItems((prev) => {
            if (notificationPage === 1) {
                return items;
            }

            const existingIds = new Set(prev.map((item) => item.id));
            const next = items.filter((item) => !existingIds.has(item.id));
            return [...prev, ...next];
        });
    }, [notificationPage, notificationsQuery.data]);

    const unreadCountQuery = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: notificationService.countUnread,
        enabled: Boolean(accessToken),
        refetchInterval: accessToken && !isHubConnected ? 10000 : false,
        refetchIntervalInBackground: true,
    });

    const markReadMutation = useMutation({
        mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
        onSuccess: () => {
            setNotificationPage(1);
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    useEffect(() => {
        if (!accessToken) {
            setIsHubConnected(false);
            return;
        }

        const connection = new HubConnectionBuilder()
            .withUrl(`${env.apiRootUrl}/hubs/notification`, {
                accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        connection.on('ReceiveNotification', () => {
            setNotificationPage(1);
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            messageApi.info('You have a new notification.');
        });

        connection.onreconnecting(() => {
            setIsHubConnected(false);
        });

        connection.onreconnected(() => {
            setIsHubConnected(true);
            setNotificationPage(1);
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        });

        connection.onclose(() => {
            setIsHubConnected(false);
        });

        void connection
            .start()
            .then(() => {
                setIsHubConnected(true);
            })
            .catch(() => {
                setIsHubConnected(false);
            });

        return () => {
            setIsHubConnected(false);
            connection.off('ReceiveNotification');
            void connection.stop();
        };
    }, [accessToken, messageApi, queryClient]);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login', { replace: true });
    };

    return (<>
        <title>Nhom8 - Admin Dashboard</title>
        <Layout className="app-shell">
            {contextHolder}
            <Sider trigger={null} collapsible collapsed={collapsed} className="app-sider">
                <div className="brand">Nhom8 Admin</div>
                <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
            </Sider>
            <Layout>
                <Header className="app-header" style={{ background: colorBgContainer }}>
                    <div className="header-left">
                        {collapsed ? (
                            <MenuUnfoldOutlined onClick={() => setCollapsed(false)} />
                        ) : (
                            <MenuFoldOutlined onClick={() => setCollapsed(true)} />
                        )}
                        <Typography.Text strong>{user?.fullName}</Typography.Text>
                    </div>

                    <div className="header-actions">
                        <Popover
                            trigger="click"
                            placement="bottomRight"
                            title="Notifications"
                            content={
                                <div style={{ width: 360, maxHeight: 360, overflow: 'auto' }}>
                                    <List
                                        loading={notificationsQuery.isLoading}
                                        dataSource={notificationItems}
                                        locale={{ emptyText: 'No notifications yet.' }}
                                        renderItem={(item) => (
                                            <List.Item
                                                actions={[
                                                    !item.isRead ? (
                                                        <Button
                                                            key={item.id}
                                                            size="small"
                                                            type="link"
                                                            onClick={() => {
                                                                markReadMutation.mutate(item.id);
                                                            }}
                                                        >
                                                            Mark as read
                                                        </Button>
                                                    ) : null,
                                                ].filter(Boolean)}
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <Space>
                                                            <span>{item.title}</span>
                                                            {!item.isRead ? <Badge status="processing" /> : null}
                                                        </Space>
                                                    }
                                                    description={
                                                        <div>
                                                            <div>{item.content}</div>
                                                            {item.createdAt ? (
                                                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                                    {new Date(item.createdAt).toLocaleString()}
                                                                </Typography.Text>
                                                            ) : null}
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                    {(notificationsQuery.data?.total ?? 0) > notificationItems.length ? (
                                        <Button
                                            type="link"
                                            block
                                            onClick={() => {
                                                setNotificationPage((prev) => prev + 1);
                                            }}
                                            loading={notificationsQuery.isFetching}
                                        >
                                            Load more
                                        </Button>
                                    ) : null}
                                </div>
                            }
                        >
                            <Badge count={unreadCountQuery.data ?? 0} size="small" overflowCount={99}>
                                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                            </Badge>
                        </Popover>
                        <span>Dark mode</span>
                        <Switch checked={isDarkMode} onChange={toggleDarkMode} />
                        <LogoutOutlined className="logout-icon" onClick={() => void handleLogout()} />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', minHeight: 280 }}>
                    <div style={{ padding: 20, minHeight: 'calc(100vh - 150px)', background: colorBgContainer, borderRadius: borderRadiusLG }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    </>
    );
};
