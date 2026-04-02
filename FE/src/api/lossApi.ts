import type { LossRecord } from '../types/models';
import { httpClient } from './httpClient';

interface LossDto {
    id?: number | string;
    Id?: number | string;
    roomInventoryId?: number | string;
    RoomInventoryId?: number | string;
    roomId?: number | string;
    RoomId?: number | string;
    room?: string;
    Room?: string;
    roomNumber?: string;
    RoomNumber?: string;
    item?: string;
    Item?: string;
    quantity?: number;
    Quantity?: number;
    penaltyAmount?: number;
    PenaltyAmount?: number;
    description?: string;
    Description?: string;
    date?: string;
    Date?: string;
    evidence?: string;
    Evidence?: string;
    imageUrl?: string;
    ImageUrl?: string;
}

export interface CreateLossPayload {
    roomInventoryId: number;
    quantity: number;
    penaltyAmount: number;
    description?: string;
    evidenceFile?: File;
}

function mapLossDtoToRecord(dto: LossDto, index: number): LossRecord {
    const description = String(dto.description ?? dto.Description ?? 'No description');
    const directEvidence = String(dto.imageUrl ?? dto.ImageUrl ?? dto.evidence ?? dto.Evidence ?? '');

    return {
        id: String(dto.id ?? dto.Id ?? `LS-${index + 1}`),
        room: String(dto.room ?? dto.Room ?? dto.roomNumber ?? dto.RoomNumber ?? dto.roomId ?? dto.RoomId ?? ''),
        item: String(dto.item ?? dto.Item ?? 'Unknown'),
        quantity: Number(dto.quantity ?? dto.Quantity ?? 1),
        penalty: Number(dto.penaltyAmount ?? dto.PenaltyAmount ?? 0),
        description,
        date: String(dto.date ?? dto.Date ?? new Date().toISOString().slice(0, 10)),
        evidence: directEvidence,
    };
}

export const lossApi = {
    async getAll() {
        const { data } = await httpClient.get<LossDto[]>('lossanddamage');
        return data.map(mapLossDtoToRecord);
    },

    async getByRoom(roomId: number) {
        const { data } = await httpClient.get<LossDto[]>(`lossanddamage/room/${roomId}`);
        return data.map(mapLossDtoToRecord);
    },

    async create(payload: CreateLossPayload) {
        if (payload.evidenceFile) {
            const formData = new FormData();
            formData.append('roomInventoryId', String(payload.roomInventoryId));
            formData.append('quantity', String(payload.quantity));
            formData.append('penaltyAmount', String(payload.penaltyAmount));
            formData.append('description', payload.description ?? '');
            formData.append('file', payload.evidenceFile);

            await httpClient.post('lossanddamage/with-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return;
        }

        await httpClient.post('lossanddamage', {
            roomInventoryId: payload.roomInventoryId,
            quantity: payload.quantity,
            penaltyAmount: payload.penaltyAmount,
            description: payload.description,
        });
    },
};
