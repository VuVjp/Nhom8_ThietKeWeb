import { httpClient } from './httpClient';

export type MomoPaymentType = 'booking' | 'invoice';

export interface MomoCreatePaymentPayload {
  type: MomoPaymentType;
  targetId: number;
}

export interface MomoCreatePaymentResponse {
  payUrl: string;
  orderId: string;
  requestId: string;
  amount: number;
  type: MomoPaymentType;
}

export interface CashPaymentPayload {
  type: MomoPaymentType;
  targetId: number;
  amount?: number;
}

const momoApi = {
  createPayment: async (payload: MomoCreatePaymentPayload): Promise<MomoCreatePaymentResponse> => {
    const response = await httpClient.post<MomoCreatePaymentResponse>('/momo/create', payload);
    return response.data;
  },
  payCash: async (payload: CashPaymentPayload): Promise<void> => {
    await httpClient.post('/momo/cash', payload);
  },
};

export default momoApi;
