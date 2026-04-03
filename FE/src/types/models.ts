export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Inspecting' | 'Maintenance';
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
  cleaningStatus: 'Clean' | 'Dirty' | 'Inspecting';
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
  item: string;
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
