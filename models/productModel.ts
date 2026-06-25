import pool from "../config/dbConnect.js";
import { CursorData } from "../utils/cursorUtils.js";

// Define the expected incoming parameters
interface FetchProductsParams {
    limit: number;
    cursorData: CursorData | null;
    category?: string;
    search?: string; // 1. Added search parameter
}

// Define the outgoing database row shape
export interface ProductRow {
    id: string;
    name: string;
    category: string;
    price: string;
    created_at: string;
    updated_at: string;
}

export const fetchProductsFromDB = async ({ limit, cursorData, category, search }: FetchProductsParams): Promise<ProductRow[]> => {
    let query = `SELECT id, name, category, price, created_at, updated_at FROM products`;
    const values: any[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    // Filter by category
    if (category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(category);
    }

    // 2. Filter by search term (case-insensitive partial match on the name)
    if (search) {
        conditions.push(`name ILIKE $${paramIndex++}`);
        values.push(`%${search}%`);
    }

    // Keyset pagination cursor
    if (cursorData) {
        conditions.push(`(created_at, id) < ($${paramIndex++}, $${paramIndex++})`);
        values.push(cursorData.createdAt, cursorData.id);
    }

    // Construct the WHERE clause if any conditions exist
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Finalize query with ordering and limits
    query += ` ORDER BY created_at DESC, id DESC LIMIT $${paramIndex}`;
    values.push(limit + 1);

    const { rows } = await pool.query(query, values);
    return rows;
};