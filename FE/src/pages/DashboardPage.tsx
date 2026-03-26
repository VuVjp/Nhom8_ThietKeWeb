import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic } from 'antd';
import { dashboardService } from '../api/dashboard.service';
import { PageHeader } from '../components/PageHeader';
import { StatusView } from '../components/StatusView';

export const DashboardPage = () => {
    const overviewQuery = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: dashboardService.getOverview,
    });

    if (overviewQuery.isLoading) {
        return <StatusView isLoading />;
    }

    if (overviewQuery.isError) {
        return <StatusView errorMessage="Failed to load dashboard data." />;
    }

    const data = overviewQuery.data;

    return (
        <>
            <PageHeader
                title="Dashboard Overview"
                description="Track users, roles, and active sessions in real-time."
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Total Users" value={data?.totalUsers ?? 0} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Total Roles" value={data?.totalRoles ?? 0} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Active Sessions" value={data?.activeSessions ?? 0} />
                    </Card>
                </Col>
            </Row>
        </>
    );
};
