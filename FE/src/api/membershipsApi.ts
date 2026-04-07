import { httpClient } from './httpClient';

export interface MembershipItem {
    id: number;
    tierName: string;
    minPoints: number | null;
    discountPercent: number | null;
}

export interface UpdateMembershipPayload {
    tierName: string;
    minPoints: number;
    discountPercent: number;
}

interface MembershipDto {
    id?: number;
    Id?: number;
    tierName?: string;
    TierName?: string;
    minPoints?: number;
    MinPoints?: number;
    discountPercent?: number;
    DiscountPercent?: number;
}

function normalizeMembership(dto: MembershipDto): MembershipItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        tierName: String(dto.tierName ?? dto.TierName ?? ''),
        minPoints: dto.minPoints ?? dto.MinPoints ?? null,
        discountPercent: dto.discountPercent ?? dto.DiscountPercent ?? null,
    };
}

export const membershipsApi = {
    async getAll() {
        const { data } = await httpClient.get<MembershipDto[]>('memberships');
        return data.map(normalizeMembership);
    },

    async getById(id: number) {
        const { data } = await httpClient.get<MembershipDto>(`memberships/${id}`);
        return normalizeMembership(data);
    },

    async create(payload: UpdateMembershipPayload) {
        await httpClient.post('memberships', payload);
    },

    async update(id: number, payload: UpdateMembershipPayload) {
        await httpClient.put(`memberships/${id}`, payload);
    },

    async remove(id: number) {
        await httpClient.delete(`memberships/${id}`);
    },
};
