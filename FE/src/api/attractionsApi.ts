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
  imageUrl?: string;
}

export interface CreateAttractionData {
  name: string;
  description?: string;
  distanceKm?: number;
  isActive: boolean;
  mapEmbedLink?: string;
  latitude: string;
  longitude: string;
  file?: File;
}

export interface UpdateAttractionData {
  name: string;
  description?: string;
  distanceKm?: number;
  isActive?: boolean;
  mapEmbedLink?: string;
  latitude: string;
  longitude: string;
  file?: File;
}

function toFormData(data: any): FormData {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      if (key === 'file') {
        formData.append('File', data[key]);
      } else {
        // Uppercase first letter for C# model binding
        const csKey = key.charAt(0).toUpperCase() + key.slice(1);
        formData.append(csKey, String(data[key]));
      }
    }
  });
  return formData;
}

export const attractionsApi = {
  getAll: () => httpClient.get<Attraction[]>('/Attractions').then(res => res.data),
  getById: (id: number) => httpClient.get<Attraction>(`/Attractions/${id}`).then(res => res.data),
  create: (data: CreateAttractionData) => httpClient.post<string>('/Attractions', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  update: (id: number, data: UpdateAttractionData) => httpClient.put<string>(`/Attractions/${id}`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  delete: (id: number) => httpClient.delete<string>(`/Attractions/${id}`).then(res => res.data),
};
