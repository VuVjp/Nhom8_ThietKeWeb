import { httpClient } from './httpClient';

export interface AmenityItem {
    id: number;
    name: string;
    iconUrl?: string;
    isActive: boolean;
}

export interface CreateAmenityPayload {
    name: string;
    file?: File | null;
}

export interface UpdateAmenityPayload {
    name: string;
    iconUrl?: string;
    file?: File | null;
}

interface AmenityDto {
    id?: number;
    Id?: number;
    name?: string;
    Name?: string;
    iconUrl?: string;
    IconUrl?: string;
    isActive?: boolean;
    IsActive?: boolean;
}

function normalizeAmenity(dto: AmenityDto): AmenityItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        iconUrl: String(dto.iconUrl ?? dto.IconUrl ?? ''),
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? false),
    };
}

function toAmenityFormData(payload: CreateAmenityPayload | UpdateAmenityPayload): FormData {
    const form = new FormData();
    form.append('Name', payload.name);

    if ('iconUrl' in payload && payload.iconUrl) {
        form.append('IconUrl', payload.iconUrl);
    }

    if (payload.file) {
        form.append('File', payload.file);
    }

    return form;
}

export const amenitiesApi = {
    async getAll() {
        const { data } = await httpClient.get<AmenityDto[]>('amenities');
        return data.map(normalizeAmenity);
    },

    async create(payload: CreateAmenityPayload) {
        await httpClient.post('amenities', toAmenityFormData(payload), {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async update(id: number, payload: UpdateAmenityPayload) {
        await httpClient.put(`amenities/${id}`, toAmenityFormData(payload), {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async toggleActive(id: number) {
        await httpClient.patch(`amenities/${id}/toggle-active`);
    },

    async remove(id: number) {
        await this.toggleActive(id);
    },
};
