import { httpClient } from './httpClient';
import type { AmenityItem } from './amenitiesApi';
import type { EquipmentItem } from './equipmentsApi';

export interface RoomTypeImage {
    id: number;
    url: string;
    isPrimary: boolean;
}

export interface RoomTypeItem {
    id: number;
    name: string;
    basePrice: number;
    capacityAdults: number;
    capacityChildren: number;
    description: string;
    view: string;
    bedType: string;
    sizeM2: number | null;
    amenities: AmenityItem[];
    images: RoomTypeImage[];
    equipments: EquipmentItem[];
    isActive: boolean;
}

export interface RoomTypePayload {
    Name: string;
    BasePrice: number;
    CapacityAdults: number;
    CapacityChildren: number;
    Description?: string;
    View?: string;
    BedType?: string;
    SizeM2?: number | null;
    Files?: File[];
    PrimaryImageIndex?: number;
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
    view?: string;
    View?: string;
    bedType?: string;
    BedType?: string;
    sizeM2?: number | null;
    SizeM2?: number | null;
    isActive?: boolean;
    IsActive?: boolean;
    amenities?: Array<{ id?: number; Id?: number; name?: string; Name?: string; iconUrl?: string; IconUrl?: string }>;
    Amenities?: Array<{ id?: number; Id?: number; name?: string; Name?: string; iconUrl?: string; IconUrl?: string }>;
    images?: Array<{ id?: number; Id?: number; url?: string; Url?: string; isPrimary?: boolean; IsPrimary?: boolean }>;
    Images?: Array<{ id?: number; Id?: number; url?: string; Url?: string; isPrimary?: boolean; IsPrimary?: boolean }>;
    roomImages?: Array<{ id?: number; Id?: number; url?: string; Url?: string; imageUrl?: string; ImageUrl?: string; isPrimary?: boolean; IsPrimary?: boolean }>;
    RoomImages?: Array<{ id?: number; Id?: number; url?: string; Url?: string; imageUrl?: string; ImageUrl?: string; isPrimary?: boolean; IsPrimary?: boolean }>;
    equipments?: Array<{ id?: number; Id?: number; name?: string; Name?: string; imageUrl?: string; ImageUrl?: string; category?: string; Category?: string }>;
    Equipments?: Array<{ id?: number; Id?: number; name?: string; Name?: string; imageUrl?: string; ImageUrl?: string; category?: string; Category?: string }>;
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
        isActive: true,
    };
}

function normalizeImage(dto: { id?: number; Id?: number; url?: string; Url?: string; imageUrl?: string; ImageUrl?: string; isPrimary?: boolean; IsPrimary?: boolean }): RoomTypeImage {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        url: String(dto.url ?? dto.Url ?? dto.imageUrl ?? dto.ImageUrl ?? ''),
        isPrimary: Boolean(dto.isPrimary ?? dto.IsPrimary ?? false),
    };
}

function normalizeEquipment(dto: { id?: number; Id?: number; name?: string; Name?: string; imageUrl?: string; ImageUrl?: string; category?: string; Category?: string }): EquipmentItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        imageUrl: String(dto.imageUrl ?? dto.ImageUrl ?? ''),
        category: String(dto.category ?? dto.Category ?? ''),
        // Adding defaults for other fields if they are missing in the simple Dto
        itemCode: '',
        unit: '',
        totalQuantity: 0,
        inUseQuantity: 0,
        damagedQuantity: 0,
        liquidatedQuantity: 0,
        basePrice: 0,
        defaultPriceIfLost: 0,
        supplier: '',
        isActive: true
    };
}

function normalizeRoomType(dto: RoomTypeDto): RoomTypeItem {
    const rawImages = dto.images ?? dto.Images ?? dto.roomImages ?? dto.RoomImages ?? [];

    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        basePrice: Number(dto.basePrice ?? dto.BasePrice ?? 0),
        capacityAdults: Number(dto.capacityAdults ?? dto.CapacityAdults ?? 0),
        capacityChildren: Number(dto.capacityChildren ?? dto.CapacityChildren ?? 0),
        description: String(dto.description ?? dto.Description ?? ''),
        view: String(dto.view ?? dto.View ?? ''),
        bedType: String(dto.bedType ?? dto.BedType ?? ''),
        sizeM2: dto.sizeM2 ?? dto.SizeM2 ?? null,
        amenities: (dto.amenities ?? dto.Amenities ?? []).map(normalizeAmenity),
        images: rawImages.map(normalizeImage),
        equipments: (dto.equipments ?? dto.Equipments ?? []).map(normalizeEquipment),
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? false),
    };
}

function toRoomTypeFormData(payload: RoomTypePayload): FormData {
    const formData = new FormData();
    formData.append('Name', payload.Name);
    formData.append('BasePrice', String(payload.BasePrice));
    formData.append('CapacityAdults', String(payload.CapacityAdults));
    formData.append('CapacityChildren', String(payload.CapacityChildren));
    if (payload.Description) {
        formData.append('Description', payload.Description);
    }
    if (payload.View) {
        formData.append('View', payload.View);
    }
    if (payload.BedType) {
        formData.append('BedType', payload.BedType);
    }
    if (payload.SizeM2 != null) {
        formData.append('SizeM2', String(payload.SizeM2));
    }
    if (payload.Files) {
        payload.Files.forEach((file) => {
            formData.append('Files', file);
        });
    }
    if (typeof payload.PrimaryImageIndex === 'number') {
        formData.append('PrimaryImageIndex', String(payload.PrimaryImageIndex));
    }
    return formData;
}

export const roomTypesApi = {
    async getAll() {
        const { data } = await httpClient.get<RoomTypeDto[]>('roomtypes');
        return data.map(normalizeRoomType);
    },

    async getById(id: number) {
        const { data } = await httpClient.get<RoomTypeDto>(`roomtypes/${id}`);
        return normalizeRoomType(data);
    },

    async create(payload: RoomTypePayload) {
        const { data } = await httpClient.post<RoomTypeDto>('roomtypes', toRoomTypeFormData(payload), {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return normalizeRoomType(data);
    },

    async update(id: number, payload: RoomTypePayload) {
        const { data } = await httpClient.put<RoomTypeDto>(`roomtypes/${id}`, toRoomTypeFormData(payload), {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return normalizeRoomType(data);
    },

    async toggleActive(id: number) {
        await httpClient.patch(`roomtypes/${id}/toggle-active`);
    },

    async remove(id: number) {
        await this.toggleActive(id);
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

    async uploadImages(roomTypeId: number, files: File[]) {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('Files', file);
        });

        const { data } = await httpClient.post<Array<{ id?: number; Id?: number; url?: string; Url?: string; isPrimary?: boolean; IsPrimary?: boolean }>>(
            `roomtypes/${roomTypeId}/images`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            },
        );
        return data.map(normalizeImage);
    },

    async setPrimaryImage(roomTypeId: number, imageId: number) {
        await httpClient.patch(`roomtypes/${roomTypeId}/set-primary-image?imageId=${imageId}`);
    },

    async deleteImage(_roomTypeId: number, imageId: number) {
        await httpClient.delete(`roomtypes/images/${imageId}`);
    },
};
