import { httpClient } from "./httpClient";
import type { Invoice, InvoiceDetail } from "../types/invoices";

export interface InvoiceQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const invoicesApi = {
  getAll: async (): Promise<Invoice[]> => {
    const response = await httpClient.get<Invoice[]>("invoices");
    return response.data;
  },
  getPaged: async (query: InvoiceQuery): Promise<PaginatedResult<Invoice>> => {
    const response = await httpClient.get<PaginatedResult<Invoice>>("invoices/paged", { params: query });
    return response.data;
  },
  getById: async (id: number): Promise<InvoiceDetail> => {
    const response = await httpClient.get<InvoiceDetail>(`invoices/${id}`);
    return response.data;
  },
  split: async (id: number): Promise<void> => {
  await httpClient.post(`invoices/${id}/split`, {});
},
  splitMultiple: async (id: number, roomDetailIds: number[]): Promise<void> => {
    await httpClient.post(`invoices/${id}/split-multiple`, roomDetailIds);
  },
  complete: async (id: number): Promise<void> => {
    await httpClient.post(`invoices/${id}/complete`);
  },
};

export default invoicesApi;
