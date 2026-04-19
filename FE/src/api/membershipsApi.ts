import { httpClient } from './httpClient';

export interface Membership {
  id: number;
  tierName: string;
  minPoints?: number;
  discountPercent?: number;
  isActive: boolean;
}

export interface CreateMembershipData {
  tierName: string;
  minPoints?: number;
  discountPercent?: number;
  isActive: boolean;
}

export interface UpdateMembershipData {
  tierName: string;
  minPoints?: number;
  discountPercent?: number;
  isActive: boolean;
}

export const membershipsApi = {
  getAll: () => httpClient.get<Membership[]>('/Memberships').then(res => res.data),
  getById: (id: number) => httpClient.get<Membership>(`/Memberships/${id}`).then(res => res.data),
  create: (data: CreateMembershipData) => httpClient.post<string>('/Memberships', data).then(res => res.data),
  update: (id: number, data: UpdateMembershipData) => httpClient.put<string>(`/Memberships/${id}`, data).then(res => res.data),
  delete: (id: number) => httpClient.delete<string>(`/Memberships/${id}`).then(res => res.data),
};
