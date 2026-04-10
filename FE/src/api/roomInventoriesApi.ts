import type { InventoryItem } from '../types/models';
import { httpClient } from './httpClient';

interface RoomInventoryDto {
    id?: number;
    Id?: number;
    roomId?: number;
    RoomId?: number;
    equipmentId?: number;
    EquipmentId?: number;
    amenityId?: number;
    AmenityId?: number;
    itemName?: string;
    ItemName?: string;
    quantity?: number;
    Quantity?: number;
    priceIfLost?: number;
    PriceIfLost?: number;
    isActive?: boolean;
    IsActive?: boolean;
}

export interface CreateRoomInventoryPayload {
    roomId: number;
    equipmentId?: number;
    amenityId?: number;
    itemName: string;
    quantity: number;
    priceIfLost: number;
}

export interface UpdateRoomInventoryPayload {
    roomId?: number;
    equipmentId?: number;
    amenityId?: number;
    itemName?: string;
    quantity?: number;
    priceIfLost?: number;
}

function mapRoomInventoryToItem(dto: RoomInventoryDto): InventoryItem {
    const id = Number(dto.id ?? dto.Id ?? 0);
    const equipmentId = Number(dto.equipmentId ?? dto.EquipmentId ?? 0) || undefined;
    const amenityId = Number(dto.amenityId ?? dto.AmenityId ?? 0) || undefined;
    const roomId = Number(dto.roomId ?? dto.RoomId ?? 0) || undefined;
    const name = String(dto.itemName ?? dto.ItemName ?? `Item ${id}`);
    const quantity = Number(dto.quantity ?? dto.Quantity ?? 0);
    const compensationPrice = Number(dto.priceIfLost ?? dto.PriceIfLost ?? 0);

    return {
        id,
        roomId,
        equipmentId,
        amenityId,
        code: `#${String(id).padStart(3, '0')}`,
        name,
        category: amenityId ? 'Amenity' : 'Equipment',
        unit: 'pcs',
        price: compensationPrice,
        stock: quantity,
        quantity,
        compensationPrice,
        notes: 'From room inventory',
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? false),
    };
}

export const roomInventoriesApi = {
    async getAll() {
        const { data } = await httpClient.get<RoomInventoryDto[]>('roominventories');
        return data.map(mapRoomInventoryToItem);
    },

    async getByRoom(roomId: number) {
        const { data } = await httpClient.get<RoomInventoryDto[]>(`roominventories/room/${roomId}`);
        return data.map(mapRoomInventoryToItem);
    },

    async getById(id: number) {
        const { data } = await httpClient.get<RoomInventoryDto>(`roominventories/${id}`);
        return mapRoomInventoryToItem(data);
    },

    async create(payload: CreateRoomInventoryPayload) {
        const { data } = await httpClient.post('roominventories', payload);
        return data;
    },

    async update(id: number, payload: UpdateRoomInventoryPayload) {
        await httpClient.put(`roominventories/${id}`, payload);
    },

    async toggleActive(id: number) {
        await httpClient.patch(`roominventories/${id}/toggle-active`);
    },

    async remove(id: number) {
        await this.toggleActive(id);
    },

    async clone(idClone: number, newRoomId: number) {
        const { data } = await httpClient.post(`roominventories/clone/${idClone}/to/${newRoomId}`);
        return data;
    },
};
