import { apiClient } from './axiosClient';

export interface DashboardOverview {
    totalUsers: number;
    totalRoles: number;
    activeSessions: number;
}

export const dashboardService = {
    getOverview: async () => {
        const { data } = await apiClient.get<DashboardOverview>('/UserManagement/dashboard-overview');
        return data;
    },
};
