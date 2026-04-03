import { httpClient } from './httpClient';

export interface EquipmentItem {
    id: number;
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    totalQuantity: number;
    inUseQuantity: number;
    damagedQuantity: number;
    liquidatedQuantity: number;
    basePrice: number;
    defaultPriceIfLost: number;
    supplier: string;
    isActive: boolean;
    imageUrl: string;
}

interface EquipmentDto {
    id?: number;
    Id?: number;
    itemCode?: string;
    ItemCode?: string;
    name?: string;
    Name?: string;
    category?: string;
    Category?: string;
    unit?: string;
    Unit?: string;
    totalQuantity?: number;
    TotalQuantity?: number;
    inUseQuantity?: number;
    InUseQuantity?: number;
    damagedQuantity?: number;
    DamagedQuantity?: number;
    liquidatedQuantity?: number;
    LiquidatedQuantity?: number;
    basePrice?: number;
    BasePrice?: number;
    defaultPriceIfLost?: number;
    DefaultPriceIfLost?: number;
    supplier?: string;
    Supplier?: string;
    isActive?: boolean;
    IsActive?: boolean;
    imageUrl?: string;
    ImageUrl?: string;
}

export interface CreateEquipmentPayload {
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    totalQuantity: number;
    basePrice: number;
    defaultPriceIfLost: number;
    supplier?: string;
    file?: File | null;
}

function normalizeEquipment(dto: EquipmentDto): EquipmentItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        itemCode: String(dto.itemCode ?? dto.ItemCode ?? ''),
        name: String(dto.name ?? dto.Name ?? ''),
        category: String(dto.category ?? dto.Category ?? ''),
        unit: String(dto.unit ?? dto.Unit ?? ''),
        totalQuantity: Number(dto.totalQuantity ?? dto.TotalQuantity ?? 0),
        inUseQuantity: Number(dto.inUseQuantity ?? dto.InUseQuantity ?? 0),
        damagedQuantity: Number(dto.damagedQuantity ?? dto.DamagedQuantity ?? 0),
        liquidatedQuantity: Number(dto.liquidatedQuantity ?? dto.LiquidatedQuantity ?? 0),
        basePrice: Number(dto.basePrice ?? dto.BasePrice ?? 0),
        defaultPriceIfLost: Number(dto.defaultPriceIfLost ?? dto.DefaultPriceIfLost ?? 0),
        supplier: String(dto.supplier ?? dto.Supplier ?? ''),
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? false),
        imageUrl: String(dto.imageUrl ?? dto.ImageUrl ?? ''),
    };
}

function toCreateFormData(payload: CreateEquipmentPayload): FormData {
    const form = new FormData();
    form.append('ItemCode', payload.itemCode);
    form.append('Name', payload.name);
    form.append('Category', payload.category);
    form.append('Unit', payload.unit);
    form.append('TotalQuantity', String(payload.totalQuantity));
    form.append('BasePrice', String(payload.basePrice));
    form.append('DefaultPriceIfLost', String(payload.defaultPriceIfLost));
    form.append('Supplier', payload.supplier ?? '');

    if (payload.file) {
        form.append('File', payload.file);
    }

    return form;
}

export interface UpdateEquipmentPayload {
    name?: string;
    category?: string;
    unit?: string;
    totalQuantity?: number;
    inUseQuantity?: number;
    damagedQuantity?: number;
    liquidatedQuantity?: number;
    basePrice?: number;
    defaultPriceIfLost?: number;
    supplier?: string;
    isActive?: boolean;
}

export const equipmentsApi = {
    async getAll() {
        const { data } = await httpClient.get<EquipmentDto[]>('equipments');
        return data.map(normalizeEquipment);
    },

    async create(payload: CreateEquipmentPayload) {
        await httpClient.post('equipments', toCreateFormData(payload), {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async update(id: number, payload: UpdateEquipmentPayload) {
        await httpClient.put(`equipments/${id}`, payload);
    },

    async toggleActive(id: number) {
        await httpClient.patch(`equipments/${id}/toggle-active`);
    },

    async remove(id: number) {
        await this.toggleActive(id);
    },
};
