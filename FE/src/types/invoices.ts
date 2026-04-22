export interface Invoice {
  id: number;
  bookingId: number;
  invoiceCode: string;
  guestName: string;
  bookingCode: string;
  totalRoomAmount: number;
  totalServiceAmount: number;
  totalLossDamageAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalTotal: number;
  paidAmount?: number;
  allocatedDeposit?: number;
  remainingAmount?: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  isSplit: boolean;
  roomNumber?: string;
}

export interface InvoiceRoomDetail {
  id: number;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  actualCheckOut?: string;
  pricePerNight: number;
  subtotal: number;
}

export interface InvoiceServiceDetail {
  serviceName: string;
  quantity: number;
  price: number;
  total: number;
  orderDate: string;
}

export interface InvoiceLossDamageDetail {
  itemName: string;
  quantity: number;
  penaltyAmount: number;
  description?: string;
}

export interface InvoiceDetail extends Invoice {
  roomDetails: InvoiceRoomDetail[];
  serviceDetails: InvoiceServiceDetail[];
  lossDamageDetails: InvoiceLossDamageDetail[];
}
