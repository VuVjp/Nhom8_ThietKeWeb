import { httpClient } from './httpClient';
import type { AmenityItem } from './amenitiesApi';

export interface RoomTypeItem {
    id: number;
    name: string;
    basePrice: number;
    capacityAdults: number;
    capacityChildren: number;
    description: string;
    amenities: AmenityItem[];
}

export interface RoomTypePayload {
    name: string;
    basePrice: number;
    capacityAdults: number;
    capacityChildren: number;
    description?: string;
}

interface RoomTypeDto {
    id?: number;
    Id?: number;
    name?: string;
    Name?: string;
    basePrice?: number;
    BasePrice?: number;
    capacityAdults?: number;
    CapacityAdults?: number;
    capacityChildren?: number;
    CapacityChildren?: number;
    description?: string;
    Description?: string;
    amenities?: Array<{ id?: number; Id?: number; name?: string; Name?: string; iconUrl?: string; IconUrl?: string }>;
    Amenities?: Array<{ id?: number; Id?: number; name?: string; Name?: string; iconUrl?: string; IconUrl?: string }>;
}

interface RoomTypeAmenityPayload {
    amenityId: number;
}

interface RoomTypeAmenitiesPayload {
    amenityIds: number[];
}

function normalizeAmenity(dto: { id?: number; Id?: number; name?: string; Name?: string; iconUrl?: string; IconUrl?: string }): AmenityItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        iconUrl: String(dto.iconUrl ?? dto.IconUrl ?? ''),
    };
}

function normalizeRoomType(dto: RoomTypeDto): RoomTypeItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        basePrice: Number(dto.basePrice ?? dto.BasePrice ?? 0),
        capacityAdults: Number(dto.capacityAdults ?? dto.CapacityAdults ?? 0),
        capacityChildren: Number(dto.capacityChildren ?? dto.CapacityChildren ?? 0),
        description: String(dto.description ?? dto.Description ?? ''),
        amenities: (dto.amenities ?? dto.Amenities ?? []).map(normalizeAmenity),
    };
}

export const roomTypesApi = {
    async getAll() {
        const { data } = await httpClient.get<RoomTypeDto[]>('roomtypes');
        return data.map(normalizeRoomType);
    },

    async create(payload: RoomTypePayload) {
        await httpClient.post('roomtypes', payload);
    },

    async update(id: number, payload: RoomTypePayload) {
        await httpClient.put(`roomtypes/${id}`, payload);
    },

    async remove(id: number) {
        await httpClient.delete(`roomtypes/${id}`);
    },

    async getAmenities(roomTypeId: number) {
        const { data } = await httpClient.get<Array<{ id?: number; Id?: number; name?: string; Name?: string; iconUrl?: string; IconUrl?: string }>>(`roomtypes/${roomTypeId}/amenities`);
        return data.map(normalizeAmenity);
    },

    async addAmenity(roomTypeId: number, amenityId: number) {
        await httpClient.post(`roomtypes/${roomTypeId}/amenities`, { amenityId } satisfies RoomTypeAmenityPayload);
    },

    async addAmenities(roomTypeId: number, amenityIds: number[]) {
        await httpClient.post(`roomtypes/${roomTypeId}/amenities/bulk`, { amenityIds } satisfies RoomTypeAmenitiesPayload);
    },

    async removeAmenity(roomTypeId: number, amenityId: number) {
        await httpClient.delete(`roomtypes/${roomTypeId}/amenities/${amenityId}`);
    },
};
