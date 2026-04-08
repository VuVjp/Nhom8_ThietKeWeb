import { httpClient } from './httpClient';

export interface AttractionItem {
    id: number;
    name: string;
    description: string | null;
    distanceKm: number | null;
    latitude: string;
    longitude: string;
    isActive: boolean;
}

export interface CreateAttractionPayload {
    name: string;
    description?: string;
    distanceKm?: number;
    latitude: string;
    longitude: string;
}

export interface UpdateAttractionPayload extends CreateAttractionPayload {
    isActive?: boolean;
}

interface AttractionDto {
    id?: number;
    Id?: number;
    name?: string;
    Name?: string;
    description?: string;
    Description?: string;
    distanceKm?: number;
    DistanceKm?: number;
    latitude?: string;
    Latitude?: string;
    longitude?: string;
    Longitude?: string;
    isActive?: boolean;
    IsActive?: boolean;
}

function normalizeAttraction(dto: AttractionDto): AttractionItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        description: dto.description ?? dto.Description ?? null,
        distanceKm: dto.distanceKm ?? dto.DistanceKm ?? null,
        latitude: String(dto.latitude ?? dto.Latitude ?? ''),
        longitude: String(dto.longitude ?? dto.Longitude ?? ''),
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? false),
    };
}

export const attractionsApi = {
    async getAll() {
        const { data } = await httpClient.get<AttractionDto[]>('attractions');
        return data.map(normalizeAttraction);
    },

    async getById(id: number) {
        const { data } = await httpClient.get<AttractionDto>(`attractions/${id}`);
        return normalizeAttraction(data);
    },

    async create(payload: CreateAttractionPayload) {
        await httpClient.post('attractions', payload);
    },

    async update(id: number, payload: UpdateAttractionPayload) {
        await httpClient.put(`attractions/${id}`, payload);
    },

    async remove(id: number) {
        await httpClient.delete(`attractions/${id}`);
    },
};
