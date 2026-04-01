import type { CleaningRoom, InventoryItem, LossRecord, NotificationItem, RoleItem, Room, UserItem } from '../types/models';

export const notificationsSeed: NotificationItem[] = [
  { id: 1, title: 'Room 1203 updated', description: 'Status changed to Occupied', time: '2m ago', read: false },
  { id: 2, title: 'Inventory warning', description: 'Towel stock dropped below threshold', time: '9m ago', read: false },
  { id: 3, title: 'Cleaning request', description: 'Room 608 marked Dirty', time: '18m ago', read: true },
  { id: 4, title: 'Compensation created', description: 'Record LS-202 added for minibar damage', time: '35m ago', read: true },
  { id: 5, title: 'Role updated', description: 'Manager permission matrix updated', time: '1h ago', read: true },
];

const roomTypes = ['Standard', 'Deluxe', 'Suite'] as const;
const roomStatuses = ['Available', 'Occupied', 'Cleaning', 'Inspecting'] as const;
const cleaningStates = ['Clean', 'Dirty', 'Inspecting'] as const;

export const roomsSeed: Room[] = Array.from({ length: 24 }).map((_, idx) => ({
  id: idx + 1,
  roomNumber: `${Math.floor(idx / 6) + 6}${(idx % 6) + 1}0`,
  floor: Math.floor(idx / 6) + 6,
  roomType: roomTypes[idx % roomTypes.length],
  status: roomStatuses[idx % roomStatuses.length],
  cleaningStatus: cleaningStates[idx % cleaningStates.length],
}));

const categories = ['Linen', 'Bathroom', 'Electronics', 'Minibar'] as const;

export const inventorySeed: InventoryItem[] = Array.from({ length: 26 }).map((_, idx) => ({
  id: idx + 1,
  code: `ITM-${String(idx + 1).padStart(3, '0')}`,
  name: ['Bath Towel', 'Shampoo', 'Hair Dryer', 'Wine Glass'][idx % 4],
  category: categories[idx % categories.length],
  unit: idx % 2 === 0 ? 'pcs' : 'set',
  price: 20 + idx * 3,
  stock: 15 + (idx % 10),
  quantity: 2 + (idx % 5),
  compensationPrice: 30 + idx * 4,
  notes: idx % 3 === 0 ? 'Inspect weekly' : 'Ready',
}));

export const roomTemplateInventory: InventoryItem[] = [
  { id: 9001, code: 'TMP-001', name: 'Bath Towel', category: 'Linen', unit: 'pcs', price: 18, stock: 8, quantity: 8, compensationPrice: 22, notes: 'Template' },
  { id: 9002, code: 'TMP-002', name: 'Hair Dryer', category: 'Electronics', unit: 'pcs', price: 45, stock: 1, quantity: 1, compensationPrice: 65, notes: 'Template' },
  { id: 9003, code: 'TMP-003', name: 'Wine Glass', category: 'Minibar', unit: 'pcs', price: 12, stock: 4, quantity: 4, compensationPrice: 20, notes: 'Template' },
];

export const lossSeed: LossRecord[] = Array.from({ length: 18 }).map((_, idx) => ({
  id: `LS-${202 + idx}`,
  evidence: `https://picsum.photos/seed/loss-${idx + 1}/120/80`,
  room: `${7 + (idx % 5)}0${1 + (idx % 8)}`,
  item: ['Towel', 'Hair Dryer', 'Wine Glass', 'Bathrobe'][idx % 4],
  quantity: 1 + (idx % 3),
  penalty: 40 + idx * 12,
  description: 'Guest-reported damage with housekeeping confirmation',
  date: `2026-03-${String((idx % 28) + 1).padStart(2, '0')}`,
}));

export const cleaningRoomsSeed: CleaningRoom[] = Array.from({ length: 15 }).map((_, idx) => ({
  id: idx + 1,
  roomNumber: `${6 + (idx % 5)}${(idx % 9) + 1}0`,
  assignedTo: ['Emma', 'Liam', 'Olivia'][idx % 3],
  checklist: [
    { id: 'c1', label: 'Bed linen check', status: 'Normal' },
    { id: 'c2', label: 'Bathroom amenities', status: 'Normal' },
    { id: 'c3', label: 'Minibar count', status: 'Normal' },
  ],
}));

export const usersSeed: UserItem[] = Array.from({ length: 20 }).map((_, idx) => ({
  id: idx + 1,
  name: `User ${idx + 1}`,
  email: `user${idx + 1}@hotel-admin.com`,
  roleName: (['Admin', 'Manager', 'Receptionist'] as const)[idx % 3],
  status: idx % 4 === 0 ? 'Inactive' : 'Active',
}));

export const rolesSeed: RoleItem[] = [
  { id: 1, name: 'Admin', permissions: ['view_dashboard', 'view_rooms', 'manage_rooms', 'manage_inventory', 'update_cleaning', 'approve_loss', 'manage_users', 'manage_roles'] },
  { id: 2, name: 'Manager', permissions: ['view_dashboard', 'view_rooms', 'manage_rooms', 'manage_inventory', 'update_cleaning', 'approve_loss'] },
  { id: 3, name: 'Staff', permissions: ['view_dashboard', 'view_rooms', 'update_cleaning'] },
];

export const allPermissions = [
  'view_dashboard',
  'manage_rooms',
  'manage_inventory',
  'manage_users',
  'manage_roles',
  'approve_loss',
  'view_rooms',
  'update_cleaning',
];
