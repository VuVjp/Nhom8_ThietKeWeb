import type { LossRecord } from '../types/models';
import { httpClient } from './httpClient';

interface LossDto {
    id?: string;
    Id?: string;
    room?: string;
    Room?: string;
    roomNumber?: string;
    RoomNumber?: string;
    item?: string;
    Item?: string;
    quantity?: number;
    Quantity?: number;
    penalty?: number;
    Penalty?: number;
    description?: string;
    Description?: string;
    date?: string;
    Date?: string;
    evidence?: string;
    Evidence?: string;
    imageUrl?: string;
    ImageUrl?: string;
}

function mapLossDtoToRecord(dto: LossDto, index: number): LossRecord {
    return {
        id: String(dto.id ?? dto.Id ?? `LS-${index + 1}`),
        room: String(dto.room ?? dto.Room ?? dto.roomNumber ?? dto.RoomNumber ?? ''),
        item: String(dto.item ?? dto.Item ?? 'Unknown'),
        quantity: Number(dto.quantity ?? dto.Quantity ?? 1),
        penalty: Number(dto.penalty ?? dto.Penalty ?? 0),
        description: String(dto.description ?? dto.Description ?? 'No description'),
        date: String(dto.date ?? dto.Date ?? new Date().toISOString().slice(0, 10)),
        evidence: String(dto.evidence ?? dto.Evidence ?? dto.imageUrl ?? dto.ImageUrl ?? ''),
    };
}

export const lossApi = {
    async getAll() {
        const { data } = await httpClient.get<LossDto[]>('lossanddamage');
        return data.map(mapLossDtoToRecord);
    },
};
