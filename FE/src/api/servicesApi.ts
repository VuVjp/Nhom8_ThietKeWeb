import type { Service, ServiceCategory, PaginatedResult } from '../types/models';
import { httpClient } from './httpClient';

export interface ServiceQuery {
  search?: string;
  categoryId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  isActive?: boolean;
}

export const servicesApi = {
  // Service Categories
  async getCategories() {
    const { data } = await httpClient.get<ServiceCategory[]>('servicecategories');
    return data;
  },

  async createCategory(payload: { name: string }) {
    await httpClient.post('servicecategories', payload);
  },

  async updateCategory(id: number, payload: { name: string; isActive: boolean }) {
    await httpClient.put(`servicecategories/${id}`, payload);
  },

  async deleteCategory(id: number) {
    await httpClient.delete(`servicecategories/${id}`);
  },

  async toggleCategoryActive(id: number) {
    const { data } = await httpClient.patch(`servicecategories/${id}/toggle-active`);
    return data;
  },

  // Services
  async getPaged(query: ServiceQuery) {
    const { data } = await httpClient.get<PaginatedResult<Service>>('services', { params: query });
    return data;
  },

  async getById(id: number) {
    const { data } = await httpClient.get<Service>(`services/${id}`);
    return data;
  },

  async create(payload: { categoryId?: number; name: string; price: number; unit: string }) {
    await httpClient.post('services', payload);
  },

  async update(id: number, payload: { categoryId?: number; name: string; price: number; unit: string; isActive: boolean }) {
    await httpClient.put(`services/${id}`, payload);
  },

  async delete(id: number) {
    await httpClient.delete(`services/${id}`);
  },

  async toggleServiceActive(id: number) {
    const { data } = await httpClient.patch(`services/${id}/toggle-active`);
    return data;
  },
};
