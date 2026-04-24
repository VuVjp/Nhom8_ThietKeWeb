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

export interface ServiceCategoryQuery {
  search?: string;
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

  async getCategoriesPaged(query: ServiceCategoryQuery) {
    const { data } = await httpClient.get<PaginatedResult<ServiceCategory>>('servicecategories/paged', { params: query });
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

  async restoreCategory(id: number) {
    const { data } = await httpClient.patch(`servicecategories/${id}/restore`);
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

  async create(payload: { categoryId?: number; name: string; price: number; unit: string; description?: string; features?: string; image?: File }) {
    const formData = new FormData();
    if (payload.categoryId) formData.append('categoryId', payload.categoryId.toString());
    formData.append('name', payload.name);
    formData.append('price', payload.price.toString());
    formData.append('unit', payload.unit);
    if (payload.description) formData.append('description', payload.description);
    if (payload.features) formData.append('features', payload.features);
    if (payload.image) formData.append('image', payload.image);

    await httpClient.post('services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async update(id: number, payload: { categoryId?: number; name: string; price: number; unit: string; description?: string; features?: string; isActive: boolean; image?: File }) {
    const formData = new FormData();
    if (payload.categoryId) formData.append('categoryId', payload.categoryId.toString());
    formData.append('name', payload.name);
    formData.append('price', payload.price.toString());
    formData.append('unit', payload.unit);
    if (payload.description) formData.append('description', payload.description);
    if (payload.features) formData.append('features', payload.features);
    formData.append('isActive', payload.isActive.toString());
    if (payload.image) formData.append('image', payload.image);

    await httpClient.put(`services/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async delete(id: number) {
    await httpClient.delete(`services/${id}`);
  },

  async toggleServiceActive(id: number) {
    const { data } = await httpClient.patch(`services/${id}/toggle-active`);
    return data;
  },

  async restoreService(id: number) {
    const { data } = await httpClient.patch(`services/${id}/restore`);
    return data;
  },
};
