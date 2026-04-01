export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Inspecting';
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
  roomType: 'Standard' | 'Deluxe' | 'Suite';
  status: RoomStatus;
  cleaningStatus: 'Clean' | 'Dirty' | 'Inspecting';
}

export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  category: 'Linen' | 'Bathroom' | 'Electronics' | 'Minibar';
  unit: string;
  price: number;
  stock: number;
  quantity: number;
  compensationPrice: number;
  notes: string;
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
