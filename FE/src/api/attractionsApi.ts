import { httpClient } from './httpClient';

export interface Attraction {
  id: number;
  name: string;
  description?: string;
  distanceKm?: number;
  isActive: boolean;
  mapEmbedLink?: string;
  latitude: string;
  longitude: string;
}

export interface CreateAttractionData {
  name: string;
  description?: string;
  distanceKm?: number;
  isActive: boolean;
  mapEmbedLink?: string;
  latitude: string;
  longitude: string;
}

export interface UpdateAttractionData {
  name: string;
  description?: string;
  distanceKm?: number;
  isActive?: boolean;
  mapEmbedLink?: string;
  latitude: string;
  longitude: string;
}

export const attractionsApi = {
  getAll: () => httpClient.get<Attraction[]>('/Attractions').then(res => res.data),
  getById: (id: number) => httpClient.get<Attraction>(`/Attractions/${id}`).then(res => res.data),
  create: (data: CreateAttractionData) => httpClient.post<string>('/Attractions', data).then(res => res.data),
  update: (id: number, data: UpdateAttractionData) => httpClient.put<string>(`/Attractions/${id}`, data).then(res => res.data),
  delete: (id: number) => httpClient.delete<string>(`/Attractions/${id}`).then(res => res.data),
};
