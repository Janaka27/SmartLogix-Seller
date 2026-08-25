// Core domain types for the SmartLogix Seller & Admin Portal.
// Field names are camelCased versions of the Supabase schema in
// docs/SmartLogix_Two_Site_Structure_Guide.md (sections 4 and 5).

export type SellerStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Seller {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: SellerStatus;
  appliedAt: string;
  approvedAt?: string;
  warehouseIds: string[];
  payoutMethod: string;
  storeDescription: string;
  logoUrl?: string;
}

export type ProductStatus = "draft" | "active" | "out_of_stock" | "suspended";

export interface Product {
  id: string;
  sellerId: string;
  warehouseId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stockQty: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeCm3: number;
  fragile: boolean;
  images: string[];
  status: ProductStatus;
  createdAt: string;
}

// Not a literal doc field — needed so "Inventory by Warehouse" can show a
// per-warehouse breakdown. Product.stockQty stays as given (denormalized total).
export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  stockQty: number;
  reorderThreshold: number;
}

export interface Warehouse {
  id: string;
  name: string;
  sellerFacing: boolean;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  droneDockCount: number;
  chargingStation: boolean;
}

export type DroneStatus = "available" | "in_flight" | "charging" | "maintenance";

export interface Drone {
  id: string;
  droneCode: string;
  model: string;
  maxPayloadKg: number;
  cargoBayLengthCm: number;
  cargoBayWidthCm: number;
  cargoBayHeightCm: number;
  maxRangeKm: number;
  batteryCapacityPct: number;
  speedKmh: number;
  status: DroneStatus;
  homeWarehouseId: string;
  currentLat: number;
  currentLng: number;
}

export type AssignmentStatus = "queued" | "in_flight" | "delivered" | "cancelled";

export interface DroneAssignment {
  id: string;
  orderIds: string[];
  droneId: string;
  routeId: string;
  totalWeightKg: number;
  totalVolumeCm3: number;
  status: AssignmentStatus;
  departedAt?: string;
  deliveredAt?: string;
}

export type OrderStatus =
  | "pending"
  | "packed"
  | "ready_for_pickup"
  | "assigned"
  | "in_flight"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  qty: number;
  priceEach: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  sellerId: string;
  buyerName: string;
  buyerAddress: string;
  buyerLat: number;
  buyerLng: number;
  warehouseId: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  createdAt: string;
}

export type PayoutStatus = "pending" | "processing" | "paid";

export interface Payout {
  id: string;
  sellerId: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  commissionFee: number;
  netPayout: number;
  status: PayoutStatus;
  paidAt?: string;
}

export type AdminRole = "super_admin" | "ops_manager" | "support" | "finance";
export type AdminUserStatus = "active" | "invited" | "disabled";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  lastActiveAt: string;
  avatarUrl?: string;
}

export type BenchmarkAlgorithm =
  | "dijkstra"
  | "a_star"
  | "bellman_ford"
  | "prim"
  | "knapsack"
  | "simulated_annealing"
  | "decision_tree";

export interface BenchmarkLog {
  id: string;
  algorithm: BenchmarkAlgorithm;
  runAt: string;
  inputSizeN: number;
  executionTimeMs: number;
  resultSummary: string;
  success: boolean;
}
