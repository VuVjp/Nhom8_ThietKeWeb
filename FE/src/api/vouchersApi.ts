import type { Voucher } from '../types/models';
import { httpClient } from './httpClient';

export interface CreateVoucherPayload {
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minBookingValue: number;
  maxDiscountValue: number;
  usageLimit: number;
  validFrom: string;
  validTo: string;
}

export interface UpdateVoucherPayload extends Partial<CreateVoucherPayload> {
  isActive?: boolean;
}

export const vouchersApi = {
  async getAll() {
    const { data } = await httpClient.get<Voucher[]>('vouchers');
    return data;
  },

  async create(payload: CreateVoucherPayload) {
    const { data } = await httpClient.post<Voucher>('vouchers', payload);
    return data;
  },

  async update(id: number, payload: UpdateVoucherPayload) {
    const { data } = await httpClient.put<Voucher>(`vouchers/${id}`, payload);
    return data;
  },

  async toggleActive(id: number) {
    const { data } = await httpClient.patch<Voucher>(`vouchers/${id}/toggle-active`);
    return data;
  },

  async validate(code: string, bookingAmount?: number) {
    const { data } = await httpClient.get<Voucher>(`vouchers/validate?code=${code}${bookingAmount !== undefined ? `&bookingAmount=${bookingAmount}` : ''}`);
    return data;
  }
};
