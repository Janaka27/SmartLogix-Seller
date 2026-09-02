import { createClient } from '@/lib/supabase';

const supabase = createClient();

// The UI passes camelCase fields
export interface ProductInput {
    name: string;
    description: string;
    category: string;
    price: number;
    stockQty: number;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    fragile: boolean;
    status: string;
    images: string[];
    volumeCm3?: number;
    sellerId?: string;
    warehouseId?: string;
}

// Convert DB snake_case to UI camelCase
function mapToFrontend(dbProduct: any) {
    if (!dbProduct) return dbProduct;
    return {
        id: dbProduct.id,
        name: dbProduct.name,
        description: dbProduct.description,
        category: dbProduct.category,
        price: dbProduct.price,
        stockQty: dbProduct.stock_qty,
        weightKg: dbProduct.weight_kg,
        lengthCm: dbProduct.length_cm,
        widthCm: dbProduct.width_cm,
        heightCm: dbProduct.height_cm,
        volumeCm3: dbProduct.volume_cm3,
        fragile: dbProduct.fragile,
        images: dbProduct.images || [],
        status: dbProduct.status,
        sellerId: dbProduct.seller_id,
        warehouseId: dbProduct.warehouse_id,
        createdAt: dbProduct.created_at,
        updatedAt: dbProduct.updated_at,
    };
}

export const ProductService = {
    // Admin-only: every product across every seller, with its warehouse.
    async getAllProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*, warehouse:warehouses!products_warehouse_id_fkey ( name, city )')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all products:', error.message);
            throw new Error(error.message);
        }
        return (data || []).map((row: any) => ({
            ...mapToFrontend(row),
            warehouseName: row.warehouse?.name ?? 'Unknown warehouse',
            warehouseCity: row.warehouse?.city ?? '',
        }));
    },

    async getProducts(sellerId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error.message);
            throw new Error(error.message);
        }
        return (data || []).map(mapToFrontend);
    },

    // Warehouse-manager-facing: every product physically stored in one
    // warehouse, across all sellers — RLS scopes this to warehouses the
    // caller manages. Seller identity isn't included: a manager's products
    // RLS grant doesn't extend to reading other sellers' profile rows.
    async getProductsByWarehouse(warehouseId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('warehouse_id', warehouseId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching warehouse products:', error.message);
            throw new Error(error.message);
        }
        return (data || []).map(mapToFrontend);
    },

    async createProduct(productData: ProductInput) {
        // Map frontend camelCase to DB snake_case. Skip volumeCm3.
        const dbInput = {
            name: productData.name,
            description: productData.description,
            category: productData.category,
            price: productData.price,
            stock_qty: productData.stockQty,
            weight_kg: productData.weightKg,
            length_cm: productData.lengthCm,
            width_cm: productData.widthCm,
            height_cm: productData.heightCm,
            fragile: productData.fragile,
            status: productData.status,
            images: productData.images,
            seller_id: productData.sellerId,
            warehouse_id: productData.warehouseId,
        };

        const { data, error } = await supabase
            .from('products')
            .insert([dbInput])
            .select()
            .single();

        if (error) {
            console.error('Error saving product to database:', error.message);
            throw new Error(error.message);
        }

        return mapToFrontend(data);
    },

    async updateProduct(id: string, updates: Partial<ProductInput>) {
        const dbInput: any = {};
        
        // Map provided updates to snake_case
        if (updates.name !== undefined) dbInput.name = updates.name;
        if (updates.description !== undefined) dbInput.description = updates.description;
        if (updates.category !== undefined) dbInput.category = updates.category;
        if (updates.price !== undefined) dbInput.price = updates.price;
        if (updates.stockQty !== undefined) dbInput.stock_qty = updates.stockQty;
        if (updates.weightKg !== undefined) dbInput.weight_kg = updates.weightKg;
        if (updates.lengthCm !== undefined) dbInput.length_cm = updates.lengthCm;
        if (updates.widthCm !== undefined) dbInput.width_cm = updates.widthCm;
        if (updates.heightCm !== undefined) dbInput.height_cm = updates.heightCm;
        if (updates.fragile !== undefined) dbInput.fragile = updates.fragile;
        if (updates.status !== undefined) dbInput.status = updates.status;
        if (updates.images !== undefined) dbInput.images = updates.images;
        if (updates.sellerId !== undefined) dbInput.seller_id = updates.sellerId;
        if (updates.warehouseId !== undefined) dbInput.warehouse_id = updates.warehouseId;

        const { data, error } = await supabase
            .from('products')
            .update(dbInput)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error.message);
            throw new Error(error.message);
        }

        return mapToFrontend(data);
    }
};
