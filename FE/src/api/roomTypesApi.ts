import { httpClient } from './httpClient';

export interface RoomTypeItem {
    id: number;
    name: string;
}

interface RoomTypeDto {
    id?: number;
    Id?: number;
    name?: string;
    Name?: string;
}

function normalizeRoomType(dto: RoomTypeDto): RoomTypeItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
    };
}

export const roomTypesApi = {
    async getAll() {
        const { data } = await httpClient.get<RoomTypeDto[]>('roomtypes');
        return data.map(normalizeRoomType);
    },
};
