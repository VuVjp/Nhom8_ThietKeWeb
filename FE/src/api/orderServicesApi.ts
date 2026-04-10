import type { OrderService, OrderServiceStatus } from '../types/models';
import { httpClient } from './httpClient';

export interface OrderServiceQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export const orderServicesApi = {
  async getAll() {
    const { data } = await httpClient.get<OrderService[]>('orderservices');
    return data;
  },

  async getPaged(query: OrderServiceQuery) {
    const { data } = await httpClient.get<any>('orderservices', { params: query });
    return data; // returns PaginatedResultDto
  },

  async getById(id: number) {
    const { data } = await httpClient.get<OrderService>(`orderservices/${id}`);
    return data;
  },

  async create(payload: { bookingDetailId: number }) {
    const { data } = await httpClient.post<{ id: number }>('orderservices', payload);
    return data;
  },

  async addItem(id: number, payload: { serviceId: number; quantity: number }) {
    await httpClient.post(`orderservices/${id}/items`, payload);
  },

  async updateItem(id: number, serviceId: number, payload: { quantity: number }) {
    await httpClient.put(`orderservices/${id}/items/${serviceId}`, payload);
  },

  async removeItem(id: number, serviceId: number) {
    await httpClient.delete(`orderservices/${id}/items/${serviceId}`);
  },

  async changeStatus(id: number, status: OrderServiceStatus) {
    await httpClient.patch(`orderservices/${id}/status`, status, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
