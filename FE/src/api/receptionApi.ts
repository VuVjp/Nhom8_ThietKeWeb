import { httpClient } from './httpClient';
import type { Booking, RoomAvailability, BookingStatus } from '../types/models';

export interface UpdateBookingPayload {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  roomIds: number[];
}

export const receptionApi = {
  getAvailableRooms: async (checkIn: string, checkOut: string, excludeBookingId?: number): Promise<RoomAvailability[]> => {
    const response = await httpClient.get<RoomAvailability[]>('/Bookings/available-rooms', {
      params: { checkIn, checkOut, excludeBookingId }
    });
    return response.data;
  },

  createBooking: async (data: any): Promise<Booking> => {
    const response = await httpClient.post<Booking>('/Bookings', data);
    return response.data;
  },

  updateBooking: async (id: number, data: UpdateBookingPayload): Promise<Booking> => {
    const response = await httpClient.put<Booking>(`/Bookings/${id}`, data);
    return response.data;
  },

  getArrivalsToday: async (): Promise<Booking[]> => {
    const response = await httpClient.get<Booking[]>('/Bookings/arrivals');
    return response.data;
  },

  getInHouseGuests: async (): Promise<Booking[]> => {
    const response = await httpClient.get<Booking[]>('/Bookings/in-house');
    return response.data;
  },

  getAllBookings: async (): Promise<Booking[]> => {
    const response = await httpClient.get<Booking[]>('/Bookings');
    return response.data;
  },

  changeBookingStatus: async (id: number, status: BookingStatus): Promise<void> => {
    // Backend expects just a JSON string for [FromBody] string status
    const formattedStatus = `"${status}"`;
    await httpClient.patch(`/Bookings/${id}/status`, formattedStatus, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  getActiveRooms: async (): Promise<any[]> => {
    const response = await httpClient.get<any[]>('/Bookings/active-rooms');
    return response.data;
  },
};
