import { httpClient } from './httpClient';

export interface AmenityItem {
    id: number;
    name: string;
    iconUrl?: string;
}

interface AmenityDto {
    id?: number;
    Id?: number;
    name?: string;
    Name?: string;
    iconUrl?: string;
    IconUrl?: string;
}

function normalizeAmenity(dto: AmenityDto): AmenityItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        iconUrl: String(dto.iconUrl ?? dto.IconUrl ?? ''),
    };
}

export const amenitiesApi = {
    async getAll() {
        const { data } = await httpClient.get<AmenityDto[]>('amenities');
        return data.map(normalizeAmenity);
    },
};
