export type RoomStatus = 'Available' | 'Occupied' | 'InsClean' | 'Maintenance';
export type CleaningCondition = 'Normal' | 'Damaged' | 'Missing';

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  roomType: string;
  roomTypeId?: number;
  status: RoomStatus;
  cleaningStatus: 'Clean' | 'Dirty' | 'Inspecting' | 'Cleaning';
  cleaningRequested: boolean;
}

export interface InventoryItem {
  id: number;
  roomId?: number;
  equipmentId?: number;
  amenityId?: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  quantity: number;
  compensationPrice: number;
  notes: string;
  isActive: boolean;
}

export interface LossRecord {
  id: string;
  evidence: string;
  room: string;
  itemName: string;
  quantity: number;
  penalty: number;
  description: string;
  date: string;
}

export interface CleaningRoom {
  id: number;
  roomNumber: string;
  assignedTo: string;
  checklist: Array<{ id: string; label: string; status: CleaningCondition }>;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  roleName: string;
  status: 'Active' | 'Inactive';
}

export interface RoleItem {
  id: number;
  name: string;
  permissions: string[];
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';

export interface Booking {
  voucherId?: string;
  id: number;
  IsExistingGuest: boolean;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  totalAmount: number;
  deposit: number;
  membershipDiscount: number;
  voucherDiscount: number;
  roomIds: number[];
  roomNumbers: string[];
  createdAt: string;
}

export interface RoomAvailability {
  roomId: number;
  roomNumber: string;
  roomTypeName: string;
  pricePerNight: number;
}

export interface Voucher {
  id: number | string;
  code: string;
  discountType: 'Percentage' | 'Fixed' | string;
  discountValue: number;
  minBookingValue: number;
  maxDiscountValue: number; // 0 = no cap
  usageLimit: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface ServiceCategory {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Service {
  id: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  price: number;
  unit: string;
  isActive: boolean;
}

export type OrderServiceStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface OrderServiceDetail {
  id: number;
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  subTotal: number;
}

export interface OrderService {
  id: number;
  bookingDetailId?: number;
  roomNumber?: string;
  guestName?: string;
  bookingStatus?: BookingStatus;
  orderDate: string;
  totalAmount: number;
  status: OrderServiceStatus;
  details?: OrderServiceDetail[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

