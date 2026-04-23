import { httpClient } from './httpClient';

export interface UserProfile {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    roleName: string;
    isActive: boolean;
    avatarUrl?: string;
}

export interface UpdateProfilePayload {
    fullName: string;
    phone: string;
}

export const userProfileApi = {
    getMyProfile: async (): Promise<UserProfile> => {
        const response = await httpClient.get<UserProfile>('/UserProfile/my-profile');
        return response.data;
    },

    updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
        const response = await httpClient.put<UserProfile>('/UserProfile/update-profile', payload);
        return response.data;
    }
};
